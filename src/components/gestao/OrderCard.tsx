import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card } from '@/components/ui/card';
import { GripVertical, User, Calendar, DollarSign } from 'lucide-react';
import type { Order } from '@/hooks/useOrders';

interface OrderCardProps {
  order: Order;
}

const OrderCard: React.FC<OrderCardProps> = ({ order }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: order.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const formatCurrency = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  return (
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
              {formatCurrency(order.quotes?.total_value || 0)}
            </span>
          </div>
          {order.quotes?.description && (
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{order.quotes.description}</p>
          )}
        </div>
      </div>
    </Card>
  );
};

export default OrderCard;
