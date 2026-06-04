import React, { useState } from 'react';
import { Plus, Pencil, Check, X, Trash2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useCatalogCategories, type CatalogCategory } from '@/hooks/useCatalogProducts';

interface Props {
  selectedId: string | null;
  onSelect: (id: string | null) => void;
}

export const CatalogCategoryChips: React.FC<Props> = ({ selectedId, onSelect }) => {
  const { categories, create, update, remove } = useCatalogCategories();
  const [expanded, setExpanded] = useState(false);
  const [newName, setNewName] = useState('');
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [subParentId, setSubParentId] = useState<string | null>(null);
  const [subName, setSubName] = useState('');

  const parents = categories.filter((c) => !c.parent_id);
  const childrenOf = (id: string) => categories.filter((c) => c.parent_id === id);

  const visibleParents = expanded ? parents : parents.slice(0, 6);

  const handleCreate = () => {
    if (!newName.trim()) return;
    create.mutate({ name: newName }, { onSuccess: () => { setNewName(''); setAdding(false); } });
  };

  const handleEdit = (c: CatalogCategory) => {
    setEditingId(c.id);
    setEditName(c.name);
  };

  const handleSaveEdit = () => {
    if (!editingId || !editName.trim()) return;
    update.mutate({ id: editingId, name: editName.trim() }, { onSuccess: () => setEditingId(null) });
  };

  const handleAddSub = (parentId: string) => {
    if (!subName.trim()) return;
    create.mutate({ name: subName, parent_id: parentId }, { onSuccess: () => { setSubName(''); setSubParentId(null); } });
  };

  return (
    <div className="space-y-2">
      <h3 className="font-semibold text-foreground text-sm">Categorias</h3>
      <div className="flex flex-wrap gap-2 items-center">
        <button
          onClick={() => onSelect(null)}
          className={`px-3 py-1.5 rounded-full border text-sm transition ${
            !selectedId ? 'bg-primary text-primary-foreground border-primary' : 'bg-background border-border text-muted-foreground hover:border-foreground/40'
          }`}
        >
          Todos
        </button>
        <button
          onClick={() => setAdding(true)}
          className="w-9 h-9 rounded-full border border-dashed border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-foreground/40"
        >
          <Plus className="w-4 h-4" />
        </button>
        {adding && (
          <div className="flex items-center gap-1 bg-background border border-border rounded-full pl-3 pr-1 h-9">
            <Input
              autoFocus
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
              placeholder="Nome da categoria"
              className="border-0 h-7 p-0 w-40 focus-visible:ring-0"
            />
            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={handleCreate}><Check className="w-3.5 h-3.5" /></Button>
            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => { setAdding(false); setNewName(''); }}><X className="w-3.5 h-3.5" /></Button>
          </div>
        )}
        {visibleParents.map((c) => {
          const isSelected = selectedId === c.id;
          const isEditing = editingId === c.id;
          return (
            <div
              key={c.id}
              className={`inline-flex items-center gap-1 pl-3 pr-1 h-9 rounded-full border text-sm transition ${
                isSelected ? 'bg-primary/10 border-primary text-primary' : 'bg-background border-border'
              }`}
            >
              {isEditing ? (
                <>
                  <Input
                    autoFocus
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSaveEdit()}
                    className="border-0 h-7 p-0 w-32 focus-visible:ring-0"
                  />
                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={handleSaveEdit}><Check className="w-3.5 h-3.5" /></Button>
                  <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => { remove.mutate(c.id); setEditingId(null); }}><Trash2 className="w-3.5 h-3.5" /></Button>
                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setEditingId(null)}><X className="w-3.5 h-3.5" /></Button>
                </>
              ) : (
                <>
                  <button onClick={() => onSelect(c.id)} className="text-sm">{c.name}</button>
                  <Button size="icon" variant="ghost" className="h-7 w-7 text-muted-foreground" onClick={() => handleEdit(c)}>
                    <Pencil className="w-3 h-3" />
                  </Button>
                </>
              )}
            </div>
          );
        })}
      </div>

      {parents.length > 6 && (
        <button
          onClick={() => setExpanded((v) => !v)}
          className="text-xs text-primary hover:underline"
        >
          {expanded ? 'Mostrar menos' : 'Mais opções'}
        </button>
      )}

      {expanded && parents.length > 0 && (
        <div className="mt-3 space-y-2 border-t border-border pt-3">
          <p className="text-xs text-muted-foreground">Subcategorias</p>
          {parents.map((p) => {
            const subs = childrenOf(p.id);
            return (
              <div key={p.id} className="flex flex-wrap gap-2 items-center">
                <span className="text-xs font-medium text-foreground w-32 truncate">{p.name}:</span>
                {subs.map((s) => (
                  <div key={s.id} className="inline-flex items-center gap-1 px-3 h-7 rounded-full bg-muted text-xs">
                    <button onClick={() => onSelect(s.id)} className={selectedId === s.id ? 'font-semibold' : ''}>{s.name}</button>
                    <button onClick={() => remove.mutate(s.id)} className="text-muted-foreground hover:text-destructive">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
                {subParentId === p.id ? (
                  <div className="inline-flex items-center gap-1 bg-background border border-border rounded-full pl-2 pr-1 h-7">
                    <Input
                      autoFocus
                      value={subName}
                      onChange={(e) => setSubName(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleAddSub(p.id)}
                      placeholder="Subcategoria"
                      className="border-0 h-6 p-0 w-32 text-xs focus-visible:ring-0"
                    />
                    <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => handleAddSub(p.id)}><Check className="w-3 h-3" /></Button>
                  </div>
                ) : (
                  <button
                    onClick={() => { setSubParentId(p.id); setSubName(''); }}
                    className="inline-flex items-center gap-1 px-2 h-7 rounded-full border border-dashed border-border text-xs text-muted-foreground hover:text-foreground"
                  >
                    <Plus className="w-3 h-3" /> sub
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
