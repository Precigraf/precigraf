import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface Product {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  unit_price: number;
  default_quantity: number;
  created_at: string;
  updated_at: string;
}

export type ProductInput = Omit<Product, 'id' | 'user_id' | 'created_at' | 'updated_at'>;

export function useProducts() {
  const { user } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();

  const productsQuery = useQuery({
    queryKey: ['products', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('name', { ascending: true });
      if (error) throw error;
      return data as Product[];
    },
    enabled: !!user,
  });

  const createProduct = useMutation({
    mutationFn: async (input: ProductInput) => {
      if (!user) throw new Error('Not authenticated');
      const { data, error } = await supabase
        .from('products')
        .insert({ ...input, user_id: user.id })
        .select()
        .single();
      if (error) throw error;
      return data as Product;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['products'] });
      toast({ title: 'Produto cadastrado!' });
    },
    onError: (e: Error) => toast({ title: 'Erro ao cadastrar', description: e.message, variant: 'destructive' }),
  });

  const updateProduct = useMutation({
    mutationFn: async ({ id, ...rest }: Partial<Product> & { id: string }) => {
      const { data, error } = await supabase.from('products').update(rest).eq('id', id).select().single();
      if (error) throw error;
      return data as Product;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['products'] });
      toast({ title: 'Produto atualizado!' });
    },
    onError: (e: Error) => toast({ title: 'Erro ao atualizar', description: e.message, variant: 'destructive' }),
  });

  const deleteProduct = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('products').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['products'] });
      toast({ title: 'Produto excluído.' });
    },
    onError: (e: Error) => toast({ title: 'Erro ao excluir', description: e.message, variant: 'destructive' }),
  });

  return {
    products: productsQuery.data ?? [],
    isLoading: productsQuery.isLoading,
    createProduct,
    updateProduct,
    deleteProduct,
  };
}
