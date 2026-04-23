import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface InventoryMaterial {
  id: string;
  user_id: string;
  name: string;
  unit: string;
  current_stock: number;
  min_stock: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface MaterialInput {
  name: string;
  unit: string;
  min_stock: number;
  notes?: string | null;
}

export const useInventory = () => {
  const { user } = useAuth();
  const qc = useQueryClient();

  const { data: materials = [], isLoading } = useQuery({
    queryKey: ['inventory_materials', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('inventory_materials')
        .select('*')
        .order('name');
      if (error) throw error;
      return (data || []) as InventoryMaterial[];
    },
  });

  const createMaterial = useMutation({
    mutationFn: async (input: MaterialInput) => {
      if (!user) throw new Error('Não autenticado');
      const { data, error } = await supabase
        .from('inventory_materials')
        .insert({ ...input, user_id: user.id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['inventory_materials'] });
      toast.success('Material criado');
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const updateMaterial = useMutation({
    mutationFn: async ({ id, ...input }: MaterialInput & { id: string }) => {
      const { data, error } = await supabase
        .from('inventory_materials')
        .update(input)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['inventory_materials'] });
      toast.success('Material atualizado');
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMaterial = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('inventory_materials').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['inventory_materials'] });
      toast.success('Material excluído');
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const lowStockMaterials = materials.filter(
    (m) => m.min_stock > 0 && m.current_stock <= m.min_stock
  );

  return { materials, lowStockMaterials, isLoading, createMaterial, updateMaterial, deleteMaterial };
};
