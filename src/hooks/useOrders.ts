import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useEffect } from 'react';

export const KANBAN_COLUMNS = [
  { id: 'approved', label: 'Aprovado', color: 'bg-blue-500' },
  { id: 'creating_art', label: 'Criando Arte', color: 'bg-purple-500' },
  { id: 'awaiting_client_approval', label: 'Aguardando Aprovação', color: 'bg-yellow-500' },
  { id: 'in_production', label: 'Em Produção', color: 'bg-orange-500' },
  { id: 'in_transit', label: 'Em Transporte', color: 'bg-cyan-500' },
  { id: 'delivered', label: 'Entregue', color: 'bg-green-500' },
] as const;

export type KanbanStatus = typeof KANBAN_COLUMNS[number]['id'];

export interface Order {
  id: string;
  user_id: string;
  client_id: string;
  quote_id: string;
  status: string;
  kanban_position: number;
  order_number: number | null;
  tracking_token: string | null;
  total_revenue: number;
  total_cost: number;
  amount_received: number;
  amount_pending: number;
  created_at: string;
  updated_at: string;
  clients?: { name: string; whatsapp: string | null } | null;
  quotes?: { total_value: number; description: string | null; product_name: string | null; items: any; quote_number: number | null } | null;
}

export interface OrderStatusHistory {
  id: string;
  order_id: string;
  user_id: string;
  old_status: string | null;
  new_status: string;
  created_at: string;
}

export function useOrders() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const ordersQuery = useQuery({
    queryKey: ['orders', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('*, clients(name, whatsapp), quotes(total_value, description, product_name, items, quote_number)')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as Order[];
    },
    enabled: !!user,
  });

  // Realtime subscription
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel('orders-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
        queryClient.invalidateQueries({ queryKey: ['orders'] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, queryClient]);

  const updateOrderStatus = useMutation({
    mutationFn: async ({ orderId, newStatus, oldStatus }: { orderId: string; newStatus: string; oldStatus: string }) => {
      if (!user) throw new Error('Not authenticated');
      const { error: updateError } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', orderId);
      if (updateError) throw updateError;

      const { error: historyError } = await supabase
        .from('order_status_history')
        .insert({ order_id: orderId, user_id: user.id, old_status: oldStatus, new_status: newStatus });
      if (historyError) throw historyError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
    onError: (error: Error) => {
      toast({ title: 'Erro ao mover pedido', description: error.message, variant: 'destructive' });
    },
  });

  const updateOrderPosition = useMutation({
    mutationFn: async ({ orderId, position }: { orderId: string; position: number }) => {
      const { error } = await supabase
        .from('orders')
        .update({ kanban_position: position })
        .eq('id', orderId);
      if (error) throw error;
    },
  });

  const updatePaymentReceived = useMutation({
    mutationFn: async ({ orderId, additionalAmount }: { orderId: string; additionalAmount: number }) => {
      // Get current order
      const order = ordersQuery.data?.find(o => o.id === orderId);
      if (!order) throw new Error('Order not found');
      const newReceived = (Number(order.amount_received) || 0) + additionalAmount;
      const newPending = Math.max(0, (Number(order.total_revenue) || 0) - newReceived);
      const { error } = await supabase
        .from('orders')
        .update({ amount_received: newReceived, amount_pending: newPending })
        .eq('id', orderId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      toast({ title: 'Pagamento registrado!' });
    },
    onError: (error: Error) => {
      toast({ title: 'Erro ao registrar pagamento', description: error.message, variant: 'destructive' });
    },
  });

  const getOrderHistory = async (orderId: string) => {
    const { data, error } = await supabase
      .from('order_status_history')
      .select('*')
      .eq('order_id', orderId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data as OrderStatusHistory[];
  };

  const deleteOrder = useMutation({
    mutationFn: async (orderId: string) => {
      const { error } = await supabase.from('orders').delete().eq('id', orderId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      toast({ title: 'Pedido excluído.' });
    },
    onError: (error: Error) => {
      toast({ title: 'Erro ao excluir', description: error.message, variant: 'destructive' });
    },
  });

  const addItemToOrder = useMutation({
    mutationFn: async ({ orderId, item }: { orderId: string; item: { name: string; quantity: number; unit_value: number; product_id?: string | null } }) => {
      const order = ordersQuery.data?.find(o => o.id === orderId);
      if (!order) throw new Error('Pedido não encontrado');
      const addedRevenue = item.quantity * item.unit_value;
      const newRevenue = (Number(order.total_revenue) || 0) + addedRevenue;
      const newPending = Math.max(0, newRevenue - (Number(order.amount_received) || 0));

      // Append item to quote.items JSONB
      if (order.quote_id) {
        const currentItems = Array.isArray(order.quotes?.items) ? order.quotes!.items : [];
        const newItems = [...currentItems, { id: crypto.randomUUID(), ...item }];
        const { error: qErr } = await supabase.from('quotes').update({ items: newItems }).eq('id', order.quote_id);
        if (qErr) throw qErr;
      }

      const { error } = await supabase
        .from('orders')
        .update({ total_revenue: newRevenue, amount_pending: newPending })
        .eq('id', orderId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['quotes'] });
      toast({ title: 'Item adicionado ao pedido!' });
    },
    onError: (error: Error) => {
      toast({ title: 'Erro ao adicionar item', description: error.message, variant: 'destructive' });
    },
  });

  return {
    orders: ordersQuery.data ?? [],
    isLoading: ordersQuery.isLoading,
    updateOrderStatus,
    updateOrderPosition,
    updatePaymentReceived,
    getOrderHistory,
    deleteOrder,
    addItemToOrder,
  };
}
