

## Sistema de Estoque com Controle de Materiais

Implementar um módulo completo de **Estoque** para gerenciar materiais comprados, vincular ao cadastro de produtos e abater automaticamente quando um orçamento for aprovado.

---

### Conceitos

- **Material de estoque**: item físico comprado (ex: "Folha A4 180g", "Alça plástica", "Embalagem kraft").
- **Entrada de estoque**: registro de uma compra (ex: "2 pacotes × 250 folhas = 500 unidades").
- **Composição do produto**: cada produto consome quantidades de materiais (ex: 1 cartão = 1 folha; 1 sacola = 1 sacola + 2 alças + 1 embalagem).
- **Abate automático**: ao aprovar um orçamento, o sistema desconta `quantidade_pedida × consumo_por_unidade` de cada material.

---

### 1. Banco de dados (migração SQL)

**Tabela `inventory_materials`** — catálogo de materiais
- `id`, `user_id`, `name`, `unit` (texto livre: "folha", "alça", "embalagem"), `current_stock` (numeric, default 0), `min_stock` (numeric, alerta de estoque baixo), `created_at`, `updated_at`
- RLS: usuário só vê/edita os seus

**Tabela `inventory_movements`** — histórico de entradas/saídas
- `id`, `user_id`, `material_id` (FK), `movement_type` ('in' | 'out' | 'adjustment'), `quantity` (numeric — positivo entra, negativo sai), `unit_cost` (opcional, custo unitário da compra), `notes`, `reference_type` ('purchase' | 'order' | 'manual'), `reference_id` (FK para `orders.id` quando vier de pedido), `created_at`
- RLS: usuário só vê/edita os seus

**Tabela `product_materials`** — composição (qtd de material por unidade de produto)
- `id`, `user_id`, `product_id` (FK products), `material_id` (FK inventory_materials), `quantity_per_unit` (numeric)
- UNIQUE(product_id, material_id)
- RLS: usuário só vê/edita os seus

**Trigger `apply_inventory_movement`** — ao inserir em `inventory_movements`, atualiza `current_stock` do material atomicamente (incrementa/decrementa).

---

### 2. Hooks

- `src/hooks/useInventory.ts` — CRUD de `inventory_materials` + listagem com `current_stock`
- `src/hooks/useInventoryMovements.ts` — registrar entradas (compras) e listar histórico
- `src/hooks/useProductMaterials.ts` — gerenciar composição (qual material e quanto cada produto consome)

---

### 3. Nova página `/estoque` (`src/pages/Estoque.tsx`)

Layout com 2 abas:
- **Materiais**: cards/lista com cada material, quantidade atual, alerta visual quando abaixo do mínimo, botão "Nova Entrada" e "Editar". Painel resumo no topo: total de materiais, materiais em estoque baixo, valor estimado em estoque (se houver `unit_cost`).
- **Histórico**: linha do tempo das movimentações (entradas de compra + saídas por pedidos), com filtros por material/tipo/período.

Modais:
- `MaterialForm` — criar/editar material (nome, unidade, estoque mínimo)
- `MovementForm` — registrar entrada de compra (selecionar material, quantidade total comprada, custo opcional, observação)

Adicionar item **Estoque** no `AppSidebar.tsx` (ícone `Boxes` ou `Warehouse`).

---

### 4. Integração com Produtos (`ProductForm.tsx`)

Adicionar nova seção **"Materiais utilizados"**:
- Lista vinculada ao produto: cada linha = material (Select) + quantidade consumida por unidade
- Botão "+ Adicionar material"
- Salvo em `product_materials` ao criar/editar o produto

---

### 5. Abate automático no aprovar orçamento

Em `OrcamentoEditor.tsx` (na função `handleConvertToOrder`, após criar o pedido):
- Para cada `QuoteItem` com `product_id`, buscar `product_materials` daquele produto
- Para cada material vinculado, inserir registro em `inventory_movements`:
  - `movement_type = 'out'`
  - `quantity = -(item.quantity × material.quantity_per_unit)`
  - `reference_type = 'order'`, `reference_id = order.id`
- O trigger SQL atualiza `current_stock` automaticamente
- Toast: "Estoque atualizado: X materiais abatidos"

Se algum material ficar abaixo do mínimo, exibir alerta no toast: "⚠️ Material X está abaixo do estoque mínimo"

---

### 6. Painel de alertas

Adicionar widget no `Dashboard` (`src/pages/Gestao.tsx`):
- Card "Materiais em estoque baixo" listando os 3 mais críticos com link para `/estoque`

---

### Arquivos criados/editados

| Arquivo | Ação |
|---|---|
| `supabase/migrations/...inventory.sql` | 3 tabelas + trigger + RLS |
| `src/hooks/useInventory.ts` | Novo |
| `src/hooks/useInventoryMovements.ts` | Novo |
| `src/hooks/useProductMaterials.ts` | Novo |
| `src/pages/Estoque.tsx` | Nova página |
| `src/components/estoque/MaterialForm.tsx` | Novo modal |
| `src/components/estoque/MovementForm.tsx` | Novo modal |
| `src/components/estoque/MaterialCard.tsx` | Novo |
| `src/components/gestao/ProductForm.tsx` | Adicionar seção composição |
| `src/pages/OrcamentoEditor.tsx` | Abate automático ao aprovar |
| `src/pages/Gestao.tsx` | Widget alerta estoque baixo |
| `src/components/AppSidebar.tsx` | Item "Estoque" |
| `src/App.tsx` | Rota `/estoque` |

---

### Observações

- Materiais ficam **separados** do cadastro de Produtos: produto = o que você vende, material = insumo do estoque.
- Composição é opcional: produtos sem materiais vinculados não disparam abate.
- Movimentações são imutáveis (sem update/delete) — correções via "ajuste manual" criando nova movimentação.

