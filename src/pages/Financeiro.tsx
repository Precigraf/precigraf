import React, { useState, useMemo } from 'react';
import { DollarSign, TrendingDown, TrendingUp, Clock } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/components/AppLayout';
import PeriodFilter, { type PeriodKey, getDateRange } from '@/components/PeriodFilter';
import { useOrders } from '@/hooks/useOrders';

const formatCurrency = (v: number) => (Number.isFinite(v) ? v : 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const Financeiro: React.FC = () => {
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

  const totalFaturamento = filteredOrders.reduce((s, o) => s + (Number((o as any).total_revenue) || 0), 0);
  const totalDespesas = filteredOrders.reduce((s, o) => s + (Number((o as any).total_cost) || 0), 0);
  const totalLucro = totalFaturamento - totalDespesas;
  const totalAReceber = filteredOrders.reduce((s, o) => s + (Number((o as any).amount_pending) || 0), 0);

  const kpis = [
    { label: 'Faturamento', value: formatCurrency(totalFaturamento), icon: DollarSign, color: 'text-green-500' },
    { label: 'Despesas', value: formatCurrency(totalDespesas), icon: TrendingDown, color: 'text-red-500' },
    { label: 'Lucro Líquido', value: formatCurrency(totalLucro), icon: TrendingUp, color: totalLucro >= 0 ? 'text-emerald-500' : 'text-red-500' },
    { label: 'A Receber', value: formatCurrency(totalAReceber), icon: Clock, color: 'text-yellow-500' },
  ];

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-6 max-w-6xl">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Financeiro</h1>
            <p className="text-sm text-muted-foreground">Controle financeiro dos pedidos</p>
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

        <Card className="bg-card border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead>Produto</TableHead>
                <TableHead className="text-right">Faturamento</TableHead>
                <TableHead className="text-right">Despesas</TableHead>
                <TableHead className="text-right">Lucro</TableHead>
                <TableHead className="text-right">Recebido</TableHead>
                <TableHead className="text-right">Pendente</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOrders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    Nenhum pedido encontrado no período.
                  </TableCell>
                </TableRow>
              ) : filteredOrders.map(order => {
                const rev = Number((order as any).total_revenue) || 0;
                const cost = Number((order as any).total_cost) || 0;
                const received = Number((order as any).amount_received) || 0;
                const pending = Number((order as any).amount_pending) || 0;
                return (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">{order.clients?.name || '—'}</TableCell>
                    <TableCell className="text-muted-foreground">{order.quotes?.product_name || '—'}</TableCell>
                    <TableCell className="text-right font-semibold text-green-600">{formatCurrency(rev)}</TableCell>
                    <TableCell className="text-right text-red-500">{formatCurrency(cost)}</TableCell>
                    <TableCell className={`text-right font-semibold ${rev - cost >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                      {formatCurrency(rev - cost)}
                    </TableCell>
                    <TableCell className="text-right">{formatCurrency(received)}</TableCell>
                    <TableCell className={`text-right font-semibold ${pending > 0 ? 'text-yellow-600' : 'text-muted-foreground'}`}>
                      {formatCurrency(pending)}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>
      </div>
    </AppLayout>
  );
};

export default Financeiro;
