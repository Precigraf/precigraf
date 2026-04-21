

## Plano de Melhorias — Sistema Precigraf

### Resumo
Reorganizar menus, criar dashboard com gráfico de faturamento, corrigir lógica de itens no orçamento, adicionar visualização rápida, criar módulo financeiro, e sincronizar custos/lucro entre produtos, pedidos e financeiro.

---

### 1. Reordenar menus do sidebar
**Arquivo:** `src/components/AppSidebar.tsx`

Alterar o array `navItems` para a nova ordem:
1. Dashboard (`/gestao`)
2. Produtos (`/produtos`)
3. Clientes (`/clientes`)
4. Orçamentos (`/orcamentos`)
5. Pedidos (`/pedidos`)
6. Calculadora (`/`)
7. Marketplace (`/marketplace`)

---

### 2. Dashboard — Gráfico de faturamento profissional
**Arquivo:** `src/pages/Gestao.tsx`

- Adicionar filtro de período: Diário, Semanal, Mensal, Anual.
- Criar gráfico de área/barras usando Recharts (já disponível via `chart.tsx`) mostrando faturamento real com base nos pedidos entregues (`orders` com `status = 'delivered'`).
- Agrupar dados por dia/semana/mês/ano conforme filtro selecionado.
- Usar dados reais: `orders` JOIN `quotes` para `total_value`.
- Exibir eixo X (período) e eixo Y (valor em R$).

**Novo hook:** `src/hooks/useRevenueChart.ts` — busca pedidos entregues com valores do orçamento vinculado, agrupa por período.

---

### 3. Corrigir lógica de adição de produto no orçamento
**Arquivo:** `src/pages/OrcamentoEditor.tsx`

**Problema:** Ao adicionar um produto cadastrado, o `unit_value` é o preço unitário do produto, e a `quantity` vem do `default_quantity`. O total é `qty × unit_value`, o que confunde quando o produto já tem preço total definido nos `price_tiers`.

**Solução:** Quando um produto cadastrado é adicionado:
- Se o produto tem `price_tiers` e a quantidade selecionada corresponde a um tier, usar o `price` do tier como **valor total do item** (setar `unit_value = price / quantity`), preservando a lógica de exibição.
- Se não houver tier correspondente, usar `unit_price` diretamente como valor unitário e `default_quantity` como quantidade, **sem multiplicar** — manter os valores exatamente como cadastrados.
- Item livre continua com lógica de multiplicação normal.

---

### 4. Ícone de visualização na lista de orçamentos
**Arquivo:** `src/pages/Orcamentos.tsx`

Adicionar um botão com ícone `Eye` ao lado do botão de edição (`Edit2`) que abre o orçamento em modo leitura ou abre o PDF diretamente (reusa `handleExportPDF`). Implementação: navegar para `/orcamentos/:id?view=true` ou abrir o PDF em nova aba.

---

### 5. Sincronizar custo do produto com pedidos (faturamento, despesas, lucro)
**Alterações em banco de dados (migração SQL):**

Adicionar colunas à tabela `orders`:
- `total_revenue NUMERIC DEFAULT 0` — valor total de venda (faturamento)
- `total_cost NUMERIC DEFAULT 0` — custo total dos produtos
- `amount_received NUMERIC DEFAULT 0` — valor já recebido
- `amount_pending NUMERIC DEFAULT 0` — saldo a receber

**Arquivo:** `src/pages/OrcamentoEditor.tsx` (função `handleConvertConfirm`)

Ao converter orçamento em pedido:
- Calcular `total_revenue` = soma dos `quantity × unit_value` de cada item.
- Calcular `total_cost` = soma dos `quantity × cost` de cada item (buscando o `cost` do produto cadastrado via `price_tiers` ou campo `cost`).
- Salvar `amount_received` e `amount_pending` = `total_revenue - amount_received`.
- Gravar esses valores na tabela `orders`.

**Arquivo:** `src/hooks/useOrders.ts`

Atualizar a query para incluir as novas colunas. Adicionar mutation `updatePaymentReceived` para registrar pagamentos parciais.

---

### 6. Campo para registrar saldo recebido nos pedidos
**Novo componente:** `src/components/gestao/OrderPaymentModal.tsx`

Modal que aparece ao clicar no pedido no Kanban, mostrando:
- Valor total do pedido
- Valor já recebido
- Saldo a receber
- Input para informar novo valor recebido
- Ao salvar, atualiza `amount_received` e `amount_pending` no `orders`.

**Arquivo:** `src/components/gestao/OrderCard.tsx` — adicionar botão/ícone para abrir o modal de pagamento.

---

### 7. Nova página Financeiro
**Nova rota:** `/financeiro`
**Novo arquivo:** `src/pages/Financeiro.tsx`

Página que exibe:
- Lista de pedidos vinculados aos orçamentos (sem status de produção do Kanban).
- Colunas: Nº Orçamento, Cliente, Faturamento, Despesas (custo), Lucro, Valor Recebido, Saldo Pendente.
- Filtros por período (semana, mês, ano).
- KPIs: Total Faturamento, Total Despesas, Lucro Líquido, Total a Receber.

**Arquivo:** `src/App.tsx` — adicionar rota `/financeiro`.
**Arquivo:** `src/components/AppSidebar.tsx` — adicionar item "Financeiro" no menu com ícone `Wallet`.

---

### 8. Alterar KPIs dos cards em Pedidos
**Arquivo:** `src/pages/Pedidos.tsx`

Substituir os 4 cards (Faturamento, Despesas, Lucro, A Receber) por:
- **Pedidos** — total de pedidos no período
- **Aprovados** — pedidos com status `approved`
- **Em Produção** — pedidos com status `in_production`
- **Entregues** — pedidos com status `delivered`

---

### Ordem de implementação recomendada
1. Reordenar menus (rápido, sem risco)
2. Alterar KPIs dos cards em Pedidos
3. Corrigir lógica de adição de produto no orçamento
4. Ícone de visualização na lista de orçamentos
5. Migração SQL — novas colunas em `orders`
6. Sincronizar custo/receita ao converter pedido
7. Modal de pagamento recebido no Kanban
8. Nova página Financeiro
9. Dashboard com gráfico de faturamento

