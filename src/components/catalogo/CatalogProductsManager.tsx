import React, { useMemo, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Search, Plus, Star, Trash2, Package, FolderTree } from 'lucide-react';
import { useCatalogProducts, useCatalogCategories, type CatalogProduct } from '@/hooks/useCatalogProducts';
import { CategoryManager } from './CategoryManager';
import { CatalogProductForm } from './CatalogProductForm';

export const CatalogProductsManager: React.FC = () => {
  const { products, update, remove } = useCatalogProducts();
  const { categories } = useCatalogCategories();
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<CatalogProduct | null>(null);
  const [showCats, setShowCats] = useState(false);

  const visibleCats = useMemo(
    () => [...categories.filter((c) => !c.parent_id && c.is_active)].sort((a, b) => a.sort_order - b.sort_order),
    [categories],
  );

  const filtered = useMemo(
    () =>
      products.filter((p) => {
        if (filterCat && p.category_id !== filterCat) return false;
        if (search && !p.name.toLowerCase().includes(search.toLowerCase())) return false;
        return true;
      }),
    [products, filterCat, search],
  );

  const openNew = () => { setEditing(null); setFormOpen(true); };
  const openEdit = (p: CatalogProduct) => { setEditing(p); setFormOpen(true); };

  return (
    <div className="space-y-5">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar produto"
          className="pl-9 h-11 rounded-xl"
        />
      </div>

      <div className="flex items-center justify-between gap-2 flex-wrap">
        <h3 className="font-semibold text-foreground text-sm">Categorias</h3>
        <Button variant="outline" size="sm" onClick={() => setShowCats((s) => !s)}>
          <FolderTree className="w-4 h-4 mr-1" /> {showCats ? 'Ocultar' : 'Gerenciar'}
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setFilterCat(null)}
          className={`px-3 py-1.5 rounded-full border text-sm transition ${
            !filterCat ? 'bg-primary text-primary-foreground border-primary' : 'bg-background border-border text-muted-foreground hover:border-foreground/40'
          }`}
        >
          Todos
        </button>
        {visibleCats.map((c) => (
          <button
            key={c.id}
            onClick={() => setFilterCat(c.id)}
            className={`px-3 py-1.5 rounded-full border text-sm transition ${
              filterCat === c.id ? 'bg-primary text-primary-foreground border-primary' : 'bg-background border-border text-muted-foreground hover:border-foreground/40'
            }`}
          >
            {c.name}
          </button>
        ))}
      </div>

      {showCats && <CategoryManager />}

      <div className="space-y-3">
        <h3 className="font-semibold text-foreground text-sm">Produtos</h3>
        <Button onClick={openNew} className="w-full h-11">
          <Plus className="w-4 h-4 mr-1" /> Adicionar produto
        </Button>

        {filtered.length === 0 ? (
          <div className="text-center text-sm text-muted-foreground py-10 border border-dashed border-border rounded-xl">
            Nenhum produto cadastrado ainda.
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((p) => {
              const thumb = p.images?.[0]?.url;
              const hasVariants = (p.variants?.length ?? 0) > 0;
              return (
                <div
                  key={p.id}
                  className="flex items-center gap-3 p-3 border border-border rounded-xl bg-background hover:border-foreground/20 transition"
                >
                  <button
                    onClick={() => openEdit(p)}
                    className="w-12 h-12 rounded-lg bg-muted overflow-hidden flex items-center justify-center shrink-0"
                  >
                    {thumb ? (
                      <img src={thumb} alt={p.name} className="w-full h-full object-cover" />
                    ) : (
                      <Package className="w-5 h-5 text-muted-foreground" />
                    )}
                  </button>
                  <button onClick={() => openEdit(p)} className="flex-1 min-w-0 text-left">
                    <div className="text-sm font-medium text-foreground truncate">{p.name}</div>
                    {hasVariants && (
                      <div className="text-[11px] text-primary">Contém variações</div>
                    )}
                  </button>
                  <button
                    onClick={() => update.mutate({ id: p.id, is_featured: !p.is_featured })}
                    className="p-1.5 hover:bg-muted rounded-md"
                  >
                    <Star className={`w-4 h-4 ${p.is_featured ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground'}`} />
                  </button>
                  <button
                    onClick={() => { if (confirm(`Remover "${p.name}"?`)) remove.mutate(p.id); }}
                    className="p-1.5 hover:bg-muted rounded-md"
                  >
                    <Trash2 className="w-4 h-4 text-muted-foreground hover:text-destructive" />
                  </button>
                  <Switch
                    checked={p.is_active}
                    onCheckedChange={(v) => update.mutate({ id: p.id, is_active: v })}
                  />
                </div>
              );
            })}
          </div>
        )}
      </div>

      <CatalogProductForm open={formOpen} onOpenChange={setFormOpen} product={editing} />
    </div>
  );
};
