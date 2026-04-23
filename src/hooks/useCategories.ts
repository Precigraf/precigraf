import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface ProductCategory {
  id: string;
  user_id: string;
  name: string;
  created_at: string;
}

export function useCategories() {
  const { user } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();

  const categoriesQuery = useQuery({
    queryKey: ['product_categories', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('product_categories')
        .select('*')
        .order('name', { ascending: true });
      if (error) throw error;
      return (data ?? []) as ProductCategory[];
    },
    enabled: !!user,
  });

  const createCategory = useMutation({
    mutationFn: async (name: string) => {
      if (!user) throw new Error('Not authenticated');
      const { data, error } = await supabase
        .from('product_categories')
        .insert({ name: name.trim(), user_id: user.id })
        .select()
        .single();
      if (error) throw error;
      return data as unknown as ProductCategory;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['product_categories'] });
      toast({ title: 'Categoria criada!' });
    },
    onError: (e: Error) => {
      const msg = e.message?.includes('duplicate') ? 'Já existe uma categoria com esse nome.' : e.message;
      toast({ title: 'Erro ao criar categoria', description: msg, variant: 'destructive' });
    },
  });

  const deleteCategory = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('product_categories').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['product_categories'] });
      qc.invalidateQueries({ queryKey: ['products'] });
      toast({ title: 'Categoria excluída.' });
    },
    onError: (e: Error) => toast({ title: 'Erro ao excluir', description: e.message, variant: 'destructive' }),
  });

  return {
    categories: categoriesQuery.data ?? [],
    isLoading: categoriesQuery.isLoading,
    createCategory,
    deleteCategory,
  };
}
