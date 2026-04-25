import React, { useState } from 'react';
import { Plus, Search, Edit2, Trash2, Package, FolderPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import AppLayout from '@/components/AppLayout';
import ProductForm from '@/components/gestao/ProductForm';
import CategoryManager from '@/components/gestao/CategoryManager';
import { useProducts, type Product } from '@/hooks/useProducts';
import { useCategories } from '@/hooks/useCategories';


const formatCurrency = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const Produtos: React.FC = () => {
  const { products, isLoading, createProduct, updateProduct, deleteProduct } = useProducts();
  const { categories } = useCategories();
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const [catOpen, setCatOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [filterCat, setFilterCat] = useState<string | null>(null);

  const filtered = products.filter(p => {
    if (!p.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (filterCat && p.category_id !== filterCat) return false;
    return true;
  });

  const openNew = () => { setEditing(null); setOpen(true); };
  const openEdit = (p: Product) => { setEditing(p); setOpen(true); };

  const handleSubmit = (payload: any) => {
    if (editing) {
      updateProduct.mutate({ id: editing.id, ...payload }, {
        onSuccess: () => setOpen(false),
      });
    } else {
      createProduct.mutate(payload, {
        onSuccess: () => setOpen(false),
      });
    }
  };

  const getCategoryName = (categoryId: string | null) => {
    if (!categoryId) return null;
    return categories.find(c => c.id === categoryId)?.name ?? null;
  };

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Produtos</h1>
            <p className="text-sm text-muted-foreground">{products.length} produto{products.length !== 1 ? 's' : ''} cadastrado{products.length !== 1 ? 's' : ''}</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setCatOpen(true)}>
              <FolderPlus className="w-4 h-4 mr-2" /> Criar Categoria
            </Button>
            <Button onClick={openNew}><Plus className="w-4 h-4 mr-2" /> Novo Produto</Button>
          </div>
        </div>

        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Buscar produto..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
        </div>

        {categories.length > 0 && (
          <div className="flex gap-2 flex-wrap mb-4">
            <Badge
              variant={filterCat === null ? 'default' : 'outline'}
              className="cursor-pointer"
              onClick={() => setFilterCat(null)}
            >
              Todos
            </Badge>
            {categories.map(cat => (
              <Badge
                key={cat.id}
                variant={filterCat === cat.id ? 'default' : 'outline'}
                className="cursor-pointer"
                onClick={() => setFilterCat(filterCat === cat.id ? null : cat.id)}
              >
                {cat.name}
              </Badge>
            ))}
          </div>
        )}

        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground">Carregando...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            {search || filterCat ? 'Nenhum produto encontrado.' : 'Nenhum produto cadastrado. Clique em "Novo Produto" para começar.'}
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(p => {
              const catName = getCategoryName(p.category_id);
              return (
                <Card key={p.id} className="p-4 bg-card border-border">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <Package className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold text-foreground truncate">{p.name}</h3>
                          {!p.is_active && <Badge variant="outline" className="text-xs">Inativo</Badge>}
                          {catName && <Badge variant="secondary" className="text-xs">{catName}</Badge>}
                        </div>
                        {p.description && <p className="text-sm text-muted-foreground line-clamp-1">{p.description}</p>}
                        <div className="text-sm text-muted-foreground mt-1">
                          <span className="text-foreground font-medium">{formatCurrency(p.unit_price)}</span> · qtd. padrão: {p.default_quantity}
                          {p.size && <> · {p.size}</>}
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
              );
            })}
          </div>
        )}

        <ProductForm
          open={open}
          onOpenChange={setOpen}
          onSubmit={handleSubmit}
          initialData={editing}
          isLoading={createProduct.isPending || updateProduct.isPending}
        />

        <CategoryManager open={catOpen} onOpenChange={setCatOpen} />
      </div>
    </AppLayout>
  );
};

export default Produtos;
