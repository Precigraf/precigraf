import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import OrderCard from './OrderCard';
import type { Order } from '@/hooks/useOrders';

interface KanbanColumnProps {
  id: string;
  label: string;
  color: string;
  orders: Order[];
}

const KanbanColumn: React.FC<KanbanColumnProps> = ({ id, label, color, orders }) => {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <div className="flex flex-col w-64 shrink-0">
      <div className="flex items-center gap-2 mb-3 px-1">
        <div className={`w-3 h-3 rounded-full ${color}`} />
        <h3 className="text-sm font-semibold text-foreground">{label}</h3>
        <span className="text-xs text-muted-foreground bg-secondary rounded-full px-2 py-0.5">{orders.length}</span>
      </div>
      <div
        ref={setNodeRef}
        className={`flex-1 rounded-lg p-2 space-y-2 min-h-[200px] transition-colors ${
          isOver ? 'bg-primary/5 border-2 border-dashed border-primary/30' : 'bg-secondary/30 border-2 border-dashed border-transparent'
        }`}
      >
        <SortableContext items={orders.map(o => o.id)} strategy={verticalListSortingStrategy}>
          {orders.map(order => (
            <OrderCard key={order.id} order={order} />
          ))}
        </SortableContext>
        {orders.length === 0 && (
          <div className="flex items-center justify-center h-20 text-xs text-muted-foreground">
            Arraste pedidos aqui
          </div>
        )}
      </div>
    </div>
  );
};

export default KanbanColumn;
