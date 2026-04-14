import React from 'react';
import AppLayout from '@/components/AppLayout';
import KanbanBoard from '@/components/gestao/KanbanBoard';

const Pedidos: React.FC = () => {
  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground">Pedidos</h1>
          <p className="text-sm text-muted-foreground">Arraste os pedidos entre as colunas para atualizar o status</p>
        </div>
        <KanbanBoard />
      </div>
    </AppLayout>
  );
};

export default Pedidos;
