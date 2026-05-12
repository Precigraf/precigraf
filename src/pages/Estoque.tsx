import React, { useState, useMemo } from 'react';
import { Plus, Search, Edit2, Trash2, ArrowDown, ArrowUp, Package, AlertTriangle } from 'lucide-react';
import AppLayout from '@/components/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import SupplyForm from '@/components/gestao/SupplyForm';
import SupplyMovementModal from '@/components/gestao/SupplyMovementModal';
import { useSupplyStock, useSupplyMovements, type Supply, type SupplyType } from '@/hooks/useSupplyStock';

const TYPE_LABEL: Record<SupplyType, string> = {
  paper: 'Papel',
  ink: 'Tinta',
  other: 'Outro',
};

const formatBRL = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const Estoque: React.FC = () => {
  const { supplies, isLoading, create, update, remove, restock, consume } = useSupplyStock();
  const { movements } = useSupplyMovements();
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<SupplyType | 'all'>('all');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Supply | null>(null);
  const [moveOpen, setMoveOpen] = useState(false);
  const [moveType, setMoveType] = useState<'in' | 'out'>('in');
  const [moveSupply, setMoveSupply] = useState<Supply | null>(null);

  const filtered = useMemo(() => {
    return supplies.filter((s) => {
      if (filterType !== 'all' && s.type !== filterType) return false;
      if (search && !s.name.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [supplies, filterType, search]);

  const stats = useMemo(() => {
    const low = supplies.filter((s) => s.is_active && s.min_alert > 0 && s.quantity <= s.min_alert);
    const out = supplies.filter((s) => s.is_active && s.quantity === 0);
    const totalValue = supplies.reduce((acc, s) => acc + s.quantity * s.unit_cost, 0);
    return { low: low.length, out: out.length, totalValue };
  }, [supplies]);

  const supplyById = useMemo(() => Object.fromEntries(supplies.map((s) => [s.id, s])), [supplies]);

  const openNew = () => { setEditing(null); setFormOpen(true); };
  const openEdit = (s: Supply) => { setEditing(s); setFormOpen(true); };
  const openMove = (s: Supply, t: 'in' | 'out') => { setMoveSupply(s); setMoveType(t); setMoveOpen(true); };

  const onSave = (data: any) => {
    if (editing) update.mutate({ id: editing.id, ...data }, { onSuccess: () => setFormOpen(false) });
    else create.mutate(data, { onSuccess: () => setFormOpen(false) });
  };

  const onMove = (args: any) => {
    if (!moveSupply) return;
    const action = moveType === 'in' ? restock : consume;
    action.mutate({ supply_id: moveSupply.id, ...args }, { onSuccess: () => setMoveOpen(false) });
  };

  const statusBadge = (s: Supply) => {
    if (!s.is_active) return <Badge variant="outline" className="text-xs">Inativo</Badge>;
    if (s.quantity === 0) return <Badge className="text-xs bg-destructive text-destructive-foreground">Zerado</Badge>;
    if (s.min_alert > 0 && s.quantity <= s.min_alert) return <Badge className="text-xs bg-warning text-warning-foreground">Baixo</Badge>;
    return null;
  };

  return (
    <AppLayout>
      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 max-w-5xl">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-foreground">Estoque de Insumos</h1>
            <p className="text-xs sm:text-sm text-muted-foreground">{supplies.length} insumo{supplies.length !== 1 ? 's' : ''}</p>
          </div>
          <Button onClick={openNew} className="w-full sm:w-auto">
            <Plus className="w-4 h-4 mr-2" /> Novo insumo
          </Button>
        </div>

        <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-4">
          <Card className="p-3 bg-card">
            <p className="text-xs text-muted-foreground">Valor total</p>
            <p className="text-base sm:text-lg font-bold text-foreground">{formatBRL(stats.totalValue)}</p>
          </Card>
          <Card className="p-3 bg-card">
            <p className="text-xs text-muted-foreground">Baixo</p>
            <p className="text-base sm:text-lg font-bold text-warning">{stats.low}</p>
          </Card>
          <Card className="p-3 bg-card">
            <p className="text-xs text-muted-foreground">Zerados</p>
            <p className="text-base sm:text-lg font-bold text-destructive">{stats.out}</p>
          </Card>
        </div>

        <Card className="p-3 sm:p-4 mb-4 bg-primary/5 border-primary/20">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-primary shrink-0 mt-0.5" />
            <div className="text-xs sm:text-sm text-foreground space-y-1">
              <p className="font-semibold">Como funciona o controle de estoque</p>
              <ol className="list-decimal list-inside text-muted-foreground space-y-0.5">
                <li>Cadastre seus insumos aqui (papel, tinta, embalagem, cola, alça…).</li>
                <li>Em <strong className="text-foreground">Produtos</strong>, vincule quais insumos cada produto consome por unidade.</li>
                <li>Quando o cliente aprovar o orçamento, o estoque é descontado automaticamente.</li>
              </ol>
            </div>
          </div>
        </Card>

        <Tabs defaultValue="list">
          <TabsList className="mb-4">
            <TabsTrigger value="list">Insumos</TabsTrigger>
            <TabsTrigger value="history">Movimentações</TabsTrigger>
          </TabsList>

          <TabsContent value="list">
            <div className="flex flex-col sm:flex-row gap-2 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input placeholder="Buscar insumo..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
              </div>
              <div className="flex gap-1 flex-wrap">
                {(['all', 'paper', 'ink', 'other'] as const).map((t) => (
                  <Badge
                    key={t}
                    variant={filterType === t ? 'default' : 'outline'}
                    className="cursor-pointer"
                    onClick={() => setFilterType(t)}
                  >
                    {t === 'all' ? 'Todos' : TYPE_LABEL[t]}
                  </Badge>
                ))}
              </div>
            </div>

            {isLoading ? (
              <div className="text-center py-12 text-muted-foreground">Carregando...</div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                {search || filterType !== 'all' ? 'Nenhum insumo encontrado.' : 'Nenhum insumo cadastrado. Clique em "Novo insumo" para começar.'}
              </div>
            ) : (
              <div className="space-y-2">
                {filtered.map((s) => (
                  <Card key={s.id} className="p-3 sm:p-4 bg-card border-border">
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <div className="flex items-start gap-3 min-w-0 flex-1">
                        <Package className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-semibold text-foreground truncate">{s.name}</h3>
                            <Badge variant="secondary" className="text-xs">{TYPE_LABEL[s.type]}</Badge>
                            {statusBadge(s)}
                          </div>
                          <div className="text-sm text-muted-foreground mt-1 flex flex-wrap gap-x-3">
                            <span><span className="text-foreground font-medium">{s.quantity}</span> {s.unit}</span>
                            <span>custo: {formatBRL(s.unit_cost)}</span>
                            {s.min_alert > 0 && <span>mín: {s.min_alert}</span>}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <Button variant="ghost" size="icon" title="Entrada" onClick={() => openMove(s, 'in')} className="text-success hover:text-success">
                          <ArrowDown className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" title="Saída" onClick={() => openMove(s, 'out')} className="text-warning hover:text-warning">
                          <ArrowUp className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" title="Editar" onClick={() => openEdit(s)}>
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent className="bg-card">
                            <AlertDialogHeader>
                              <AlertDialogTitle>Excluir insumo?</AlertDialogTitle>
                              <AlertDialogDescription>Todo o histórico de movimentações deste insumo também será excluído.</AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction onClick={() => remove.mutate(s.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Excluir</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="history">
            {movements.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">Nenhuma movimentação ainda.</div>
            ) : (
              <div className="space-y-2">
                {movements.map((m) => {
                  const sup = supplyById[m.supply_id];
                  const isIn = m.type === 'in';
                  return (
                    <Card key={m.id} className="p-3 bg-card flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        {isIn ? <ArrowDown className="w-4 h-4 text-success shrink-0" /> : <ArrowUp className="w-4 h-4 text-warning shrink-0" />}
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">{sup?.name ?? 'Insumo removido'}</p>
                          <p className="text-xs text-muted-foreground truncate">
                            {isIn ? '+' : '-'}{m.quantity} {sup?.unit ?? ''}
                            {m.reason && ` · ${m.reason}`}
                          </p>
                        </div>
                      </div>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {new Date(m.created_at).toLocaleString('pt-BR')}
                      </span>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>

        <SupplyForm
          open={formOpen}
          onOpenChange={setFormOpen}
          onSubmit={onSave}
          initialData={editing}
          isLoading={create.isPending || update.isPending}
        />
        <SupplyMovementModal
          open={moveOpen}
          onOpenChange={setMoveOpen}
          supply={moveSupply}
          type={moveType}
          onSubmit={onMove}
          isLoading={restock.isPending || consume.isPending}
        />
      </div>
    </AppLayout>
  );
};

export default Estoque;
