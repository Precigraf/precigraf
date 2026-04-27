import { execFileSync } from 'node:child_process';

const BASE_URL = (process.env.TRACKING_TEST_BASE_URL || 'https://precigraf.com.br').replace(/\/$/, '');
const USER_AGENT = 'PreciGraf tracking-route-smoke-test/1.0 (+https://precigraf.com.br)';

async function fetchText(url) {
  const response = await fetch(url, {
    redirect: 'follow',
    headers: { 'User-Agent': USER_AGENT },
  });

  const text = await response.text();
  return { response, text };
}

function getTokenFromDatabase() {
  try {
    const output = execFileSync(
      'psql',
      [
        '-Atc',
        "SELECT tracking_token FROM public.orders WHERE tracking_token IS NOT NULL ORDER BY created_at DESC LIMIT 1;",
      ],
      { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] },
    ).trim();

    return output || null;
  } catch {
    return null;
  }
}

function getTrackingToken() {
  const token = process.env.TRACKING_TEST_TOKEN?.trim() || getTokenFromDatabase();

  if (!token) {
    throw new Error(
      'Defina TRACKING_TEST_TOKEN com um token real de pedido para validar a rota publicada.',
    );
  }

  return token;
}

function extractScriptSources(html) {
  const sources = [];
  const scriptRegex = /<script[^>]+src=["']([^"']+)["'][^>]*>/gi;
  let match;

  while ((match = scriptRegex.exec(html)) !== null) {
    sources.push(match[1]);
  }

  return sources;
}

function resolveAssetUrl(src) {
  if (src.startsWith('http://') || src.startsWith('https://')) return src;
  return `${BASE_URL}${src.startsWith('/') ? '' : '/'}${src}`;
}

const token = getTrackingToken();
const trackingUrl = `${BASE_URL}/pedido/${token}`;

console.log(`Validando rota publicada: ${trackingUrl}`);

const { response, text: html } = await fetchText(trackingUrl);

if (response.status !== 200) {
  throw new Error(`A rota publicada retornou HTTP ${response.status}. Esperado: 200.`);
}

if (!html.includes('id="root"')) {
  throw new Error('A resposta publicada não parece ser o app React esperado.');
}

if (html.includes('Página não encontrada')) {
  throw new Error('A resposta inicial já contém a página 404 do app.');
}

const scriptSources = extractScriptSources(html);

if (scriptSources.length === 0) {
  throw new Error('Nenhum bundle JavaScript foi encontrado na página publicada.');
}

const routeMarkers = [
  '/pedido/:token',
  'get_order_by_tracking_token',
  'Área do Cliente',
  'Pedido realizado em:',
];

let publishedBundleContainsTrackingRoute = false;

for (const src of scriptSources) {
  const assetUrl = resolveAssetUrl(src);
  const { response: assetResponse, text: assetText } = await fetchText(assetUrl);

  if (assetResponse.status !== 200) {
    throw new Error(`Bundle publicado não carregou (${assetResponse.status}): ${assetUrl}`);
  }

  if (routeMarkers.some((marker) => assetText.includes(marker))) {
    publishedBundleContainsTrackingRoute = true;
    break;
  }
}

if (!publishedBundleContainsTrackingRoute) {
  throw new Error(
    'A versão publicada não contém a rota/página de rastreio. Publique a versão atual do app novamente.',
  );
}

console.log('OK: /pedido/:token existe na versão publicada e o link real retorna HTTP 200.');
