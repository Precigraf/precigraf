import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface InventoryMovement {
  id: string;
  user_id: string;
  material_id: string;
  movement_type: 'in' | 'out' | 'adjustment';
  quantity: number;
  unit_cost: number | null;
  notes: string | null;
  reference_type: 'purchase' | 'order' | 'manual' | null;
  reference_id: string | null;
  created_at: string;
}

export interface MovementInput {
  material_id: string;
  movement_type: 'in' | 'out' | 'adjustment';
  quantity: number; // signed
  unit_cost?: number | null;
  notes?: string | null;
  reference_type?: 'purchase' | 'order' | 'manual' | null;
  reference_id?: string | null;
}

export const useInventoryMovements = () => {
  const { user } = useAuth();
  const qc = useQueryClient();

  const { data: movements = [], isLoading } = useQuery({
    queryKey: ['inventory_movements', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('inventory_movements')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(500);
      if (error) throw error;
      return (data || []) as InventoryMovement[];
    },
  });

  const createMovement = useMutation({
    mutationFn: async (input: MovementInput) => {
      if (!user) throw new Error('Não autenticado');
      const { data, error } = await supabase
        .from('inventory_movements')
        .insert({ ...input, user_id: user.id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['inventory_movements'] });
      qc.invalidateQueries({ queryKey: ['inventory_materials'] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return { movements, isLoading, createMovement };
};
