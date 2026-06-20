import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export type SupplyType = 'paper' | 'ink' | 'handle' | 'packaging' | 'glue' | 'other';

export interface Supply {
  id: string;
  user_id: string;
  name: string;
  type: SupplyType;
  category_id: string | null;
  unit: string;
  quantity: number;
  unit_cost: number;
  min_alert: number;
  expiry_date: string | null;
  notes: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface SupplyMovement {
  id: string;
  supply_id: string;
  user_id: string;
  type: 'in' | 'out';
  quantity: number;
  unit_cost: number | null;
  reason: string | null;
  order_id: string | null;
  created_at: string;
}

export interface SupplyLowStock {
  id: string;
  user_id: string;
  name: string;
  type: SupplyType;
  unit: string;
  quantity: number;
  min_alert: number;
  unit_cost: number;
  expiry_date: string | null;
  alert_type: 'out_of_stock' | 'low' | 'expiring_soon' | null;
}

export type SupplyInput = Omit<Supply, 'id' | 'user_id' | 'created_at' | 'updated_at'>;

export function useSupplyStock() {
  const { user } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();

  const supplies = useQuery({
    queryKey: ['supplies', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('supply_stock' as any)
        .select('*')
        .order('name', { ascending: true });
      if (error) throw error;
      return (data ?? []) as unknown as Supply[];
    },
    enabled: !!user,
  });

  useEffect(() => {
    if (!user) return;
    const ch = supabase
      .channel(`supplies-${user.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'supply_stock' }, () =>
        qc.invalidateQueries({ queryKey: ['supplies'] })
      )
      .on('postgres_changes', { event: '*', schema: 'public', table: 'supply_movements' }, () =>
        qc.invalidateQueries({ queryKey: ['supply-movements'] })
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [user, qc]);

  const create = useMutation({
    mutationFn: async (input: SupplyInput) => {
      if (!user) throw new Error('Not authenticated');
      const { error } = await supabase
        .from('supply_stock' as any)
        .insert({ ...input, user_id: user.id } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['supplies'] });
      toast({ title: 'Insumo cadastrado!' });
    },
    onError: (e: Error) => toast({ title: 'Erro', description: e.message, variant: 'destructive' }),
  });

  const update = useMutation({
    mutationFn: async ({ id, ...rest }: Partial<Supply> & { id: string }) => {
      const { error } = await supabase.from('supply_stock' as any).update(rest as any).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['supplies'] });
      toast({ title: 'Insumo atualizado!' });
    },
    onError: (e: Error) => toast({ title: 'Erro', description: e.message, variant: 'destructive' }),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('supply_stock' as any).delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['supplies'] });
      toast({ title: 'Insumo excluído.' });
    },
    onError: (e: Error) => toast({ title: 'Erro', description: e.message, variant: 'destructive' }),
  });

  const restock = useMutation({
    mutationFn: async (args: { supply_id: string; quantity: number; unit_cost?: number | null; reason?: string | null }) => {
      const { error } = await supabase.rpc('restock_supply' as any, {
        p_supply_id: args.supply_id,
        p_quantity: args.quantity,
        p_unit_cost: args.unit_cost ?? null,
        p_reason: args.reason ?? null,
      } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['supplies'] });
      qc.invalidateQueries({ queryKey: ['supply-movements'] });
      toast({ title: 'Entrada registrada!' });
    },
    onError: (e: Error) => toast({ title: 'Erro', description: e.message, variant: 'destructive' }),
  });

  const consume = useMutation({
    mutationFn: async (args: { supply_id: string; quantity: number; reason?: string | null }) => {
      const { error } = await supabase.rpc('consume_supply' as any, {
        p_supply_id: args.supply_id,
        p_quantity: args.quantity,
        p_order_id: null,
        p_reason: args.reason ?? null,
      } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['supplies'] });
      qc.invalidateQueries({ queryKey: ['supply-movements'] });
      toast({ title: 'Saída registrada!' });
    },
    onError: (e: Error) => toast({ title: 'Erro', description: e.message, variant: 'destructive' }),
  });

  return {
    supplies: supplies.data ?? [],
    isLoading: supplies.isLoading,
    create,
    update,
    remove,
    restock,
    consume,
  };
}

export function useSupplyMovements() {
  const { user } = useAuth();
  const q = useQuery({
    queryKey: ['supply-movements', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('supply_movements' as any)
        .select('*')
        .order('created_at', { ascending: false })
        .limit(200);
      if (error) throw error;
      return (data ?? []) as unknown as SupplyMovement[];
    },
    enabled: !!user,
  });
  return { movements: q.data ?? [], isLoading: q.isLoading };
}

export function useSupplyAlerts() {
  const { user } = useAuth();
  const q = useQuery({
    queryKey: ['supply-low-stock', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('supply_low_stock' as any)
        .select('*');
      if (error) throw error;
      return (data ?? []) as unknown as SupplyLowStock[];
    },
    enabled: !!user,
  });
  return { alerts: q.data ?? [], isLoading: q.isLoading };
}

// Product <-> supplies linking
export interface ProductSupplyLink {
  id: string;
  product_id: string;
  supply_id: string;
  quantity_per_unit: number;
}

export function useProductSupplies(productId: string | null | undefined) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { toast } = useToast();

  const q = useQuery({
    queryKey: ['product-supplies', productId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('product_supplies' as any)
        .select('*')
        .eq('product_id', productId as string);
      if (error) throw error;
      return (data ?? []) as unknown as ProductSupplyLink[];
    },
    enabled: !!user && !!productId,
  });

  const save = useMutation({
    mutationFn: async (links: { supply_id: string; quantity_per_unit: number }[]) => {
      if (!user || !productId) throw new Error('Sem produto');
      const { error: delErr } = await supabase
        .from('product_supplies' as any)
        .delete()
        .eq('product_id', productId);
      if (delErr) throw delErr;
      if (links.length === 0) return;
      const rows = links.map((l) => ({
        user_id: user.id,
        product_id: productId,
        supply_id: l.supply_id,
        quantity_per_unit: l.quantity_per_unit,
      }));
      const { error } = await supabase.from('product_supplies' as any).insert(rows as any);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['product-supplies'] });
      toast({ title: 'Insumos do produto salvos!' });
    },
    onError: (e: Error) => toast({ title: 'Erro', description: e.message, variant: 'destructive' }),
  });

  return { links: q.data ?? [], isLoading: q.isLoading, save };
}
