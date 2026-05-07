#!/usr/bin/env node
/**
 * Integração: rota pública /orcamento/:token
 *
 * Garante que:
 *  1. A RPC `get_quote_by_token` resolve um token real via HTTPS (Supabase).
 *  2. O payload retornado tem o formato esperado pela página AprovacaoOrcamento.
 *  3. A URL pública do app (precigraf.com.br/orcamento/:token) responde 200
 *     e o bundle publicado contém os marcadores da página de aprovação.
 *
 * Uso:
 *   QUOTE_APPROVAL_TEST_TOKEN=<uuid> node scripts/verify-quote-approval-route.mjs
 *
 * Se QUOTE_APPROVAL_TEST_TOKEN não for definido, busca o público mais recente
 * via `psql` (quando disponível).
 */
import { execFileSync } from 'node:child_process';

const SUPABASE_URL = (process.env.VITE_SUPABASE_URL || 'https://udeslpcxefsjtvefqcqh.supabase.co').replace(/\/$/, '');
const SUPABASE_ANON_KEY =
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVkZXNscGN4ZWZzanR2ZWZxY3FoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc5MTMzNzgsImV4cCI6MjA4MzQ4OTM3OH0.WwbbB13epVolWlqac0qPNhxJCm-iFA_ghwddzBOJkN0';
const PUBLIC_BASE_URL = (process.env.VITE_PUBLIC_BASE_URL || 'https://precigraf.com.br').replace(/\/$/, '');
const UA = 'PreciGraf quote-approval-route-test/1.0';

function getTokenFromDb() {
  try {
    const out = execFileSync(
      'psql',
      ['-Atc', "SELECT public_token FROM public.quotes WHERE public_token IS NOT NULL ORDER BY created_at DESC LIMIT 1;"],
      { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] },
    ).trim();
    return out || null;
  } catch {
    return null;
  }
}

function getToken() {
  const t = process.env.QUOTE_APPROVAL_TEST_TOKEN?.trim() || getTokenFromDb();
  if (!t) throw new Error('Defina QUOTE_APPROVAL_TEST_TOKEN com um public_token real de orçamento.');
  return t;
}

function assert(cond, msg) {
  if (!cond) throw new Error(`Falha de asserção: ${msg}`);
}

async function testRpcOverHttps(token) {
  const url = `${SUPABASE_URL}/rest/v1/rpc/get_quote_by_token`;
  assert(url.startsWith('https://'), 'RPC precisa ser via HTTPS');

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify({ p_token: token }),
  });

  assert(res.ok, `RPC retornou HTTP ${res.status}`);
  const data = await res.json();
  assert(data && typeof data === 'object', 'RPC não retornou objeto JSON');
  assert(data.id, 'Payload sem campo id');
  assert('status' in data, 'Payload sem campo status');
  assert('total_value' in data, 'Payload sem campo total_value');
  assert(Array.isArray(data.items), 'Payload sem array items');
  assert(data.client && typeof data.client === 'object', 'Payload sem objeto client');
  assert(data.seller && typeof data.seller === 'object', 'Payload sem objeto seller');
  console.log(`  ✓ RPC HTTPS OK (status=${data.status}, items=${data.items.length})`);
}

async function testRpcInvalidToken() {
  const url = `${SUPABASE_URL}/rest/v1/rpc/get_quote_by_token`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify({ p_token: '00000000-0000-0000-0000-000000000000' }),
  });
  assert(res.ok, `RPC com token inválido deveria responder 200 (com null), retornou ${res.status}`);
  const data = await res.json();
  assert(data === null, 'RPC com token inválido deveria retornar null');
  console.log('  ✓ Token inválido retorna null');
}

async function testPublishedRoute(token) {
  const url = `${PUBLIC_BASE_URL}/orcamento/${token}`;
  assert(url.startsWith('https://'), 'URL pública precisa ser HTTPS');

  const res = await fetch(url, { redirect: 'follow', headers: { 'User-Agent': UA } });
  assert(res.status === 200, `Rota publicada retornou HTTP ${res.status}`);
  const html = await res.text();
  assert(html.includes('id="root"'), 'Resposta não parece ser o app React');
  assert(!html.includes('Página não encontrada'), 'HTML inicial já contém 404');

  // Verifica se o bundle publicado contém marcadores da página de aprovação
  const scriptSrcs = [...html.matchAll(/<script[^>]+src=["']([^"']+)["']/gi)].map((m) => m[1]);
  assert(scriptSrcs.length > 0, 'Nenhum bundle JS encontrado');

  const markers = ['/orcamento/:token', 'get_quote_by_token', 'respond_to_quote_by_token', 'Aprovar orçamento'];
  let found = false;
  for (const src of scriptSrcs) {
    const assetUrl = src.startsWith('http') ? src : `${PUBLIC_BASE_URL}${src.startsWith('/') ? '' : '/'}${src}`;
    const r = await fetch(assetUrl, { headers: { 'User-Agent': UA } });
    if (!r.ok) continue;
    const text = await r.text();
    if (markers.some((m) => text.includes(m))) { found = true; break; }
  }
  assert(found, 'Bundle publicado NÃO contém a página /orcamento/:token. Republique o app.');
  console.log('  ✓ Rota publicada HTTPS responde 200 e contém a página de aprovação');
}

(async () => {
  const token = getToken();
  console.log(`Testando token: ${token}`);

  console.log('\n[1/3] RPC get_quote_by_token via HTTPS');
  await testRpcOverHttps(token);

  console.log('\n[2/3] RPC com token inválido');
  await testRpcInvalidToken();

  if (process.env.SKIP_PUBLISHED_CHECK === '1') {
    console.log('\n[3/3] Verificação de produção pulada (SKIP_PUBLISHED_CHECK=1)');
  } else {
    console.log(`\n[3/3] Rota publicada ${PUBLIC_BASE_URL}/orcamento/:token`);
    await testPublishedRoute(token);
  }

  console.log('\n✅ Todos os testes passaram.');
})().catch((err) => {
  console.error(`\n❌ ${err.message}`);
  process.exit(1);
});
