import React from 'react';
import { Users, FileText, CheckCircle, XCircle, Package, Truck, DollarSign, TrendingUp, Percent } from 'lucide-react';
import { Card } from '@/components/ui/card';
import Header from '@/components/Header';
import { useClients } from '@/hooks/useClients';
import { useQuotes } from '@/hooks/useQuotes';
import { useOrders, KANBAN_COLUMNS } from '@/hooks/useOrders';

const Gestao: React.FC = () => {
  const { clients } = useClients();
  const { quotes } = useQuotes();
  const { orders } = useOrders();

  const approvedQuotes = quotes.filter(q => q.status === 'approved');
  const rejectedQuotes = quotes.filter(q => q.status === 'rejected');
  const ordersInProduction = orders.filter(o => ['creating_art', 'awaiting_client_approval', 'in_production'].includes(o.status));
  const ordersDelivered = orders.filter(o => o.status === 'delivered');
  const ordersInTransit = orders.filter(o => o.status === 'in_transit');

  const totalRevenue = approvedQuotes.reduce((sum, q) => sum + q.total_value, 0);
  const avgTicket = approvedQuotes.length > 0 ? totalRevenue / approvedQuotes.length : 0;
  const conversionRate = quotes.length > 0 ? (approvedQuotes.length / quotes.length) * 100 : 0;

  const formatCurrency = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const metrics = [
    { label: 'Total de Clientes', value: clients.length, icon: Users, color: 'text-blue-500' },
    { label: 'Total de Orçamentos', value: quotes.length, icon: FileText, color: 'text-purple-500' },
    { label: 'Aprovados', value: approvedQuotes.length, icon: CheckCircle, color: 'text-green-500' },
    { label: 'Recusados', value: rejectedQuotes.length, icon: XCircle, color: 'text-red-500' },
    { label: 'Em Produção', value: ordersInProduction.length, icon: Package, color: 'text-orange-500' },
    { label: 'Em Transporte', value: ordersInTransit.length, icon: Truck, color: 'text-cyan-500' },
    { label: 'Entregues', value: ordersDelivered.length, icon: CheckCircle, color: 'text-green-600' },
  ];

  const advancedMetrics = [
    { label: 'Faturamento Total', value: formatCurrency(totalRevenue), icon: DollarSign, color: 'text-green-500' },
    { label: 'Ticket Médio', value: formatCurrency(avgTicket), icon: TrendingUp, color: 'text-blue-500' },
    { label: 'Taxa de Conversão', value: `${conversionRate.toFixed(1)}%`, icon: Percent, color: 'text-purple-500' },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-6 max-w-5xl">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground">Dashboard de Gestão</h1>
          <p className="text-sm text-muted-foreground">Visão geral do seu negócio</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mb-6">
          {metrics.map(m => (
            <Card key={m.label} className="p-4 bg-card border-border">
              <div className="flex items-center gap-3">
                <m.icon className={`w-5 h-5 ${m.color} shrink-0`} />
                <div>
                  <div className="text-2xl font-bold text-foreground">{m.value}</div>
                  <div className="text-xs text-muted-foreground">{m.label}</div>
                </div>
              </div>
            </Card>
          ))}
        </div>

        <h2 className="text-lg font-semibold text-foreground mb-3">Métricas Avançadas</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
          {advancedMetrics.map(m => (
            <Card key={m.label} className="p-5 bg-card border-border">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg bg-secondary flex items-center justify-center`}>
                  <m.icon className={`w-5 h-5 ${m.color}`} />
                </div>
                <div>
                  <div className="text-xl font-bold text-foreground">{m.value}</div>
                  <div className="text-sm text-muted-foreground">{m.label}</div>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Kanban summary */}
        <h2 className="text-lg font-semibold text-foreground mb-3">Status dos Pedidos</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          {KANBAN_COLUMNS.map(col => {
            const count = orders.filter(o => o.status === col.id).length;
            return (
              <Card key={col.id} className="p-3 bg-card border-border text-center">
                <div className={`w-3 h-3 rounded-full ${col.color} mx-auto mb-1`} />
                <div className="text-lg font-bold text-foreground">{count}</div>
                <div className="text-xs text-muted-foreground">{col.label}</div>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Gestao;
