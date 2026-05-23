
## 1. Remover pré-visualização do logo em /perfil

Em `src/pages/Perfil.tsx`, remover o bloco de Pré-visualização (PDF / link de aprovação) — o card com zoom + / − / reset (linhas ~297-330). Também remover os imports e estados não mais usados: `ZoomIn`, `ZoomOut`, `RotateCcw`, função `adjustScale`. Manter `logo_scale` salvo no banco (sem alterar schema) usando o valor atual do perfil ao salvar — apenas a UI de ajuste é removida.

## 2. Excluir itens dentro do pedido (visualizar)

Em `src/components/gestao/OrderDetailsModal.tsx`, na tabela de "Itens do pedido", adicionar uma coluna de ação com botão lixeira por linha, abrindo um `AlertDialog` de confirmação.

Em `src/hooks/useOrders.ts`, criar mutation `removeItemFromOrder({ orderId, itemId })` espelhando `addItemToOrder`:
- Lê `quotes.items`, filtra pelo `id` do item.
- Recalcula `total_revenue = soma(quantity * unit_value) - desconto + frete`.
- Recalcula `amount_pending = max(0, total_revenue - amount_received)`.
- Atualiza `quotes.items` e `orders.total_revenue / amount_pending`.
- Invalida `orders` e `quotes`.

Bloqueia exclusão quando só restar 1 item (mostra toast "Pedido precisa ter pelo menos um item").

## 3. Registro de entradas manuais em /financeiro

Objetivo: permitir lançar uma receita avulsa (venda de balcão, serviço pontual) sem passar pelo fluxo Orçamento → Aprovação → Pedido. A entrada cai naturalmente em **Faturamento** e entra no cálculo de **Lucro Líquido = Faturamento − Despesas**, seguindo o modelo que `Financeiro.tsx` já usa (itera `orders`).

### Estratégia: reaproveitar `orders` + `quotes`

Em vez de criar tabela nova, criar internamente um `quote` + `order` "manual" já marcado como entregue e pago. Isso garante:
- Aparece na lista de Pedidos com numeração `PED-xxx`.
- Entra em Financeiro automaticamente (sem mudar `Financeiro.tsx`).
- Respeita RLS existente.

### UI

Novo botão **"Registrar entrada"** no header de `src/pages/Financeiro.tsx`, ao lado do `PeriodFilter`. Abre `src/components/financeiro/ManualEntryModal.tsx` (novo):

Campos:
- **Cliente** — `Select` com clientes existentes (`useClients`) + opção "+ Novo cliente rápido" (abre `ClientForm` reaproveitado, ou input simples só com nome).
- **Data da entrada** — date picker (default hoje); grava em `orders.created_at`.
- **Itens** — lista dinâmica (mesmo padrão do `QuoteForm`): descrição (texto livre OU select de produto via `useProducts`), quantidade, valor unitário. Botão "+ Adicionar item".
- **Custo total (opcional)** — input numérico único para `total_cost` (ex: custo do material vendido). Default 0.
- **Recebido** — radio "Recebido integralmente" (default) / "Parcialmente" (input valor) / "A receber". Define `amount_received` e `amount_pending`.
- **Observação** — textarea (grava em `quotes.notes`).

Rodapé do modal mostra Subtotal, Custo, **Lucro previsto** em tempo real.

### Mutation `createManualEntry` em novo hook `src/hooks/useManualEntries.ts`

Em uma sequência:
1. INSERT em `quotes` com `status='approved'`, `items=[...]`, `subtotal`, `total_value`, `product_name` = primeiro item, `notes`.
2. INSERT em `orders` com `quote_id`, `client_id`, `status='delivered'`, `total_revenue`, `total_cost`, `amount_received`, `amount_pending`, `created_at` da data escolhida.
3. Se `amount_pending > 0`, cria uma `receivables` com `due_date` (campo extra opcional no modal, default = data da entrada).
4. Invalida `orders`, `quotes`, `receivables`.

### Distinção visual (opcional, leve)

Em `Pedidos.tsx` e `Financeiro.tsx`, badge "Manual" quando `quotes.raw_data?.manual_entry === true` (gravado no insert). Não bloqueia nada, só sinaliza origem.

## Como aproveitar bem essa função

- **Vendas de balcão / pronta entrega**: registrar venda no ato sem montar orçamento.
- **Serviços recorrentes** (manutenção, consultoria, design avulso): lançar mensalmente em poucos cliques.
- **Receitas históricas**: ao começar a usar o sistema, popular o financeiro com vendas antigas escolhendo a data passada.
- **Vendas extras de produtos já cadastrados**: selecionar produto do catálogo puxa preço automaticamente.
- **Controle de inadimplência**: marcar como "A receber" cria a parcela em Contas a Receber, integrando com o módulo existente.
- **Lucro real**: informar o custo no momento da entrada mantém Lucro Líquido correto no card de Financeiro.

## Arquivos afetados

- `src/pages/Perfil.tsx` — remover pré-visualização e helpers de zoom.
- `src/components/gestao/OrderDetailsModal.tsx` — botão excluir item por linha.
- `src/hooks/useOrders.ts` — mutation `removeItemFromOrder`.
- `src/pages/Financeiro.tsx` — botão "Registrar entrada" no header.
- `src/components/financeiro/ManualEntryModal.tsx` — novo modal.
- `src/hooks/useManualEntries.ts` — novo hook com `createManualEntry`.

Sem migrations: usa tabelas e RLS existentes.
