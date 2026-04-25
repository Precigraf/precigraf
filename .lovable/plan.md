
## 1. Remover módulo de Estoque

**Migração SQL** (`DROP` na ordem correta):
- `DROP TRIGGER` que aciona `apply_inventory_movement`
- `DROP FUNCTION public.apply_inventory_movement()`
- `DROP TABLE public.product_materials`
- `DROP TABLE public.inventory_movements`
- `DROP TABLE public.inventory_materials`

**Arquivos removidos:**
- `src/pages/Estoque.tsx`
- `src/components/estoque/MaterialForm.tsx`
- `src/components/estoque/MovementForm.tsx`
- `src/hooks/useInventory.ts`
- `src/hooks/useInventoryMovements.ts`
- `src/hooks/useProductMaterials.ts`

**Arquivos editados:**
- `src/App.tsx` — remover rota `/estoque`
- `src/components/AppSidebar.tsx` — remover item "Estoque"
- `src/components/gestao/ProductForm.tsx` — remover seção "Materiais utilizados"
- `src/pages/OrcamentoEditor.tsx` — remover lógica de abate de estoque na conversão para pedido
- `src/pages/Gestao.tsx` — remover widget "Materiais em estoque baixo"
- `src/pages/Produtos.tsx` — remover qualquer referência a inventário

---

## 2. Cadastro com campos obrigatórios

**Migração SQL:** adicionar coluna `whatsapp text` na tabela `profiles` e atualizar `handle_new_user()` para popular `whatsapp` e `name` a partir de `raw_user_meta_data`.

**`src/pages/Cadastro.tsx`:**
- 4 campos obrigatórios: **Nome completo**, **Email**, **WhatsApp** (com máscara `(XX) XXXXX-XXXX`), **Senha**
- Validação client-side: todos required, WhatsApp com mínimo 10 dígitos, senha mínimo 6 caracteres
- Botão de submit desabilitado até todos campos válidos

**`src/contexts/AuthContext.tsx`:**
- Atualizar função `signUp` para aceitar `{ email, password, fullName, whatsapp }` e enviar via `options.data` no `supabase.auth.signUp` (vai para `raw_user_meta_data`, depois para `profiles.whatsapp` e `users.name` via trigger)

---

## 3. Dividir Pedidos e Produção

### 3a. Sidebar e rotas

**`src/components/AppSidebar.tsx`:** Ordem após "Orçamentos":
1. **Pedidos** (ícone `ShoppingCart`) → `/pedidos`
2. **Produção** (ícone `Factory` ou `Hammer`) → `/producao`

**`src/App.tsx`:** adicionar rota `/producao`.

### 3b. Página `/producao` (nova — Kanban)

**Novo arquivo:** `src/pages/Producao.tsx`
- Reaproveita o `KanbanBoard` atual com os **6 status** (Aprovado, Criando Arte, Aguardando Aprovação, Em Produção, Em Transporte, Entregue)
- Mantém KPIs atuais (Pedidos, Aprovados, Em Produção, Entregues) e PeriodFilter

### 3c. Página `/pedidos` (refatorada — lista)

**`src/pages/Pedidos.tsx`** (substitui o conteúdo atual seguindo o layout da imagem anexada):

**Header:**
- Título "Pedidos" + subtítulo "Gerencie seus pedidos e acompanhe o status"
- Botão "+ Novo Pedido" (abre modal de criação manual de pedido — opcional, usa client + items)

**4 cards KPI (conforme imagem):**
- **Total** — quantidade de pedidos no período
- **Em andamento** — pedidos com status diferente de `delivered`
- **Entregues** — pedidos com status `delivered`
- **Faturamento** — soma de `total_revenue` formatada em BRL

**Filtros:**
- Busca por nome do cliente, número do pedido ou produto
- Select "Status" com opção "Todos" + os 6 status

**Lista de cards (uma linha cada):**
- Coluna 1: `PED-N` (gerado a partir de índice ou novo campo `order_number`) + badge do status colorido
- Coluna 2: nome do cliente + ícone WhatsApp clicável (abre `wa.me`) + telefone + data de criação
- Coluna 3: nome do produto/orçamento
- Coluna 4: valor `total_revenue` em BRL
- Coluna 5: **Select inline** com os 6 status (atualiza via `updateOrderStatus`)
- Coluna 6: ícone "olho" (abre `OrderDetailsModal`) + ícone lixeira (deletar com confirmação)

### 3d. Modal de detalhes do pedido

**Novo arquivo:** `src/components/gestao/OrderDetailsModal.tsx`
- Exibe: cliente, data, status atual, histórico de status (`order_status_history`), pagamento (recebido/pendente)
- Lista de itens do pedido (lidos do `quotes.items` JSONB associado)
- Seção **"Adicionar item"**: selecionar produto cadastrado + quantidade + valor unitário
- Ao clicar "Adicionar": mostra **prévia do novo total** e pede **confirmação** antes de salvar
- Salvar: atualiza `quotes.items` (push novo item) e `orders.total_revenue` (+= qty × unit_value); recalcula `amount_pending = total_revenue - amount_received`
- Botão "Atualizar status" reaproveitando o select

### 3e. Conversão de orçamento → pedido

**`src/pages/OrcamentoEditor.tsx`:**
- Mudar status inicial do pedido criado de `'approved'` para **`'in_production'`** (cai direto na coluna "Em Produção" do Kanban de Produção)
- Toast: "Pedido criado em Produção"

### 3f. Numeração de pedidos (`PED-N`)

**Migração SQL:**
- Adicionar coluna `order_number integer` em `orders`
- Trigger `set_order_number` (similar ao `set_quote_number`) que atribui `MAX(order_number)+1` por `user_id` no `BEFORE INSERT`
- Backfill dos pedidos existentes

**`src/hooks/useOrders.ts`:**
- Incluir `order_number` no tipo `Order`
- Adicionar mutation `addItemToOrder({ orderId, item, newTotal })` — atualiza `quotes.items` e `orders.total_revenue`/`amount_pending`
- Adicionar mutation `deleteOrder(orderId)`

---

## Arquivos criados/editados

| Arquivo | Ação |
|---|---|
| `supabase/migrations/...drop_inventory.sql` | Drop tabelas + função inventário |
| `supabase/migrations/...profiles_whatsapp_and_orders_number.sql` | `profiles.whatsapp` + atualiza `handle_new_user` + `orders.order_number` + trigger |
| `src/pages/Estoque.tsx` + `src/components/estoque/*` + 3 hooks de inventário | **Removidos** |
| `src/contexts/AuthContext.tsx` | `signUp` aceita fullName + whatsapp |
| `src/pages/Cadastro.tsx` | 4 campos obrigatórios + máscara |
| `src/components/AppSidebar.tsx` | Remove Estoque, adiciona Produção |
| `src/App.tsx` | Remove `/estoque`, adiciona `/producao` |
| `src/pages/Producao.tsx` | **Nova** — Kanban de produção (6 status) |
| `src/pages/Pedidos.tsx` | Refatorada — layout em lista da imagem |
| `src/components/gestao/OrderDetailsModal.tsx` | **Novo** — visualização + adicionar item |
| `src/components/gestao/ProductForm.tsx` | Remove seção composição |
| `src/pages/OrcamentoEditor.tsx` | Status inicial = `in_production`; remove abate estoque |
| `src/pages/Gestao.tsx` | Remove widget estoque baixo |
| `src/pages/Produtos.tsx` | Remove referências a estoque |
| `src/hooks/useOrders.ts` | + `order_number`, `addItemToOrder`, `deleteOrder` |
