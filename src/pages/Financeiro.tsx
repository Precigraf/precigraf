import React, { useState, useMemo, useEffect } from 'react';
import { DollarSign, TrendingDown, TrendingUp, Clock, Factory } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/components/AppLayout';
import PeriodFilter, { type PeriodKey, getDateRange } from '@/components/PeriodFilter';
import { useOrders } from '@/hooks/useOrders';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

const formatCurrency = (v: number) =>
  (Number.isFinite(v) ? v : 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

interface CalcRow {
  id: string;
  product_name: string;
  lot_quantity: number;
  total_cost: number;
  sale_price: number;
  labor_cost: number;
  energy_cost: number;
  equipment_cost: number;
  rent_cost: number;
  other_operational_cost: number;
  created_at: string;
}

const Financeiro: React.FC = () => {
  const { user } = useAuth();
  const { orders } = useOrders();
  const [period, setPeriod] = useState<PeriodKey>('current_month');
  const [customStart, setCustomStart] = useState<Date | undefined>();
  const [customEnd, setCustomEnd] = useState<Date | undefined>();
  const [calcs, setCalcs] = useState<CalcRow[]>([]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from('calculations')
        .select('id, product_name, lot_quantity, total_cost, sale_price, labor_cost, energy_cost, equipment_cost, rent_cost, other_operational_cost, created_at')
        .order('created_at', { ascending: false });
      setCalcs((data ?? []) as CalcRow[]);
    })();
  }, [user]);

  const filteredOrders = useMemo(() => {
    const { start, end } = getDateRange(period, customStart, customEnd);
    if (!start) return orders;
    return orders.filter(o => {
      const d = new Date(o.created_at);
      return d >= start && (!end || d <= end);
    });
  }, [orders, period, customStart, customEnd]);

  // Operational ratio per calc (from saved calc breakdown)
  const calcOpRatio = useMemo(() => {
    const map = new Map<string, number>();
    calcs.forEach(c => {
      const op = (c.labor_cost || 0) + (c.energy_cost || 0) + (c.equipment_cost || 0) + (c.rent_cost || 0) + (c.other_operational_cost || 0);
      const ratio = c.total_cost > 0 ? Math.min(1, op / c.total_cost) : 0;
      map.set(c.id, ratio);
    });
    return map;
  }, [calcs]);

  const totalFaturamento = filteredOrders.reduce((s, o) => s + (Number((o as any).total_revenue) || 0), 0);
  const totalCustoTotal = filteredOrders.reduce((s, o) => s + (Number((o as any).total_cost) || 0), 0);
  // Approximate operational portion using average ratio across calcs (fallback 0.25)
  const avgOpRatio = calcs.length
    ? Array.from(calcOpRatio.values()).reduce((a, b) => a + b, 0) / Math.max(1, calcOpRatio.size)
    : 0.25;
  const totalCustosOperacionais = totalCustoTotal * avgOpRatio;
  const totalCustoProducao = Math.max(0, totalCustoTotal - totalCustosOperacionais);
  const totalLucro = totalFaturamento - totalCustoTotal;
  const totalAReceber = filteredOrders.reduce((s, o) => s + (Number((o as any).amount_pending) || 0), 0);

  const kpis = [
    { label: 'Faturamento', value: formatCurrency(totalFaturamento), icon: DollarSign, color: 'text-green-500' },
    { label: 'Custo de produção', value: formatCurrency(totalCustoProducao), icon: Factory, color: 'text-orange-500' },
    { label: 'Custos operacionais', value: formatCurrency(totalCustosOperacionais), icon: TrendingDown, color: 'text-red-500' },
    { label: 'Lucro líquido', value: formatCurrency(totalLucro), icon: TrendingUp, color: totalLucro >= 0 ? 'text-emerald-500' : 'text-red-500' },
    { label: 'A receber', value: formatCurrency(totalAReceber), icon: Clock, color: 'text-yellow-500' },
  ];

  const priceVariationRows = useMemo(() => {
    return calcs.map(c => {
      const op = (c.labor_cost || 0) + (c.energy_cost || 0) + (c.equipment_cost || 0) + (c.rent_cost || 0) + (c.other_operational_cost || 0);
      const prod = Math.max(0, (c.total_cost || 0) - op);
      return {
        id: c.id,
        name: c.product_name,
        quantity: c.lot_quantity,
        production: prod,
        operational: op,
        salePrice: c.sale_price,
      };
    });
  }, [calcs]);

  return (
    <AppLayout>
      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 max-w-6xl">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5 sm:mb-6">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-foreground">Financeiro</h1>
            <p className="text-xs sm:text-sm text-muted-foreground">Visão consolidada dos pedidos e cálculos</p>
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

        <div className="grid grid-cols-2 lg:grid-cols-5 gap-2 sm:gap-3 mb-5 sm:mb-6">
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

        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-sm sm:text-base font-semibold text-foreground">Variações de preço</h2>
          <p className="text-xs text-muted-foreground">{priceVariationRows.length} cálculos</p>
        </div>
        <Card className="bg-card border-border overflow-hidden">
          <div className="overflow-x-auto">
            <Table className="min-w-[640px]">
              <TableHeader>
                <TableRow>
                  <TableHead>Produto</TableHead>
                  <TableHead className="text-right">Quantidade</TableHead>
                  <TableHead className="text-right">Custo de produção</TableHead>
                  <TableHead className="text-right">Custo operacional</TableHead>
                  <TableHead className="text-right">Preço de venda</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {priceVariationRows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      Nenhum cálculo encontrado.
                    </TableCell>
                  </TableRow>
                ) : priceVariationRows.map(r => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">{r.name || '—'}</TableCell>
                    <TableCell className="text-right tabular-nums">{r.quantity}</TableCell>
                    <TableCell className="text-right tabular-nums">{formatCurrency(r.production)}</TableCell>
                    <TableCell className="text-right tabular-nums text-red-500">{formatCurrency(r.operational)}</TableCell>
                    <TableCell className="text-right tabular-nums font-semibold text-emerald-600">{formatCurrency(r.salePrice)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      </div>
    </AppLayout>
  );
};

export default Financeiro;
