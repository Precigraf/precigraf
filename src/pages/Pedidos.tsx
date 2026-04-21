import React, { useState, useMemo } from 'react';
import { Package, CheckCircle, Settings2, Truck } from 'lucide-react';
import { Card } from '@/components/ui/card';
import AppLayout from '@/components/AppLayout';
import KanbanBoard from '@/components/gestao/KanbanBoard';
import PeriodFilter, { type PeriodKey, getDateRange } from '@/components/PeriodFilter';
import { useOrders } from '@/hooks/useOrders';

const Pedidos: React.FC = () => {
  const { orders } = useOrders();
  const [period, setPeriod] = useState<PeriodKey>('current_month');
  const [customStart, setCustomStart] = useState<Date | undefined>();
  const [customEnd, setCustomEnd] = useState<Date | undefined>();

  const filteredOrders = useMemo(() => {
    const { start, end } = getDateRange(period, customStart, customEnd);
    if (!start) return orders;
    return orders.filter(o => {
      const d = new Date(o.created_at);
      return d >= start && (!end || d <= end);
    });
  }, [orders, period, customStart, customEnd]);

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
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Pedidos</h1>
            <p className="text-sm text-muted-foreground">Arraste os pedidos entre as colunas para atualizar o status</p>
          </div>
          <PeriodFilter
            value={period}
            onChange={setPeriod}
            customStart={customStart}
            customEnd={customEnd}
            onCustomStartChange={setCustomStart}
            onCustomEndChange={setCustomEnd}
          />
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
