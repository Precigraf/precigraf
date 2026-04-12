import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface Quote {
  id: string;
  user_id: string;
  client_id: string;
  calculation_id: string | null;
  description: string | null;
  product_name: string | null;
  total_value: number;
  unit_value: number | null;
  quantity: number | null;
  status: string;
  raw_data: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
  clients?: { name: string; whatsapp: string | null } | null;
}

export function useQuotes() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const quotesQuery = useQuery({
    queryKey: ['quotes', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('quotes')
        .select('*, clients(name, whatsapp)')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as Quote[];
    },
    enabled: !!user,
  });

  const createQuote = useMutation({
    mutationFn: async (quote: {
      client_id: string;
      calculation_id?: string | null;
      description?: string;
      product_name?: string;
      total_value: number;
      unit_value?: number;
      quantity?: number;
      raw_data?: Record<string, unknown>;
    }) => {
      if (!user) throw new Error('Not authenticated');
      const { data, error } = await supabase
        .from('quotes')
        .insert({ ...quote, user_id: user.id, status: 'pending' })
        .select('*, clients(name, whatsapp)')
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotes'] });
      toast({ title: 'Orçamento criado com sucesso!' });
    },
    onError: (error: Error) => {
      toast({ title: 'Erro ao criar orçamento', description: error.message, variant: 'destructive' });
    },
  });

  const approveQuote = useMutation({
    mutationFn: async (quoteId: string) => {
      if (!user) throw new Error('Not authenticated');
      // Update quote status
      const { data: quote, error: quoteError } = await supabase
        .from('quotes')
        .update({ status: 'approved' })
        .eq('id', quoteId)
        .select('*, clients(name, whatsapp)')
        .single();
      if (quoteError) throw quoteError;

      // Create order automatically
      const { error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: user.id,
          client_id: quote.client_id,
          quote_id: quoteId,
          status: 'approved',
          kanban_position: 0,
        });
      if (orderError) throw orderError;

      return quote;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotes'] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      toast({ title: 'Orçamento aprovado! Pedido criado automaticamente.' });
    },
    onError: (error: Error) => {
      toast({ title: 'Erro ao aprovar orçamento', description: error.message, variant: 'destructive' });
    },
  });

  const rejectQuote = useMutation({
    mutationFn: async (quoteId: string) => {
      const { error } = await supabase
        .from('quotes')
        .update({ status: 'rejected' })
        .eq('id', quoteId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotes'] });
      toast({ title: 'Orçamento recusado.' });
    },
    onError: (error: Error) => {
      toast({ title: 'Erro ao recusar orçamento', description: error.message, variant: 'destructive' });
    },
  });

  const deleteQuote = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('quotes').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotes'] });
      toast({ title: 'Orçamento excluído.' });
    },
    onError: (error: Error) => {
      toast({ title: 'Erro ao excluir orçamento', description: error.message, variant: 'destructive' });
    },
  });

  return { quotes: quotesQuery.data ?? [], isLoading: quotesQuery.isLoading, createQuote, approveQuote, rejectQuote, deleteQuote };
}
