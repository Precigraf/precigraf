import React from 'react';
import { DndContext, DragEndEvent, closestCorners, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import KanbanColumn from './KanbanColumn';
import { useOrders, KANBAN_COLUMNS, type Order } from '@/hooks/useOrders';

const KanbanBoard: React.FC = () => {
  const { orders, isLoading, updateOrderStatus } = useOrders();
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const getOrdersByStatus = (status: string): Order[] =>
    orders.filter(o => o.status === status).sort((a, b) => a.kanban_position - b.kanban_position);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;

    const orderId = active.id as string;
    const order = orders.find(o => o.id === orderId);
    if (!order) return;

    // Determine target column - over.id could be a column id or another order id
    let targetStatus: string;
    const isColumn = KANBAN_COLUMNS.some(c => c.id === over.id);
    if (isColumn) {
      targetStatus = over.id as string;
    } else {
      const targetOrder = orders.find(o => o.id === over.id);
      targetStatus = targetOrder?.status || order.status;
    }

    if (targetStatus !== order.status) {
      updateOrderStatus.mutate({ orderId, newStatus: targetStatus, oldStatus: order.status });
    }
  };

  if (isLoading) {
    return <div className="text-center py-12 text-muted-foreground">Carregando pedidos...</div>;
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCorners} onDragEnd={handleDragEnd}>
      <div className="flex gap-4 overflow-x-auto pb-4 min-h-[400px]">
        {KANBAN_COLUMNS.map(col => (
          <KanbanColumn
            key={col.id}
            id={col.id}
            label={col.label}
            color={col.color}
            orders={getOrdersByStatus(col.id)}
          />
        ))}
      </div>
    </DndContext>
  );
};

export default KanbanBoard;
