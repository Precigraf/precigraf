# Plano — Controle de Estoque de Insumos

## 1. Migração do banco

### Tabelas
- **`supply_stock`** — conforme proposto (id, user_id, name, type [paper/ink/other], unit, quantity, unit_cost, min_alert, expiry_date, notes, is_active, timestamps) com CHECKs de não-negativo e RLS owner-only.
- **`supply_movements`** — id, supply_id (FK cascade), user_id (FK cascade), `order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL`, type (in/out), quantity (>0), unit_cost, reason, created_at. RLS owner-only.
- **`product_supplies`** (nova) — vínculo entre produto e insumos consumidos por unidade:
  - `id, user_id, product_id, supply_id, quantity_per_unit numeric NOT NULL`
  - RLS owner-only. Permite que ao aprovar pedido, o sistema saiba quais insumos descontar.

### Índices
Conforme proposto + `idx_product_supplies_product`.

### Trigger `updated_at`
Reutilizar `public.update_updated_at_column()` já existente (não criar função duplicada).

## 2. Funções (RPC)

### `consume_supply(p_supply_id, p_quantity, p_order_id default null, p_reason default null)`
- Valida propriedade e saldo.
- `UPDATE supply_stock SET quantity = quantity - p_quantity`.
- **Insere automaticamente em `supply_movements`** (type='out') na mesma transação — histórico garantido.
- Retorna void.

### `restock_supply(p_supply_id, p_quantity, p_unit_cost default null, p_reason default null)`
- Soma ao estoque e registra movimento `in`. Útil para entradas via UI.

### `consume_supplies_for_order(p_order_id)`
- Para cada item do pedido (via quote.items → product_id), busca `product_supplies` e chama `consume_supply` para cada insumo vinculado, multiplicando `quantity_per_unit * item.quantity`.
- Chamada quando pedido é aprovado (no `respond_to_quote_by_token` e ao criar pedido manualmente).
- Não falha o pedido se faltar estoque — apenas registra log e cria notificação de "estoque insuficiente" (decisão: descontar até zero, nunca negativo, e notificar).

## 3. View `supply_low_stock`
```sql
CREATE VIEW public.supply_low_stock
WITH (security_invoker = true) AS
SELECT ... FROM supply_stock WHERE is_active AND (...);
```
`security_invoker = true` garante que RLS do usuário se aplique automaticamente.

Ajuste no `CASE`: priorizar `out_of_stock`, depois `expiring_soon` se aplicável e quantidade ok, depois `low`.

## 4. Trigger de notificação
`AFTER UPDATE ON supply_stock` — quando `quantity` cruza `min_alert` para baixo (OLD.quantity > min_alert AND NEW.quantity <= min_alert), chama `create_notification(user_id, 'supply_low_stock', 'Estoque baixo: <nome>', ...)` alimentando o sino existente.

## 5. Frontend

### Nova página `/estoque`
- Listagem com filtro por tipo (papel/tinta/outros), busca, badge de status (ok/baixo/zerado/vencendo).
- Modal CRUD de insumo (nome, tipo, unidade, quantidade inicial, custo unitário, alerta mínimo, validade).
- Botão "Entrada" e "Saída" → chama `restock_supply` / `consume_supply` com motivo.
- Aba "Movimentações" mostrando histórico (`supply_movements` join `supply_stock`).

### Vínculo Produto ↔ Insumo
Em `ProductForm.tsx`, nova seção "Insumos consumidos por unidade" — permite adicionar linhas (insumo + quantidade).

### Integração com Pedidos
Ao criar pedido via aprovação pública (`respond_to_quote_by_token`) ou conversão manual, chamar `consume_supplies_for_order(order_id)` ao final.

### Sidebar
Adicionar item "Estoque" no `AppSidebar.tsx` (ícone Package, entre Produtos e Marketplace).

### Componente `StockAlerts.tsx` (novo)
Não tocar em `SmartAlerts.tsx` (calculadora). Criar `StockAlerts.tsx` que lê `supply_low_stock` e exibe banner no Dashboard quando houver alertas.

## 6. Detalhes técnicos relevantes

- Todas as RPCs com `SECURITY DEFINER SET search_path TO 'public'` (padrão do projeto).
- Hook `useSupplyStock.ts` com TanStack Query + Realtime channel em `supply_stock`.
- `is_active=false` em vez de DELETE para preservar histórico de movimentos.
- Migração não toca dados existentes — apenas cria estrutura nova.

## 7. Fora de escopo (não fazer agora)
- Variação de custo médio ponderado (manter `unit_cost` simples).
- Reservas de estoque ao gerar orçamento (só desconta na aprovação).
- Importação CSV de insumos.

Aprovar para eu implementar tudo isso em uma única migração + UI completa.
