import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { startOfWeek, format, differenceInDays, eachDayOfInterval, eachWeekOfInterval, eachMonthOfInterval } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useMemo } from 'react';

interface RevenueDataPoint {
  label: string;
  faturamento: number;
  despesas: number;
  lucro: number;
}

export function useRevenueChart(rangeStart: Date | null, rangeEnd: Date | null) {
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
    const start = rangeStart ?? (orders.length > 0 ? new Date(orders[0].created_at) : now);
    const end = rangeEnd ?? now;

    const filteredOrders = orders.filter(o => {
      const d = new Date(o.created_at);
      return d >= start && d <= end;
    });

    const spanDays = differenceInDays(end, start);

    let intervals: Date[];
    let formatLabel: (d: Date) => string;
    let getKey: (d: Date) => string;

    if (spanDays <= 31) {
      intervals = eachDayOfInterval({ start, end });
      formatLabel = (d) => format(d, 'dd/MM', { locale: ptBR });
      getKey = (d) => format(d, 'yyyy-MM-dd');
    } else if (spanDays <= 120) {
      intervals = eachWeekOfInterval({ start, end }, { weekStartsOn: 1 });
      formatLabel = (d) => format(d, 'dd/MM', { locale: ptBR });
      getKey = (d) => format(startOfWeek(d, { weekStartsOn: 1 }), 'yyyy-MM-dd');
    } else {
      intervals = eachMonthOfInterval({ start, end });
      formatLabel = (d) => format(d, 'MMM/yy', { locale: ptBR });
      getKey = (d) => format(d, 'yyyy-MM');
    }

    const grouped: Record<string, { revenue: number; cost: number }> = {};
    for (const order of filteredOrders) {
      const date = new Date(order.created_at);
      let key: string;
      if (spanDays <= 31) {
        key = format(date, 'yyyy-MM-dd');
      } else if (spanDays <= 120) {
        key = format(startOfWeek(date, { weekStartsOn: 1 }), 'yyyy-MM-dd');
      } else {
        key = format(date, 'yyyy-MM');
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
  }, [ordersQuery.data, rangeStart, rangeEnd]);

  const totals = useMemo(() => {
    const orders = ordersQuery.data ?? [];
    const start = rangeStart;
    const end = rangeEnd ?? new Date();
    const filtered = start ? orders.filter(o => {
      const d = new Date(o.created_at);
      return d >= start && d <= end;
    }) : orders;

    const faturamento = filtered.reduce((s, o) => s + (Number(o.total_revenue) || 0), 0);
    const despesas = filtered.reduce((s, o) => s + (Number(o.total_cost) || 0), 0);
    const aReceber = filtered.reduce((s, o) => s + (Number(o.amount_received) || 0), 0);
    return {
      faturamento,
      despesas,
      lucro: faturamento - despesas,
      aReceber: faturamento - aReceber,
    };
  }, [ordersQuery.data, rangeStart, rangeEnd]);

  return { chartData, totals, isLoading: ordersQuery.isLoading };
}
