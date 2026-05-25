
# Fluxo de Caixa — Plano

## Objetivo
Visão diária/mensal de entradas e saídas reais e previstas, usando os dados que já existem (orders, receivables, expenses, manual entries) sem duplicar registros.

## Fontes de dados (já existentes, sem nova tabela)
- **Entradas realizadas**: `receivables` com `amount_paid > 0` (data = `paid_at` ou data do pagamento parcial) + entradas manuais marcadas como recebidas.
- **Entradas previstas**: `receivables` com `status` em (`pendente`, `parcial`, `atrasado`) → data = `due_date`, valor = `amount - amount_paid`.
- **Saídas realizadas**: `expenses` (`expense_date`, `amount`, `category`) + `total_cost` de pedidos entregues (custo de produção).
- **Saídas previstas** (opcional fase 2): despesas recorrentes — fora de escopo nesta entrega.

Nenhuma migração necessária. Tudo é derivado.

## Nova página `/fluxo-caixa`
Rota adicionada em `App.tsx`, item no `AppSidebar` (ícone `Wallet` ou `LineChart`).

### Layout
1. **Filtro de período** (reusar `PeriodFilter`) + toggle "Regime: Caixa (realizado) | Competência (previsto)".
2. **KPIs (4 cards)**:
   - Saldo do período (entradas − saídas realizadas)
   - Entradas realizadas
   - Saídas realizadas
   - Previsto a receber no período (receivables vencendo)
3. **Gráfico de linha (Recharts já instalado)**: evolução diária de saldo acumulado + barras de entradas/saídas por dia.
4. **Tabela "Movimentações"**: lista unificada ordenada por data com colunas Data, Tipo (entrada/saída), Origem (Pedido #, Cliente, Despesa, Entrada manual), Categoria, Status (realizado/previsto), Valor. Filtros: tipo, status, busca.
5. **Painel "A receber nos próximos 30 dias"** agrupado por semana, destacando atrasados em vermelho.
6. **Exportar CSV/PDF** do fluxo filtrado (mesmo padrão de Financeiro, com `jsPDF`/`autoTable`).

## Hook `useCashFlow.ts`
- Recebe `{ start, end, regime }`.
- Faz queries paralelas (`useQueries`) em `receivables` (com join leve em orders/clients via cache já existente), `expenses`, e usa `orders` do `useOrders`.
- Retorna estrutura normalizada:
  ```
  { entries: CashFlowEntry[], totals: {...}, daily: {date, in, out, balance}[] }
  ```
- Tipo `CashFlowEntry`: `{ id, date, type: 'in'|'out', status: 'realized'|'forecast', source, category, description, amount, link? }`.

## Integrações com módulos existentes
- Pagamento registrado em `ContasReceber` ou `OrderPaymentModal` → invalidar `['cashflow']`.
- Despesa criada em `useExpenses` → invalidar `['cashflow']`.
- Entrada manual (`useManualEntries`) → invalidar `['cashflow']`.
- Link em cada linha leva ao pedido/conta/despesa de origem.

## Como aproveitar ao máximo
- **Decisão diária**: saber se há caixa para pagar fornecedor hoje.
- **Projeção semanal**: ver semana com gap entre recebimentos previstos e despesas conhecidas.
- **Cobrança proativa**: painel de atrasados leva direto ao cliente/portal.
- **Análise por categoria**: identificar onde despesa cresce mês a mês.
- **Conciliação**: comparar previsto vs realizado para ajustar prazos médios de recebimento.
- **Exportação contábil**: CSV mensal para enviar ao contador.

## Arquivos
- `src/hooks/useCashFlow.ts` (novo)
- `src/pages/FluxoCaixa.tsx` (novo)
- `src/components/fluxo-caixa/CashFlowChart.tsx` (novo)
- `src/components/fluxo-caixa/CashFlowTable.tsx` (novo)
- `src/App.tsx` (rota)
- `src/components/AppSidebar.tsx` (item de menu)
- Invalidações em `useReceivables`, `useExpenses`, `useManualEntries`, `useOrders` (adicionar `['cashflow']`).

## Fora de escopo desta entrega
- Despesas recorrentes automáticas
- Contas bancárias múltiplas / conciliação OFX
- Lançamentos manuais avulsos no fluxo (sem origem em pedido/despesa)

Posso seguir com a implementação?
