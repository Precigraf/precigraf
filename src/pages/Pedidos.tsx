import React from 'react';
import { DollarSign, TrendingDown, TrendingUp, Clock } from 'lucide-react';
import { Card } from '@/components/ui/card';
import AppLayout from '@/components/AppLayout';
import KanbanBoard from '@/components/gestao/KanbanBoard';
import { useOrders } from '@/hooks/useOrders';

const Pedidos: React.FC = () => {
  const { orders } = useOrders();

  const formatCurrency = (v: number) =>
    v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  // Faturamento = total_value of all approved quotes (delivered orders)
  const faturamento = orders
    .filter(o => o.status === 'delivered')
    .reduce((sum, o) => sum + (o.quotes?.total_value ?? 0), 0);

  // A receber = total_value of orders NOT yet delivered
  const aReceber = orders
    .filter(o => o.status !== 'delivered')
    .reduce((sum, o) => sum + (o.quotes?.total_value ?? 0), 0);

  // Despesas = sum of total_cost from calculation linked to quotes (if available via raw_data)
  // For now we use 0 as placeholder since we don't have expense tracking yet
  const despesas = 0;

  const lucro = faturamento - despesas;

  const kpis = [
    { label: 'Faturamento', value: formatCurrency(faturamento), icon: DollarSign, color: 'text-green-500' },
    { label: 'Despesas', value: formatCurrency(despesas), icon: TrendingDown, color: 'text-red-500' },
    { label: 'Lucro', value: formatCurrency(lucro), icon: TrendingUp, color: 'text-emerald-500' },
    { label: 'A Receber', value: formatCurrency(aReceber), icon: Clock, color: 'text-yellow-500' },
  ];

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground">Pedidos</h1>
          <p className="text-sm text-muted-foreground">Arraste os pedidos entre as colunas para atualizar o status</p>
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
