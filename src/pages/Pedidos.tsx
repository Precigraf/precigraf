import React, { useState, useMemo } from 'react';
import { Package, CheckCircle, Settings2, Truck, Calendar } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AppLayout from '@/components/AppLayout';
import KanbanBoard from '@/components/gestao/KanbanBoard';
import { useOrders } from '@/hooks/useOrders';

type PeriodFilter = 'all' | 'week' | 'month';

const Pedidos: React.FC = () => {
  const { orders } = useOrders();
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>('month');

  const getDateRange = (period: PeriodFilter) => {
    const now = new Date();
    if (period === 'week') {
      const start = new Date(now);
      start.setDate(now.getDate() - 7);
      return start;
    }
    if (period === 'month') {
      return new Date(now.getFullYear(), now.getMonth(), 1);
    }
    return null;
  };

  const filteredOrders = useMemo(() => {
    const start = getDateRange(periodFilter);
    if (!start) return orders;
    return orders.filter(o => new Date(o.created_at) >= start);
  }, [orders, periodFilter]);

  const totalPedidos = filteredOrders.length;
  const aprovados = filteredOrders.filter(o => o.status === 'approved').length;
  const emProducao = filteredOrders.filter(o => o.status === 'in_production').length;
  const entregues = filteredOrders.filter(o => o.status === 'delivered').length;

  const kpis = [
    { label: 'Pedidos', value: totalPedidos, icon: Package, color: 'text-blue-500' },
    { label: 'Aprovados', value: aprovados, icon: CheckCircle, color: 'text-green-500' },
    { label: 'Em Produção', value: emProducao, icon: Settings2, color: 'text-orange-500' },
    { label: 'Entregues', value: entregues, icon: Truck, color: 'text-emerald-500' },
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
