

## Plano: Remover Admin + Corrigir Frete no Lucro

### 1. Remover página de Admin

Remover todos os arquivos e referências ao módulo admin:

**Arquivos a deletar:**
- `src/pages/Admin.tsx`
- `src/components/AdminRoute.tsx`
- `src/hooks/useIsAdmin.ts`

**Arquivos a editar:**
- `src/App.tsx` — remover import de `Admin`, `AdminRoute` e a rota `/admin`
- `src/components/AppSidebar.tsx` — remover import de `useIsAdmin`, remover o link "Admin" condicional e a variavel `isAdmin`

A edge function `admin-actions` e a migração SQL do role admin permanecem no banco (sem efeito colateral).

---

### 2. Frete como despesa (não inflacionar lucro)

**Problema atual:** Ao converter orçamento em pedido (`OrcamentoEditor.tsx` linha 280), `total_revenue = total` onde `total = subtotal - desconto + frete`. O frete entra no faturamento e infla o lucro.

**Solução:** Incluir o valor do frete no `total_cost` do pedido, de forma que:
- `total_revenue = total` (permanece — é o valor que o cliente paga)
- `total_cost = custos dos produtos + frete`
- `lucro = total_revenue - total_cost` (frete se anula: entra na receita e sai na despesa)

**Arquivo:** `src/pages/OrcamentoEditor.tsx` (linha ~304)
- Alterar: `total_cost: orderTotalCost` → `total_cost: orderTotalCost + shippingAmount`
- O `shippingAmount` já está disponível no escopo como variável local

Nenhuma alteração necessária em Financeiro, Pedidos ou Dashboard — todos já calculam lucro como `total_revenue - total_cost`, então a correção se propaga automaticamente.

