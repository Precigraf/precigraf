import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface Receivable {
  id: string;
  user_id: string;
  order_id: string;
  amount: number;
  amount_paid: number;
  due_date: string;
  paid_at: string | null;
  status: 'pendente' | 'parcial' | 'pago' | 'atrasado';
  installment_number: number;
  installment_total: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
  orders?: { order_number: number | null; clients?: { name: string } | null } | null;
}

export function useReceivables() {
  const { user } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ['receivables', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('receivables')
        .select('*, orders(order_number, clients(name))')
        .order('due_date', { ascending: true });
      if (error) throw error;
      return data as Receivable[];
    },
    enabled: !!user,
  });

  const create = useMutation({
    mutationFn: async (input: {
      order_id: string;
      amount: number;
      due_date: string;
      installment_number?: number;
      installment_total?: number;
      notes?: string | null;
    }) => {
      if (!user) throw new Error('Not authenticated');
      const { error } = await supabase.from('receivables').insert({
        user_id: user.id,
        order_id: input.order_id,
        amount: input.amount,
        due_date: input.due_date,
        installment_number: input.installment_number ?? 1,
        installment_total: input.installment_total ?? 1,
        notes: input.notes ?? null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['receivables'] });
      toast({ title: 'Conta a receber criada' });
    },
    onError: (e: Error) => toast({ title: 'Erro', description: e.message, variant: 'destructive' }),
  });

  const registerPayment = useMutation({
    mutationFn: async ({ id, amount }: { id: string; amount: number }) => {
      const current = (query.data ?? []).find((r) => r.id === id);
      if (!current) throw new Error('Conta não encontrada');
      const newPaid = Number(current.amount_paid) + amount;
      const isFull = newPaid >= Number(current.amount);
      const { error } = await supabase
        .from('receivables')
        .update({
          amount_paid: newPaid,
          status: isFull ? 'pago' : 'parcial',
          paid_at: isFull ? new Date().toISOString() : null,
        })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['receivables'] });
      toast({ title: 'Pagamento registrado' });
    },
    onError: (e: Error) => toast({ title: 'Erro', description: e.message, variant: 'destructive' }),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('receivables').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['receivables'] }),
  });

  return {
    items: query.data ?? [],
    isLoading: query.isLoading,
    create,
    registerPayment,
    remove,
  };
}
