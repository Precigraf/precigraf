import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface Expense {
  id: string;
  user_id: string;
  description: string;
  amount: number;
  expense_date: string;
  category: string;
  created_at: string;
}

export function useExpenses() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['expenses', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .order('expense_date', { ascending: false });
      if (error) throw error;
      return data as Expense[];
    },
    enabled: !!user,
  });

  const createExpense = useMutation({
    mutationFn: async (expense: { description: string; amount: number; expense_date: string; category: string }) => {
      if (!user) throw new Error('Not authenticated');
      const { error } = await supabase.from('expenses').insert({ ...expense, user_id: user.id });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      toast({ title: 'Despesa registrada!' });
    },
    onError: (e: Error) => {
      toast({ title: 'Erro ao registrar despesa', description: e.message, variant: 'destructive' });
    },
  });

  const deleteExpense = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('expenses').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      toast({ title: 'Despesa removida!' });
    },
    onError: (e: Error) => {
      toast({ title: 'Erro ao remover', description: e.message, variant: 'destructive' });
    },
  });

  return {
    expenses: query.data ?? [],
    isLoading: query.isLoading,
    createExpense,
    deleteExpense,
  };
}
