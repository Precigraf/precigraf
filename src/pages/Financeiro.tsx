import React, { useState, useMemo } from 'react';
import { DollarSign, TrendingDown, TrendingUp, Clock, Factory } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/components/AppLayout';
import PeriodFilter, { type PeriodKey, getDateRange } from '@/components/PeriodFilter';
import { useOrders } from '@/hooks/useOrders';
import { useProducts } from '@/hooks/useProducts';

const formatCurrency = (v: number) =>
  (Number.isFinite(v) ? v : 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const Financeiro: React.FC = () => {
  const { orders } = useOrders();
  const { products } = useProducts();
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

  // Deterministic prod/op breakdown using product price_tiers
  const breakdown = useMemo(() => {
    let revenue = 0;
    let prod = 0;
    let op = 0;
    let pending = 0;

    const productMap = new Map(products.map(p => [p.id, p]));

    for (const o of filteredOrders) {
      revenue += Number((o as any).total_revenue) || 0;
      pending += Number((o as any).amount_pending) || 0;

      const items: Array<{ product_id?: string | null; quantity: number; unit_value: number; name?: string }> =
        Array.isArray(o.quotes?.items) ? (o.quotes!.items as any[]) : [];
      let orderProd = 0;
      let orderOp = 0;
      for (const it of items) {
        const qty = Number(it.quantity) || 0;
        if (!qty) continue;
        const p = it.product_id ? productMap.get(it.product_id) : null;
        if (!p) continue;
        const tiers = Array.isArray(p.price_tiers) ? (p.price_tiers as any[]) : [];
        const tier = tiers.find(t => Number(t.quantity) === qty) || tiers[0];
        if (!tier) continue;
        const tierQty = Math.max(1, Number(tier.quantity) || 1);
        const cp = tier.cost_production != null ? Number(tier.cost_production) : Number(tier.cost ?? 0);
        const co = tier.cost_operational != null ? Number(tier.cost_operational) : 0;
        orderProd += (cp / tierQty) * qty;
        orderOp += (co / tierQty) * qty;
      }

      // Fallback: if order had no derivable breakdown but a total_cost, attribute to production
      if (orderProd === 0 && orderOp === 0) {
        orderProd = Number((o as any).total_cost) || 0;
      }
      prod += orderProd;
      op += orderOp;
    }

    const profit = revenue - prod - op;
    return { revenue, prod, op, profit, pending };
  }, [filteredOrders, products]);

  const kpis = [
    { label: 'Faturamento', value: formatCurrency(breakdown.revenue), icon: DollarSign, color: 'text-green-500' },
    { label: 'Custo de produção', value: formatCurrency(breakdown.prod), icon: Factory, color: 'text-orange-500' },
    { label: 'Custos operacionais', value: formatCurrency(breakdown.op), icon: TrendingDown, color: 'text-red-500' },
    { label: 'Lucro líquido', value: formatCurrency(breakdown.profit), icon: TrendingUp, color: breakdown.profit >= 0 ? 'text-emerald-500' : 'text-red-500' },
    { label: 'A receber', value: formatCurrency(breakdown.pending), icon: Clock, color: 'text-yellow-500' },
  ];

  // Variações de preço — derived from product tiers (single source of truth)
  const priceVariationRows = useMemo(() => {
    const rows: Array<{ id: string; name: string; quantity: number; production: number; operational: number; salePrice: number }> = [];
    products.forEach(p => {
      const tiers = Array.isArray(p.price_tiers) ? p.price_tiers : [];
      tiers.forEach((t: any, idx: number) => {
        const cp = t.cost_production != null ? Number(t.cost_production) : Number(t.cost ?? 0);
        const co = t.cost_operational != null ? Number(t.cost_operational) : 0;
        rows.push({
          id: `${p.id}-${idx}`,
          name: p.name,
          quantity: Number(t.quantity) || 0,
          production: cp,
          operational: co,
          salePrice: Number(t.price) || 0,
        });
      });
    });
    return rows;
  }, [products]);

  return (
    <AppLayout>
      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 max-w-6xl">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5 sm:mb-6">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-foreground">Financeiro</h1>
            <p className="text-xs sm:text-sm text-muted-foreground">Visão consolidada dos pedidos e variações de preço</p>
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
          <p className="text-xs text-muted-foreground">{priceVariationRows.length} variações</p>
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
                      Nenhuma variação cadastrada.
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
