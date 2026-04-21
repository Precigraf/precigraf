import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { startOfDay, startOfWeek, startOfMonth, startOfYear, format, subDays, subWeeks, subMonths, subYears, eachDayOfInterval, eachWeekOfInterval, eachMonthOfInterval } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useMemo } from 'react';

export type ChartPeriod = 'daily' | 'weekly' | 'monthly' | 'yearly';

interface RevenueDataPoint {
  label: string;
  faturamento: number;
  despesas: number;
  lucro: number;
}

export function useRevenueChart(period: ChartPeriod) {
  const { user } = useAuth();

  const ordersQuery = useQuery({
    queryKey: ['revenue-chart', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('created_at, status, total_revenue, total_cost, amount_received')
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const chartData = useMemo((): RevenueDataPoint[] => {
    const orders = ordersQuery.data ?? [];
    if (orders.length === 0) return [];

    const now = new Date();
    let intervals: Date[];
    let formatLabel: (d: Date) => string;
    let getKey: (d: Date) => string;
    let rangeStart: Date;

    switch (period) {
      case 'daily':
        rangeStart = subDays(now, 30);
        intervals = eachDayOfInterval({ start: rangeStart, end: now });
        formatLabel = (d) => format(d, 'dd/MM', { locale: ptBR });
        getKey = (d) => format(d, 'yyyy-MM-dd');
        break;
      case 'weekly':
        rangeStart = subWeeks(now, 12);
        intervals = eachWeekOfInterval({ start: rangeStart, end: now }, { weekStartsOn: 1 });
        formatLabel = (d) => format(d, "dd/MM", { locale: ptBR });
        getKey = (d) => format(startOfWeek(d, { weekStartsOn: 1 }), 'yyyy-MM-dd');
        break;
      case 'monthly':
        rangeStart = subMonths(now, 12);
        intervals = eachMonthOfInterval({ start: rangeStart, end: now });
        formatLabel = (d) => format(d, 'MMM/yy', { locale: ptBR });
        getKey = (d) => format(d, 'yyyy-MM');
        break;
      case 'yearly':
        rangeStart = subYears(now, 5);
        intervals = [];
        for (let y = rangeStart.getFullYear(); y <= now.getFullYear(); y++) {
          intervals.push(new Date(y, 0, 1));
        }
        formatLabel = (d) => format(d, 'yyyy');
        getKey = (d) => format(d, 'yyyy');
        break;
    }

    // Group orders by period key
    const grouped: Record<string, { revenue: number; cost: number }> = {};
    for (const order of orders) {
      const date = new Date(order.created_at);
      let key: string;
      switch (period) {
        case 'daily': key = format(date, 'yyyy-MM-dd'); break;
        case 'weekly': key = format(startOfWeek(date, { weekStartsOn: 1 }), 'yyyy-MM-dd'); break;
        case 'monthly': key = format(date, 'yyyy-MM'); break;
        case 'yearly': key = format(date, 'yyyy'); break;
      }
      if (!grouped[key]) grouped[key] = { revenue: 0, cost: 0 };
      grouped[key].revenue += Number(order.total_revenue) || 0;
      grouped[key].cost += Number(order.total_cost) || 0;
    }

    return intervals.map(d => {
      const key = getKey(d);
      const g = grouped[key] || { revenue: 0, cost: 0 };
      return {
        label: formatLabel(d),
        faturamento: g.revenue,
        despesas: g.cost,
        lucro: g.revenue - g.cost,
      };
    });
  }, [ordersQuery.data, period]);

  // Summary totals
  const totals = useMemo(() => {
    const orders = ordersQuery.data ?? [];
    const faturamento = orders.reduce((s, o) => s + (Number(o.total_revenue) || 0), 0);
    const despesas = orders.reduce((s, o) => s + (Number(o.total_cost) || 0), 0);
    const aReceber = orders.reduce((s, o) => s + (Number(o.amount_received) || 0), 0);
    return {
      faturamento,
      despesas,
      lucro: faturamento - despesas,
      aReceber: faturamento - aReceber,
    };
  }, [ordersQuery.data]);

  return { chartData, totals, isLoading: ordersQuery.isLoading };
}
