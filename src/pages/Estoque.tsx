import React, { useState, useMemo } from 'react';
import { Plus, Edit2, Trash2, Package, AlertTriangle, ArrowDownCircle, ArrowUpCircle, Settings2, Boxes } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import AppLayout from '@/components/AppLayout';
import MaterialForm from '@/components/estoque/MaterialForm';
import MovementForm from '@/components/estoque/MovementForm';
import { useInventory, type InventoryMaterial, type MaterialInput } from '@/hooks/useInventory';
import { useInventoryMovements } from '@/hooks/useInventoryMovements';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const formatNumber = (v: number) => v.toLocaleString('pt-BR', { maximumFractionDigits: 2 });

const Estoque: React.FC = () => {
  const { materials, lowStockMaterials, isLoading, createMaterial, updateMaterial, deleteMaterial } = useInventory();
  const { movements, createMovement } = useInventoryMovements();

  const [matOpen, setMatOpen] = useState(false);
  const [editing, setEditing] = useState<InventoryMaterial | null>(null);
  const [moveOpen, setMoveOpen] = useState(false);
  const [moveDefaultId, setMoveDefaultId] = useState<string | undefined>();

  const materialMap = useMemo(() => {
    const m = new Map<string, InventoryMaterial>();
    materials.forEach(x => m.set(x.id, x));
    return m;
  }, [materials]);

  const openNewMaterial = () => { setEditing(null); setMatOpen(true); };
  const openEditMaterial = (m: InventoryMaterial) => { setEditing(m); setMatOpen(true); };
  const openMovementFor = (id?: string) => { setMoveDefaultId(id); setMoveOpen(true); };

  const handleMaterialSubmit = (data: MaterialInput) => {
    if (editing) {
      updateMaterial.mutate({ id: editing.id, ...data }, { onSuccess: () => setMatOpen(false) });
    } else {
      createMaterial.mutate(data, { onSuccess: () => setMatOpen(false) });
    }
  };

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-6 max-w-5xl">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Estoque</h1>
            <p className="text-sm text-muted-foreground">{materials.length} {materials.length === 1 ? 'material' : 'materiais'} cadastrado{materials.length !== 1 ? 's' : ''}</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button variant="outline" onClick={() => openMovementFor()} disabled={materials.length === 0}>
              <ArrowDownCircle className="w-4 h-4 mr-2" /> Nova Entrada
            </Button>
            <Button onClick={openNewMaterial}>
              <Plus className="w-4 h-4 mr-2" /> Novo Material
            </Button>
          </div>
        </div>

        {/* Resumo */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
          <Card className="p-4 bg-card border-border">
            <div className="flex items-center gap-3">
              <Boxes className="w-5 h-5 text-primary shrink-0" />
              <div>
                <div className="text-xl font-bold text-foreground">{materials.length}</div>
                <div className="text-xs text-muted-foreground">Materiais</div>
              </div>
            </div>
          </Card>
          <Card className="p-4 bg-card border-border">
            <div className="flex items-center gap-3">
              <AlertTriangle className={`w-5 h-5 shrink-0 ${lowStockMaterials.length > 0 ? 'text-orange-500' : 'text-muted-foreground'}`} />
              <div>
                <div className="text-xl font-bold text-foreground">{lowStockMaterials.length}</div>
                <div className="text-xs text-muted-foreground">Em estoque baixo</div>
              </div>
            </div>
          </Card>
          <Card className="p-4 bg-card border-border">
            <div className="flex items-center gap-3">
              <Package className="w-5 h-5 text-blue-500 shrink-0" />
              <div>
                <div className="text-xl font-bold text-foreground">{movements.length}</div>
                <div className="text-xs text-muted-foreground">Movimentações</div>
              </div>
            </div>
          </Card>
        </div>

        <Tabs defaultValue="materials" className="w-full">
          <TabsList>
            <TabsTrigger value="materials">Materiais</TabsTrigger>
            <TabsTrigger value="history">Histórico</TabsTrigger>
          </TabsList>

          <TabsContent value="materials" className="mt-4">
            {isLoading ? (
              <div className="text-center py-12 text-muted-foreground">Carregando...</div>
            ) : materials.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                Nenhum material cadastrado. Clique em "Novo Material" para começar.
              </div>
            ) : (
              <div className="space-y-3">
                {materials.map(m => {
                  const isLow = m.min_stock > 0 && m.current_stock <= m.min_stock;
                  return (
                    <Card key={m.id} className="p-4 bg-card border-border">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                          <Package className={`w-5 h-5 shrink-0 mt-0.5 ${isLow ? 'text-orange-500' : 'text-primary'}`} />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="font-semibold text-foreground truncate">{m.name}</h3>
                              {isLow && <Badge variant="outline" className="text-xs bg-orange-500/10 text-orange-600 border-orange-500/30">Estoque baixo</Badge>}
                            </div>
                            <div className="text-sm text-muted-foreground mt-1">
                              <span className={`font-bold ${isLow ? 'text-orange-600' : 'text-foreground'}`}>{formatNumber(m.current_stock)} {m.unit}</span>
                              {m.min_stock > 0 && <> · mín. {formatNumber(m.min_stock)}</>}
                            </div>
                            {m.notes && <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{m.notes}</p>}
                          </div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <Button variant="ghost" size="icon" onClick={() => openMovementFor(m.id)} title="Nova entrada">
                            <ArrowDownCircle className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => openEditMaterial(m)} title="Editar">
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" title="Excluir">
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent className="bg-card">
                              <AlertDialogHeader>
                                <AlertDialogTitle>Excluir material?</AlertDialogTitle>
                                <AlertDialogDescription>Todas as movimentações deste material também serão removidas. Esta ação não pode ser desfeita.</AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction onClick={() => deleteMaterial.mutate(m.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Excluir</AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="history" className="mt-4">
            {movements.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">Sem movimentações registradas.</div>
            ) : (
              <div className="space-y-2">
                {movements.map(mv => {
                  const mat = materialMap.get(mv.material_id);
                  const isIn = mv.quantity > 0;
                  const Icon = mv.movement_type === 'adjustment' ? Settings2 : isIn ? ArrowDownCircle : ArrowUpCircle;
                  const colorClass = mv.movement_type === 'adjustment' ? 'text-blue-500' : isIn ? 'text-green-600' : 'text-orange-600';
                  const refLabel = mv.reference_type === 'order' ? 'Pedido' : mv.reference_type === 'purchase' ? 'Compra' : 'Manual';
                  return (
                    <Card key={mv.id} className="p-3 bg-card border-border">
                      <div className="flex items-center gap-3">
                        <Icon className={`w-5 h-5 shrink-0 ${colorClass}`} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium text-foreground truncate">{mat?.name || 'Material removido'}</span>
                            <Badge variant="outline" className="text-xs">{refLabel}</Badge>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {format(new Date(mv.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                            {mv.notes && <> · {mv.notes}</>}
                          </div>
                        </div>
                        <div className={`text-sm font-bold shrink-0 ${colorClass}`}>
                          {isIn ? '+' : ''}{formatNumber(mv.quantity)} {mat?.unit || ''}
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>

        <MaterialForm
          open={matOpen}
          onOpenChange={setMatOpen}
          onSubmit={handleMaterialSubmit}
          initialData={editing}
          isLoading={createMaterial.isPending || updateMaterial.isPending}
        />

        <MovementForm
          open={moveOpen}
          onOpenChange={setMoveOpen}
          onSubmit={(data) => createMovement.mutate(data, { onSuccess: () => setMoveOpen(false) })}
          materials={materials}
          defaultMaterialId={moveDefaultId}
          isLoading={createMovement.isPending}
        />
      </div>
    </AppLayout>
  );
};

export default Estoque;
