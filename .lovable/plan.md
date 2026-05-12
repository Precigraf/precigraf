## Plano de alterações

### 1. Remover data de validade do estoque e notificação "vencendo"

**Banco de dados (migration)**
- Atualizar a view `supply_low_stock` para remover a lógica de `expiry_date` e o tipo de alerta `expiring_soon`
- Atualizar o trigger `notify_supply_low_stock` para não mais disparar notificações de vencimento

**Frontend**
- `SupplyForm.tsx`: remover o campo "Validade" (input type=date)
- `Estoque.tsx`: remover a exibição da data de validade na listagem, remover o badge "Vence em 30d" da função `statusBadge`
- `StockAlerts.tsx`: remover a contagem e exibição de itens `expiring_soon` do alerta
- `useSupplyStock.ts`: remover `expiry_date` das interfaces `Supply` e `SupplyLowStock`, e do tipo `SupplyInput`

### 2. Filtro por categoria no "Adicionar Item" do orçamento

**Frontend — `OrcamentoEditor.tsx`**
- Importar `useCategories`
- Adicionar estado `productFilterCat` para controlar a categoria selecionada no product picker
- Exibir badges de categoria (igual ao padrão de `Produtos.tsx`) no topo do dialog de produtos
- Aplicar o filtro por categoria junto com o filtro de texto em `filteredProducts`

### 3. Validação
- Verificar que o estoque não mostra mais validade
- Verificar que o alerta de estoque não menciona "vencendo"
- Verificar que o product picker do orçamento permite filtrar por categoria

## Arquivos afetados
- `supabase/migrations/*.sql` — migration para view/trigger
- `src/components/gestao/SupplyForm.tsx`
- `src/pages/Estoque.tsx`
- `src/components/StockAlerts.tsx`
- `src/hooks/useSupplyStock.ts`
- `src/pages/OrcamentoEditor.tsx`
