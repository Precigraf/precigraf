## Objetivo

Garantir que o link "Para Cliente Acompanhar" sempre use o domínio oficial `https://precigraf.com.br`, nunca exibindo domínios `lovable.app` (preview ou published), independentemente de onde o sistema esteja sendo acessado.

## Alteração

**Arquivo**: `src/components/gestao/OrderDetailsModal.tsx`

- Substituir todas as ocorrências de `window.location.origin` (no Input e no `navigator.clipboard.writeText`) por uma constante fixa.
- Adicionar no topo do arquivo:
  ```tsx
  const TRACKING_BASE_URL = 'https://precigraf.com.br';
  ```
- Construir o link como:
  ```tsx
  const trackingLink = `${TRACKING_BASE_URL}/pedido/${order.tracking_token}`;
  ```
- Usar `trackingLink` tanto no `<Input value={...}>` quanto no botão de copiar.

## Resultado

- Link exibido e copiado: `https://precigraf.com.br/pedido/<token>`
- Nenhum domínio `lovable.app` aparece, mesmo quando o painel é acessado via preview ou published Lovable.
- A página pública `/pedido/:token` continua funcionando normalmente, pois o domínio customizado já aponta para o app.

## Arquivos editados

- `src/components/gestao/OrderDetailsModal.tsx`
