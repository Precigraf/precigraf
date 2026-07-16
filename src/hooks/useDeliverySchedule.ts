import { useMemo } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useOrders, type Order } from '@/hooks/useOrders';

export type DeliveryBucket = 'overdue' | 'today' | 'soon' | 'scheduled' | 'delivered' | 'none';

export function getDeliveryBucket(order: Order, today = new Date()): DeliveryBucket {
  if (order.status === 'delivered') return 'delivered';
  if (!order.delivery_date) return 'none';
  const d = new Date(order.delivery_date + 'T00:00:00');
  const t = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const diffDays = Math.round((d.getTime() - t.getTime()) / 86400000);
  if (diffDays < 0) return 'overdue';
  if (diffDays === 0) return 'today';
  if (diffDays <= 2) return 'soon';
  return 'scheduled';
}

export function useDeliverySchedule() {
  const { orders, isLoading, updateOrderStatus } = useOrders();
  const qc = useQueryClient();
  const { toast } = useToast();

  const updateDelivery = useMutation({
    mutationFn: async ({ orderId, delivery_date, delivery_notes }: { orderId: string; delivery_date: string | null; delivery_notes?: string | null }) => {
      const { error } = await supabase
        .from('orders')
        .update({ delivery_date, delivery_notes: delivery_notes ?? null })
        .eq('id', orderId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['orders'] });
      toast({ title: 'Data de entrega atualizada' });
    },
    onError: (e: Error) => {
      toast({ title: 'Erro ao atualizar', description: e.message, variant: 'destructive' });
    },
  });

  const stats = useMemo(() => {
    const today = new Date();
    const t = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    let overdue = 0, todayCount = 0, next7 = 0, noDate = 0;
    for (const o of orders) {
      if (o.status === 'delivered') continue;
      if (!o.delivery_date) { noDate++; continue; }
      const d = new Date(o.delivery_date + 'T00:00:00');
      const diffDays = Math.round((d.getTime() - t.getTime()) / 86400000);
      if (diffDays < 0) overdue++;
      else if (diffDays === 0) todayCount++;
      else if (diffDays <= 7) next7++;
    }
    return { overdue, today: todayCount, next7, noDate };
  }, [orders]);

  return { orders, isLoading, updateDelivery, updateOrderStatus, stats };
}
