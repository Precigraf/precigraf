import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface ManualEntryItem {
  name: string;
  quantity: number;
  unit_value: number;
  product_id?: string | null;
}

export interface ManualEntryInput {
  client_id: string;
  entry_date: string; // YYYY-MM-DD
  items: ManualEntryItem[];
  total_cost: number;
  amount_received: number;
  notes?: string | null;
  receivable_due_date?: string | null;
}

export function useManualEntries() {
  const { user } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();

  const createManualEntry = useMutation({
    mutationFn: async (input: ManualEntryInput) => {
      if (!user) throw new Error('Not authenticated');
      const itemsWithIds = input.items.map(it => ({ id: crypto.randomUUID(), ...it }));
      const subtotal = itemsWithIds.reduce((s, it) => s + it.quantity * it.unit_value, 0);
      const total = subtotal;
      const amountReceived = Math.min(input.amount_received, total);
      const amountPending = Math.max(0, total - amountReceived);
      const createdAt = new Date(`${input.entry_date}T12:00:00`).toISOString();

      // 1. quote
      const { data: quote, error: qErr } = await supabase
        .from('quotes')
        .insert({
          user_id: user.id,
          client_id: input.client_id,
          status: 'approved',
          items: itemsWithIds as any,
          subtotal,
          total_value: total,
          unit_value: itemsWithIds[0]?.unit_value ?? 0,
          quantity: itemsWithIds[0]?.quantity ?? 1,
          product_name: itemsWithIds[0]?.name ?? 'Entrada manual',
          notes: input.notes ?? null,
          raw_data: { manual_entry: true } as any,
          discount_value: 0,
          shipping_value: 0,
        })
        .select('id')
        .single();
      if (qErr) throw qErr;

      // 2. order
      const { data: order, error: oErr } = await supabase
        .from('orders')
        .insert({
          user_id: user.id,
          client_id: input.client_id,
          quote_id: quote.id,
          status: 'delivered',
          total_revenue: total,
          total_cost: Math.max(0, input.total_cost),
          amount_received: amountReceived,
          amount_pending: amountPending,
          created_at: createdAt,
        })
        .select('id')
        .single();
      if (oErr) throw oErr;

      // 3. receivable when pending
      if (amountPending > 0) {
        const due = input.receivable_due_date || input.entry_date;
        const { error: rErr } = await supabase.from('receivables').insert({
          user_id: user.id,
          order_id: order.id,
          amount: amountPending,
          due_date: due,
          installment_number: 1,
          installment_total: 1,
        });
        if (rErr) throw rErr;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['orders'] });
      qc.invalidateQueries({ queryKey: ['quotes'] });
      qc.invalidateQueries({ queryKey: ['receivables'] });
      toast({ title: 'Entrada registrada!' });
    },
    onError: (e: Error) => {
      toast({ title: 'Erro ao registrar entrada', description: e.message, variant: 'destructive' });
    },
  });

  return { createManualEntry };
}
