
## Objetivo
Sair do modo de teste do Stripe e ativar o modo de produção (live) para que pagamentos reais sejam processados.

## Contexto
O checkout Stripe está funcionando em modo teste (cartões de teste). O erro mostrado ("Seu cartão foi recusado. Sua solicitação estava no modo de teste") confirma que as chaves atuais (`STRIPE_SECRET_KEY` e `STRIPE_WEBHOOK_SECRET`) são `sk_test_...` e `whsec_...` do ambiente de teste.

## O que precisa ser feito

A troca para modo live é uma **configuração de secrets** — não envolve mudança de código. As edge functions (`create-stripe-checkout` e `stripe-webhook`) já estão prontas para funcionar com qualquer ambiente; basta substituir as chaves.

### Passos

1. **No painel do Stripe (dashboard.stripe.com)**:
   - Alternar o toggle **"Test mode"** para **OFF** (canto superior direito).
   - Em **Developers → API keys**, copiar a **Secret key** que começa com `sk_live_...`.
   - Em **Products**, recriar (ou ativar) o produto/preço de assinatura no modo live e copiar o novo `price_id` (`price_...`) — IDs de teste **não funcionam** em live.
   - Em **Developers → Webhooks**, criar um novo endpoint de webhook em modo live apontando para a URL atual da função `stripe-webhook` (a mesma URL já cadastrada no modo teste). Selecionar os eventos:
     - `checkout.session.completed`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
     - `invoice.payment_failed`
   - Copiar o **Signing secret** (`whsec_...`) do novo webhook.

2. **Atualizar 3 secrets no projeto Lovable Cloud**:
   - `STRIPE_SECRET_KEY` → nova `sk_live_...`
   - `STRIPE_PRICE_ID` → novo `price_...` do modo live
   - `STRIPE_WEBHOOK_SECRET` → novo `whsec_...` do webhook live

3. **Validação**:
   - Tentar uma assinatura real (R$ 15,90) com cartão real.
   - Verificar nos logs da função `stripe-webhook` que `checkout.session.completed` foi recebido e processado.
   - Confirmar que o perfil do usuário foi atualizado para `pro` no banco.

## Não precisa alterar
- Código das edge functions (`create-stripe-checkout`, `stripe-webhook`).
- Página `Upgrade.tsx`.
- Schema do banco / RPCs (`activate_monthly_subscription`, `update_subscription_status`).

## Próximo passo (após aprovar este plano)
Vou solicitar a atualização dos 3 secrets via ferramenta segura. Tenha em mãos:
- `sk_live_...` (Stripe Secret Key live)
- `price_...` (Price ID do produto em modo live)
- `whsec_...` (Webhook signing secret live)
