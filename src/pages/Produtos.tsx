import React, { useState } from 'react';
import { Plus, Search, Edit2, Trash2, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import AppLayout from '@/components/AppLayout';
import { useProducts, type Product } from '@/hooks/useProducts';

const formatCurrency = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const Produtos: React.FC = () => {
  const { products, isLoading, createProduct, updateProduct, deleteProduct } = useProducts();
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [unitPrice, setUnitPrice] = useState('');
  const [defaultQuantity, setDefaultQuantity] = useState('1');

  const filtered = products.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));

  const openNew = () => {
    setEditing(null);
    setName(''); setDescription(''); setUnitPrice(''); setDefaultQuantity('1');
    setOpen(true);
  };
  const openEdit = (p: Product) => {
    setEditing(p);
    setName(p.name); setDescription(p.description || ''); setUnitPrice(String(p.unit_price)); setDefaultQuantity(String(p.default_quantity));
    setOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      name: name.trim(),
      description: description.trim() || null,
      unit_price: parseFloat(unitPrice) || 0,
      default_quantity: Math.max(1, parseInt(defaultQuantity) || 1),
    };
    if (!payload.name) return;
    if (editing) {
      updateProduct.mutate({ id: editing.id, ...payload }, { onSuccess: () => setOpen(false) });
    } else {
      createProduct.mutate(payload, { onSuccess: () => setOpen(false) });
    }
  };

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Produtos</h1>
            <p className="text-sm text-muted-foreground">{products.length} produto{products.length !== 1 ? 's' : ''} cadastrado{products.length !== 1 ? 's' : ''}</p>
          </div>
          <Button onClick={openNew}><Plus className="w-4 h-4 mr-2" /> Novo Produto</Button>
        </div>

        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Buscar produto..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
        </div>

        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground">Carregando...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            {search ? 'Nenhum produto encontrado.' : 'Nenhum produto cadastrado. Clique em "Novo Produto" para começar.'}
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(p => (
              <Card key={p.id} className="p-4 bg-card border-border">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <Package className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-foreground truncate">{p.name}</h3>
                      {p.description && <p className="text-sm text-muted-foreground line-clamp-1">{p.description}</p>}
                      <div className="text-sm text-muted-foreground mt-1">
                        <span className="text-foreground font-medium">{formatCurrency(p.unit_price)}</span> · qtd. padrão: {p.default_quantity}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(p)} title="Editar">
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
                          <AlertDialogTitle>Excluir produto?</AlertDialogTitle>
                          <AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction onClick={() => deleteProduct.mutate(p.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Excluir</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="max-w-md bg-card">
            <DialogHeader>
              <DialogTitle>{editing ? 'Editar Produto' : 'Novo Produto'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label>Nome *</Label>
                <Input value={name} onChange={e => setName(e.target.value)} required maxLength={150} placeholder="Ex: Cartão de Visita 4x4" />
              </div>
              <div>
                <Label>Descrição</Label>
                <Textarea value={description} onChange={e => setDescription(e.target.value)} rows={2} maxLength={500} placeholder="Detalhes do produto" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Preço Unitário (R$) *</Label>
                  <Input type="number" step="0.01" min="0" value={unitPrice} onChange={e => setUnitPrice(e.target.value)} required />
                </div>
                <div>
                  <Label>Qtd. Padrão</Label>
                  <Input type="number" min="1" value={defaultQuantity} onChange={e => setDefaultQuantity(e.target.value)} />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
                <Button type="submit" disabled={createProduct.isPending || updateProduct.isPending}>
                  {editing ? 'Salvar' : 'Criar Produto'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
};

export default Produtos;
