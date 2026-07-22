
# Follow-up Automático de Orçamentos via WhatsApp

## Visão geral

Quando um orçamento é enviado (link público gerado ou PDF baixado), o sistema marca `sent_at` e agenda um follow-up. Após X horas configuráveis (padrão 24h), um cron roda uma Edge Function que revalida o status, respeita janela horária/dias úteis, envia via **WhatsApp Cloud API (Meta)** usando template aprovado, e registra tudo no histórico.

## Configuração inicial (usuário)

Antes de funcionar, o usuário precisará:
1. Ter uma conta **Meta Business + WhatsApp Business Account** com número aprovado.
2. Cadastrar um **template HSM** aprovado pela Meta (mensagens iniciadas fora da janela de 24h exigem template). Vamos guiá-lo a criar um template chamado `orcamento_followup` com 1 variável (nome) — o texto padrão será fornecido.
3. Fornecer 3 secrets: `WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_BUSINESS_ACCOUNT_ID`, `WHATSAPP_ACCESS_TOKEN` (token permanente do System User).

## Banco de dados (migração)

Novas colunas em `quotes`:
- `sent_at timestamptz` — quando o link/PDF foi gerado pela 1ª vez.
- `followup_scheduled_at timestamptz` — quando o próximo envio deve ocorrer.
- `followup_sent_count int default 0`.
- `client_responded_at timestamptz` — marcado manualmente pelo usuário ("cliente respondeu").

Nova tabela `quote_followup_settings` (1 por user):
- `user_id uuid PK`, `enabled bool default true`
- `delay_hours int default 24`
- `message_template text` (com variáveis {nome_cliente} etc.)
- `whatsapp_template_name text` (nome HSM na Meta, ex: `orcamento_followup`)
- `whatsapp_template_lang text default 'pt_BR'`
- `send_window_start time default '08:00'`, `send_window_end time default '18:00'`
- `business_days_only bool default true`
- `timezone text default 'America/Sao_Paulo'`

Nova tabela `quote_followup_logs`:
- `id`, `quote_id`, `user_id`, `sent_at`, `message_rendered text`, `status text` (`success`|`error`|`skipped`), `error_message text`, `whatsapp_message_id text`.

RLS: tudo escopado por `user_id`, GRANTs padrão para authenticated + service_role.

## Backend: Edge Functions

**1. `whatsapp-send-followup`** (cron, verify_jwt=false, service_role):
- Roda a cada 15 min via pg_cron + pg_net.
- Seleciona quotes onde `followup_scheduled_at <= now()`, `status='pending'`, `client_responded_at IS NULL`, `followup_sent_count = 0`, respeitando janela horária e dias úteis do settings do dono.
- Renderiza template substituindo variáveis: `{nome_cliente}`, `{numero_orcamento}`, `{valor}`, `{empresa}`, `{link_orcamento}` (`/orcamento/{public_token}`), `{telefone}`.
- Chama Meta Graph API `POST /{phone_number_id}/messages` com type=`template`, nome do template e parâmetros. Se a mensagem customizada divergir do template aprovado, envia o template padrão (a Meta exige match exato) — o campo "mensagem" no admin serve para o preview/histórico e para futura mensagem livre dentro da janela.
- Grava em `quote_followup_logs` e incrementa `followup_sent_count`.
- Trata erros HTTP da Meta e registra em `error_message`.

**2. `quote-mark-sent`** (chamada do frontend ao gerar link/baixar PDF):
- Se `sent_at IS NULL`, seta `sent_at=now()` e `followup_scheduled_at = now() + delay_hours` conforme settings.
- Idempotente.

**3. Cron job** via `supabase--insert`:
```sql
select cron.schedule('whatsapp-followup-tick', '*/15 * * * *', $$ ... net.http_post ... $$);
```

## Frontend

**Nova página `/configuracoes/followup`** (`src/pages/FollowupSettings.tsx`):
- Toggle ativar/desativar.
- Slider/input de "horas até o 1º lembrete".
- Textarea da mensagem com chips clicáveis para inserir variáveis.
- Campo do nome do template Meta + idioma.
- Time pickers janela permitida.
- Toggle "somente dias úteis".
- Botão "Testar envio" (envia para o próprio WhatsApp do perfil).
- Link no `AppSidebar` dentro de Configurações ou aba em Perfil.

**Marcação de "enviado"**:
- Em `OrcamentoEditor.tsx`, ao clicar em "Copiar link público" / "Baixar PDF" / "Enviar por WhatsApp", chamar `quote-mark-sent`.
- Badge visual no card do orçamento: "Follow-up agendado para {data}" ou "Follow-up enviado em {data}".

**Botão "Marcar como respondido"** na lista de orçamentos (`src/pages/Orcamentos.tsx`) — seta `client_responded_at=now()`, cancela follow-up.

**Histórico**: nova aba/seção no detalhe do orçamento mostrando `quote_followup_logs` (data, mensagem enviada, status, erro se houver).

## Regras de segurança / anti-duplicidade

- `followup_sent_count` bloqueia reenvio.
- Revalida `status='pending'` e `client_responded_at IS NULL` **dentro da mesma query** que atualiza o log (com transação/CTE) para evitar race.
- Se `approved/rejected/cancelled` antes do prazo → automaticamente ignorado pelo filtro.

## Detalhes técnicos

- **Substituição de variáveis**: helper `renderTemplate(text, ctx)` compartilhado (edge + frontend preview).
- **Formato do WhatsApp**: número normalizado E.164 (`55XXXXXXXXXXX`), pego de `clients.whatsapp` (fallback erro se vazio).
- **Timezone**: cálculos de janela horária usando `America/Sao_Paulo` via `Intl.DateTimeFormat` na edge function.
- **Dias úteis**: seg-sex simples (feriados fora do escopo desta v1).
- **Secrets**: solicitados via `add_secret` após aprovação do plano.

## O que fica fora desta v1

- Múltiplos lembretes escalonados (só o 1º de 24h). Estrutura de `followup_sent_count` já prepara para v2.
- Recepção de respostas via webhook da Meta (marcar respondido automaticamente) — pode ser adicionado depois.
- Feriados nacionais.

## Ordem de implementação

1. Migração DB (colunas + tabelas + RLS + GRANTs).
2. `add_secret` para credenciais Meta.
3. Edge `quote-mark-sent` + integração nos botões do editor.
4. Página de configurações + link no sidebar.
5. Edge `whatsapp-send-followup` + cron job.
6. UI de histórico e botão "marcar respondido".
7. Botão "Testar envio".
