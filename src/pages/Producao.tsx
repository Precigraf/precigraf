import React, { useState, useMemo } from 'react';
import { Package, CheckCircle, Settings2, Truck } from 'lucide-react';
import { Card } from '@/components/ui/card';
import AppLayout from '@/components/AppLayout';
import KanbanBoard from '@/components/gestao/KanbanBoard';
import PeriodFilter, { type PeriodKey, getDateRange } from '@/components/PeriodFilter';
import { useOrders } from '@/hooks/useOrders';

const Producao: React.FC = () => {
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
      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5 sm:mb-6">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-foreground">Produção</h1>
            <p className="text-xs sm:text-sm text-muted-foreground">Arraste os pedidos entre as colunas para atualizar o status</p>
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

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 mb-5 sm:mb-6">
          {kpis.map(kpi => (
            <Card key={kpi.label} className="p-3 sm:p-4 bg-card border-border">
              <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                <div className={`p-2 rounded-lg bg-secondary ${kpi.color} shrink-0`}>
                  <kpi.icon className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] sm:text-xs text-muted-foreground truncate">{kpi.label}</p>
                  <p className="text-sm font-bold text-foreground truncate">{kpi.value}</p>
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

export default Producao;
