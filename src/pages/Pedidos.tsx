import React, { useState, useMemo } from 'react';
import { DollarSign, TrendingDown, TrendingUp, Clock, Calendar } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AppLayout from '@/components/AppLayout';
import KanbanBoard from '@/components/gestao/KanbanBoard';
import { useOrders } from '@/hooks/useOrders';

type PeriodFilter = 'all' | 'week' | 'month';

const Pedidos: React.FC = () => {
  const { orders } = useOrders();
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>('month');

  const formatCurrency = (v: number) =>
    v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const getDateRange = (period: PeriodFilter) => {
    const now = new Date();
    if (period === 'week') {
      const start = new Date(now);
      start.setDate(now.getDate() - 7);
      return start;
    }
    if (period === 'month') {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      return start;
    }
    return null; // all
  };

  const filteredOrders = useMemo(() => {
    const start = getDateRange(periodFilter);
    if (!start) return orders;
    return orders.filter(o => new Date(o.created_at) >= start);
  }, [orders, periodFilter]);

  const faturamento = filteredOrders
    .filter(o => o.status === 'delivered')
    .reduce((sum, o) => sum + (o.quotes?.total_value ?? 0), 0);

  const aReceber = filteredOrders
    .filter(o => o.status !== 'delivered')
    .reduce((sum, o) => sum + (o.quotes?.total_value ?? 0), 0);

  const despesas = 0;
  const lucro = faturamento - despesas;

  const kpis = [
    { label: 'Faturamento', value: formatCurrency(faturamento), icon: DollarSign, color: 'text-green-500' },
    { label: 'Despesas', value: formatCurrency(despesas), icon: TrendingDown, color: 'text-red-500' },
    { label: 'Lucro', value: formatCurrency(lucro), icon: TrendingUp, color: lucro >= 0 ? 'text-emerald-500' : 'text-red-500' },
    { label: 'A Receber', value: formatCurrency(aReceber), icon: Clock, color: 'text-yellow-500' },
  ];

  

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Pedidos</h1>
            <p className="text-sm text-muted-foreground">Arraste os pedidos entre as colunas para atualizar o status</p>
          </div>
          <div className="flex items-center gap-2">
            <Select value={periodFilter} onValueChange={(v) => setPeriodFilter(v as PeriodFilter)}>
              <SelectTrigger className="w-40">
                <Calendar className="w-4 h-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todo período</SelectItem>
                <SelectItem value="week">Última semana</SelectItem>
                <SelectItem value="month">Este mês</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {kpis.map(kpi => (
            <Card key={kpi.label} className="p-4 bg-card border-border">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg bg-secondary ${kpi.color}`}>
                  <kpi.icon className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{kpi.label}</p>
                  <p className="text-sm font-bold text-foreground">{kpi.value}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>

        <KanbanBoard />
      </div>
    </AppLayout>
  );
};

export default Pedidos;
