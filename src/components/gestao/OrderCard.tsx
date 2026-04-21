import React, { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { GripVertical, User, Calendar, DollarSign, CreditCard } from 'lucide-react';
import OrderPaymentModal from './OrderPaymentModal';
import { useOrders, type Order } from '@/hooks/useOrders';

interface OrderCardProps {
  order: Order;
}

const OrderCard: React.FC<OrderCardProps> = ({ order }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: order.id });
  const { updatePaymentReceived } = useOrders();
  const [paymentOpen, setPaymentOpen] = useState(false);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const formatCurrency = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  const pending = Number(order.amount_pending) || 0;

  return (
    <>
      <Card ref={setNodeRef} style={style} className="p-3 bg-card border-border cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow">
        <div className="flex items-start gap-2">
          <div {...attributes} {...listeners} className="pt-0.5 text-muted-foreground hover:text-foreground">
            <GripVertical className="w-4 h-4" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-semibold text-foreground truncate">
              {order.quotes?.product_name || 'Pedido'}
            </h4>
            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
              <User className="w-3 h-3" />
              <span className="truncate">{order.clients?.name || '—'}</span>
            </div>
            <div className="flex items-center justify-between mt-2">
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Calendar className="w-3 h-3" />
                {new Date(order.created_at).toLocaleDateString('pt-BR')}
              </span>
              <span className="flex items-center gap-1 text-sm font-bold text-foreground">
                <DollarSign className="w-3 h-3" />
                {formatCurrency(Number(order.total_revenue) || order.quotes?.total_value || 0)}
              </span>
            </div>
            {pending > 0 && (
              <div className="flex items-center justify-between mt-1">
                <span className="text-xs text-yellow-600 font-medium">Pendente: {formatCurrency(pending)}</span>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 px-2 text-xs text-primary"
                  onClick={(e) => { e.stopPropagation(); setPaymentOpen(true); }}
                >
                  <CreditCard className="w-3 h-3 mr-1" /> Receber
                </Button>
              </div>
            )}
          </div>
        </div>
      </Card>
      <OrderPaymentModal
        open={paymentOpen}
        onOpenChange={setPaymentOpen}
        totalRevenue={Number(order.total_revenue) || 0}
        currentReceived={Number(order.amount_received) || 0}
        onConfirm={(amount) => {
          updatePaymentReceived.mutate({ orderId: order.id, additionalAmount: amount });
          setPaymentOpen(false);
        }}
        isLoading={updatePaymentReceived.isPending}
      />
    </>
  );
};

export default OrderCard;
