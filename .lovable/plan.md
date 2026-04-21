

## Padronizar filtros de período em todas as páginas

### Mudança
Substituir todos os seletores de período nas 3 páginas (Pedidos, Financeiro, Dashboard) pelo mesmo conjunto de opções mostrado na imagem:

1. **Mês Atual** (padrão)
2. **Últimos 7 dias**
3. **Últimos 15 dias**
4. **Últimos 30 dias**
5. **Todo Histórico**
6. **Personalizado** — abre um date range picker (dois calendários: início e fim)

### Arquivos afetados

**1. `src/pages/Pedidos.tsx`**
- Alterar `PeriodFilter` type para incluir as novas opções
- Atualizar `getDateRange` para calcular corretamente cada período
- Atualizar o `<Select>` com as novas opções
- Adicionar state e UI para range personalizado (dois inputs de data)

**2. `src/pages/Financeiro.tsx`**
- Mesma alteracao de type, logica e UI

**3. `src/pages/Gestao.tsx` + `src/hooks/useRevenueChart.ts`**
- Substituir o `ChartPeriod` (daily/weekly/monthly/yearly) pelo novo padrão
- Atualizar o hook para agrupar dados automaticamente com base no range selecionado (ex: se "Últimos 7 dias" agrupa por dia, se "Todo Histórico" agrupa por mes)
- Atualizar `PERIOD_LABELS` e o `<Select>` do grafico

**4. (Opcional) Componente reutilizavel `src/components/PeriodFilter.tsx`**
- Extrair o Select + logica de range personalizado num componente unico para evitar duplicacao nas 3 paginas

### Logica do "Personalizado"
- Ao selecionar "Personalizado", exibe dois campos de data (inicio e fim) usando o componente `Calendar` + `Popover` ja existentes no projeto
- O filtro aplica o range customizado ate o usuario trocar para outra opcao

### Ordem de implementacao
1. Criar componente `PeriodFilter` reutilizavel
2. Aplicar em Pedidos
3. Aplicar em Financeiro
4. Aplicar em Gestao (adaptar hook do grafico)

