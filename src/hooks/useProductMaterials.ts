import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface ProductMaterial {
  id: string;
  user_id: string;
  product_id: string;
  material_id: string;
  quantity_per_unit: number;
  created_at: string;
}

export interface ProductMaterialInput {
  material_id: string;
  quantity_per_unit: number;
}

export const useProductMaterials = (productId?: string) => {
  const { user } = useAuth();
  const qc = useQueryClient();

  const { data: productMaterials = [], isLoading } = useQuery({
    queryKey: ['product_materials', productId],
    enabled: !!user && !!productId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('product_materials')
        .select('*')
        .eq('product_id', productId!);
      if (error) throw error;
      return (data || []) as ProductMaterial[];
    },
  });

  const replaceProductMaterials = useMutation({
    mutationFn: async ({ productId, items }: { productId: string; items: ProductMaterialInput[] }) => {
      if (!user) throw new Error('Não autenticado');
      // delete existing
      const { error: delErr } = await supabase
        .from('product_materials')
        .delete()
        .eq('product_id', productId);
      if (delErr) throw delErr;
      if (items.length === 0) return;
      const { error: insErr } = await supabase.from('product_materials').insert(
        items.map((i) => ({
          product_id: productId,
          material_id: i.material_id,
          quantity_per_unit: i.quantity_per_unit,
          user_id: user.id,
        }))
      );
      if (insErr) throw insErr;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['product_materials'] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return { productMaterials, isLoading, replaceProductMaterials };
};

// Fetch materials for many products at once (for order processing)
export const fetchMaterialsForProducts = async (productIds: string[]) => {
  if (productIds.length === 0) return [];
  const { data, error } = await supabase
    .from('product_materials')
    .select('*')
    .in('product_id', productIds);
  if (error) throw error;
  return (data || []) as ProductMaterial[];
};
