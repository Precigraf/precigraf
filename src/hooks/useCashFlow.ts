import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export type CashFlowType = 'in' | 'out';
export type CashFlowStatus = 'realized' | 'forecast' | 'overdue';

export interface CashFlowEntry {
  id: string;
  date: string; // YYYY-MM-DD
  type: CashFlowType;
  status: CashFlowStatus;
  source: 'receivable' | 'expense' | 'manual_entry' | 'order_cost';
  origin_label: string; // e.g. "Pedido #12 — João"
  category: string;
  amount: number;
  link?: string;
  ref_id?: string;
}

export interface DailyBucket {
  date: string;
  in: number;
  out: number;
  forecastIn: number;
  forecastOut: number;
  balance: number; // cumulative realized balance
}

export interface CashFlowResult {
  entries: CashFlowEntry[];
  totals: {
    realizedIn: number;
    realizedOut: number;
    realizedBalance: number;
    forecastIn: number;
    overdue: number;
  };
  daily: DailyBucket[];
  upcoming: CashFlowEntry[]; // next 30 days previstos
}

const toDateKey = (d: string | Date) => {
  const dt = typeof d === 'string' ? new Date(d) : d;
  const y = dt.getFullYear();
  const m = String(dt.getMonth() + 1).padStart(2, '0');
  const day = String(dt.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

const inRange = (date: string, start: Date | null, end: Date | null) => {
  if (!start) return true;
  const d = new Date(date + 'T12:00:00');
  if (d < new Date(start.getFullYear(), start.getMonth(), start.getDate())) return false;
  if (end && d > new Date(end.getFullYear(), end.getMonth(), end.getDate(), 23, 59, 59)) return false;
  return true;
};

export function useCashFlow(params: { start: Date | null; end: Date | null }) {
  const { user } = useAuth();
  const { start, end } = params;

  return useQuery<CashFlowResult>({
    queryKey: ['cashflow', user?.id, start?.toISOString() ?? 'all', end?.toISOString() ?? 'all'],
    enabled: !!user,
    queryFn: async () => {
      const [recvRes, expRes, ordersRes] = await Promise.all([
        supabase.from('receivables').select('*'),
        supabase.from('expenses').select('*'),
        supabase
          .from('orders')
          .select('id, order_number, total_cost, total_revenue, created_at, status, clients(name), quotes(raw_data, product_name)'),
      ]);

      if (recvRes.error) throw recvRes.error;
      if (expRes.error) throw expRes.error;
      if (ordersRes.error) throw ordersRes.error;

      const receivables = recvRes.data ?? [];
      const expenses = expRes.data ?? [];
      const orders = (ordersRes.data ?? []) as any[];

      const orderById = new Map(orders.map((o) => [o.id, o]));
      const today = toDateKey(new Date());
      const entries: CashFlowEntry[] = [];

      // Receivables → entradas
      for (const r of receivables as any[]) {
        const order = orderById.get(r.order_id);
        const clientName = order?.clients?.name ?? 'Cliente';
        const orderLabel = order?.order_number ? `Pedido #${order.order_number}` : 'Pedido';
        const isManual = !!order?.quotes?.raw_data?.manual_entry;
        const source: CashFlowEntry['source'] = isManual ? 'manual_entry' : 'receivable';

        const paid = Number(r.amount_paid) || 0;
        const total = Number(r.amount) || 0;
        const pending = Math.max(total - paid, 0);

        // Realizado (parte paga)
        if (paid > 0) {
          const paidDate = toDateKey(r.paid_at ?? r.updated_at ?? r.created_at);
          entries.push({
            id: `r-paid-${r.id}`,
            date: paidDate,
            type: 'in',
            status: 'realized',
            source,
            origin_label: `${orderLabel} — ${clientName}`,
            category: isManual ? 'Entrada manual' : 'Recebimento',
            amount: paid,
            link: '/financeiro/receber',
            ref_id: r.id,
          });
        }

        // Previsto (parte pendente)
        if (pending > 0) {
          const dueDate = toDateKey(r.due_date);
          const overdue = dueDate < today;
          entries.push({
            id: `r-due-${r.id}`,
            date: dueDate,
            type: 'in',
            status: overdue ? 'overdue' : 'forecast',
            source,
            origin_label: `${orderLabel} — ${clientName}`,
            category: overdue ? 'Atrasado' : 'A receber',
            amount: pending,
            link: '/financeiro/receber',
            ref_id: r.id,
          });
        }
      }

      // Expenses → saídas realizadas
      for (const e of expenses as any[]) {
        entries.push({
          id: `e-${e.id}`,
          date: e.expense_date,
          type: 'out',
          status: 'realized',
          source: 'expense',
          origin_label: e.description,
          category: e.category || 'Despesa',
          amount: Number(e.amount) || 0,
          link: '/financeiro',
          ref_id: e.id,
        });
      }

      // Custo de produção de pedidos entregues → saídas realizadas
      for (const o of orders) {
        const cost = Number(o.total_cost) || 0;
        if (cost <= 0) continue;
        if (o.status !== 'delivered') continue;
        const isManual = !!o.quotes?.raw_data?.manual_entry;
        if (isManual) continue; // manual entries já tratam custo separadamente; evita dupla contagem se quiser
        entries.push({
          id: `oc-${o.id}`,
          date: toDateKey(o.updated_at ?? o.created_at),
          type: 'out',
          status: 'realized',
          source: 'order_cost',
          origin_label: `Custo Pedido #${o.order_number ?? '—'} — ${o.clients?.name ?? ''}`,
          category: 'Custo de produção',
          amount: cost,
          link: '/pedidos',
          ref_id: o.id,
        });
      }

      // Filtra por período
      const filtered = entries.filter((e) => inRange(e.date, start, end));

      // Totais
      let realizedIn = 0, realizedOut = 0, forecastIn = 0, overdue = 0;
      for (const e of filtered) {
        if (e.status === 'realized') {
          if (e.type === 'in') realizedIn += e.amount;
          else realizedOut += e.amount;
        } else if (e.status === 'forecast' && e.type === 'in') {
          forecastIn += e.amount;
        } else if (e.status === 'overdue' && e.type === 'in') {
          overdue += e.amount;
        }
      }

      // Bucket diário
      const dailyMap = new Map<string, DailyBucket>();
      for (const e of filtered) {
        let b = dailyMap.get(e.date);
        if (!b) {
          b = { date: e.date, in: 0, out: 0, forecastIn: 0, forecastOut: 0, balance: 0 };
          dailyMap.set(e.date, b);
        }
        if (e.status === 'realized') {
          if (e.type === 'in') b.in += e.amount;
          else b.out += e.amount;
        } else if (e.type === 'in') {
          b.forecastIn += e.amount;
        } else {
          b.forecastOut += e.amount;
        }
      }
      const daily = Array.from(dailyMap.values()).sort((a, b) => a.date.localeCompare(b.date));
      let acc = 0;
      for (const d of daily) {
        acc += d.in - d.out;
        d.balance = acc;
      }

      // Próximos 30 dias previstos (independente do filtro)
      const in30 = new Date();
      in30.setDate(in30.getDate() + 30);
      const upcoming = entries
        .filter((e) => (e.status === 'forecast' || e.status === 'overdue') && e.type === 'in')
        .filter((e) => {
          const d = new Date(e.date + 'T12:00:00');
          return d <= in30;
        })
        .sort((a, b) => a.date.localeCompare(b.date));

      // Ordena entradas por data desc
      filtered.sort((a, b) => b.date.localeCompare(a.date));

      return {
        entries: filtered,
        totals: {
          realizedIn,
          realizedOut,
          realizedBalance: realizedIn - realizedOut,
          forecastIn,
          overdue,
        },
        daily,
        upcoming,
      };
    },
  });
}
