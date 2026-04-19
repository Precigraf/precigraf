
## Objetivo
Reaplicar as chaves do Stripe em produção no projeto correto e eliminar a causa mais provável do problema: o app e a configuração de deploy das funções estão apontando para projetos diferentes.

## O que identifiquei
- O app está conectado ao backend `udeslpcxefsjtvefqcqh` (`VITE_SUPABASE_URL` e `VITE_SUPABASE_PROJECT_ID`).
- Mas `supabase/config.toml` está com `project_id = "bnknukftvojrfvedjsba"`.
- Isso pode fazer as funções/segredos serem atualizados em um projeto enquanto o site publicado usa outro, mantendo o checkout em teste.

## Plano

### 1. Corrigir o destino das funções
- Ajustar `supabase/config.toml` para usar o mesmo project ID do app (`udeslpcxefsjtvefqcqh`).
- Revisar o workflow `.github/workflows/deploy-supabase-functions.yml` para garantir que ele também publique no projeto certo.

### 2. Regravar as chaves live
No backend correto, atualizar novamente:
- `STRIPE_SECRET_KEY` com `sk_live_...`
- `STRIPE_PRICE_ID` com o `price_...` criado em modo live
- `STRIPE_WEBHOOK_SECRET` com o `whsec_...` do webhook live

### 3. Garantir que todas as funções usem as novas chaves
Reimplantar as funções que dependem do Stripe:
- `create-stripe-checkout`
- `stripe-webhook`
- `customer-portal`

### 4. Validar ponta a ponta
- Abrir `/upgrade` e iniciar o checkout.
- Confirmar que a página do Stripe não mostra mais “modo de teste”.
- Fazer uma cobrança real de validação.
- Confirmar que o webhook atualiza o plano do usuário para Pro.

## Resultado esperado
- O checkout abre em produção.
- O portal do cliente também usa produção.
- O webhook processa eventos live corretamente.

## Detalhes técnicos
O código atual não força “test mode”; ele só lê `STRIPE_SECRET_KEY` e `STRIPE_PRICE_ID`. Então, se ainda aparece teste, o problema é quase certamente um destes:
1. chave live salva no lugar errado;
2. deploy indo para outro projeto;
3. `price_id` ainda é de teste.

Quando você aprovar, eu faço essa correção de configuração e a reaplicação no ambiente certo.
