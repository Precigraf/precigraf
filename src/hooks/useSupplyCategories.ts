import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface SupplyCategory {
  id: string;
  user_id: string;
  name: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export function useSupplyCategories() {
  const { user } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();

  const q = useQuery({
    queryKey: ['supply-categories', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('supply_categories' as any)
        .select('*')
        .order('sort_order', { ascending: true })
        .order('name', { ascending: true });
      if (error) throw error;
      return (data ?? []) as unknown as SupplyCategory[];
    },
    enabled: !!user,
  });

  useEffect(() => {
    if (!user) return;
    const ch = supabase
      .channel(`supply-categories-${user.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'supply_categories' }, () =>
        qc.invalidateQueries({ queryKey: ['supply-categories'] })
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [user, qc]);

  const create = useMutation({
    mutationFn: async (name: string) => {
      if (!user) throw new Error('Não autenticado');
      const trimmed = name.trim();
      if (!trimmed) throw new Error('Nome obrigatório');
      const { error } = await supabase
        .from('supply_categories' as any)
        .insert({ user_id: user.id, name: trimmed } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['supply-categories'] });
      toast({ title: 'Categoria criada' });
    },
    onError: (e: Error) => toast({ title: 'Erro', description: e.message, variant: 'destructive' }),
  });

  const update = useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) => {
      const { error } = await supabase
        .from('supply_categories' as any)
        .update({ name: name.trim() } as any)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['supply-categories'] });
      toast({ title: 'Categoria atualizada' });
    },
    onError: (e: Error) => toast({ title: 'Erro', description: e.message, variant: 'destructive' }),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('supply_categories' as any).delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['supply-categories'] });
      qc.invalidateQueries({ queryKey: ['supplies'] });
      toast({ title: 'Categoria removida' });
    },
    onError: (e: Error) => toast({ title: 'Erro', description: e.message, variant: 'destructive' }),
  });

  return {
    categories: q.data ?? [],
    isLoading: q.isLoading,
    create,
    update,
    remove,
  };
}
