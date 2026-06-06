import React, { useState } from 'react';
import { Plus, ChevronDown, ChevronRight, Pencil, Trash2, ArrowUp, ArrowDown, Check, X } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { useCatalogCategories, type CatalogCategory } from '@/hooks/useCatalogProducts';

export const CategoryManager: React.FC = () => {
  const { categories, create, update, remove, reorder } = useCatalogCategories();
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [adding, setAdding] = useState<string | 'root' | null>(null);
  const [newName, setNewName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  const parents = [...categories.filter((c) => !c.parent_id)].sort(
    (a, b) => a.sort_order - b.sort_order,
  );
  const childrenOf = (id: string) =>
    [...categories.filter((c) => c.parent_id === id)].sort(
      (a, b) => a.sort_order - b.sort_order,
    );

  const submitNew = (parentId: string | null) => {
    if (!newName.trim()) { setAdding(null); return; }
    create.mutate(
      { name: newName, parent_id: parentId },
      { onSuccess: () => { setNewName(''); setAdding(null); } },
    );
  };

  const submitEdit = () => {
    if (!editingId || !editName.trim()) return;
    update.mutate({ id: editingId, name: editName.trim() }, { onSuccess: () => setEditingId(null) });
  };

  const move = (list: CatalogCategory[], idx: number, dir: -1 | 1) => {
    const j = idx + dir;
    if (j < 0 || j >= list.length) return;
    const next = [...list];
    [next[idx], next[j]] = [next[j], next[idx]];
    reorder.mutate(next.map((c) => c.id));
  };

  return (
    <Card className="p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-foreground">Categorias e subcategorias</h3>
          <p className="text-xs text-muted-foreground">Organize seus produtos em até 2 níveis.</p>
        </div>
        <Button size="sm" onClick={() => { setAdding('root'); setNewName(''); }}>
          <Plus className="w-4 h-4 mr-1" /> Categoria
        </Button>
      </div>

      {adding === 'root' && (
        <div className="flex gap-2 items-center bg-muted/40 p-2 rounded-lg">
          <Input
            autoFocus
            placeholder="Nome da categoria"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && submitNew(null)}
            className="h-9"
          />
          <Button size="icon" variant="ghost" onClick={() => submitNew(null)}><Check className="w-4 h-4" /></Button>
          <Button size="icon" variant="ghost" onClick={() => setAdding(null)}><X className="w-4 h-4" /></Button>
        </div>
      )}

      {parents.length === 0 && adding !== 'root' && (
        <div className="text-center text-sm text-muted-foreground py-6 border border-dashed border-border rounded-lg">
          Nenhuma categoria criada.
        </div>
      )}

      <div className="space-y-1">
        {parents.map((p, i) => {
          const subs = childrenOf(p.id);
          const isOpen = expanded[p.id] ?? false;
          const isEditing = editingId === p.id;
          return (
            <div key={p.id} className="border border-border rounded-lg overflow-hidden">
              <div className="flex items-center gap-1 px-2 py-2 bg-background">
                <button
                  onClick={() => setExpanded((e) => ({ ...e, [p.id]: !isOpen }))}
                  className="p-1 text-muted-foreground hover:text-foreground"
                >
                  {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                </button>
                {isEditing ? (
                  <Input
                    autoFocus
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && submitEdit()}
                    className="h-8 flex-1"
                  />
                ) : (
                  <span className={`flex-1 text-sm font-medium ${p.is_active ? '' : 'text-muted-foreground line-through'}`}>
                    {p.name}
                    {subs.length > 0 && (
                      <span className="ml-2 text-[10px] text-muted-foreground">({subs.length} sub)</span>
                    )}
                  </span>
                )}
                <div className="flex items-center gap-0.5">
                  {isEditing ? (
                    <>
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={submitEdit}><Check className="w-3.5 h-3.5" /></Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setEditingId(null)}><X className="w-3.5 h-3.5" /></Button>
                    </>
                  ) : (
                    <>
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => move(parents, i, -1)} disabled={i === 0}><ArrowUp className="w-3.5 h-3.5" /></Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => move(parents, i, 1)} disabled={i === parents.length - 1}><ArrowDown className="w-3.5 h-3.5" /></Button>
                      <Switch
                        checked={p.is_active}
                        onCheckedChange={(v) => update.mutate({ id: p.id, is_active: v })}
                        className="scale-75 mx-1"
                      />
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => { setEditingId(p.id); setEditName(p.name); }}><Pencil className="w-3.5 h-3.5" /></Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive"
                        onClick={() => { if (confirm(`Remover "${p.name}"?`)) remove.mutate(p.id); }}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </>
                  )}
                </div>
              </div>

              {isOpen && (
                <div className="border-t border-border bg-muted/20 px-3 py-2 space-y-1">
                  {subs.map((s, j) => {
                    const isE = editingId === s.id;
                    return (
                      <div key={s.id} className="flex items-center gap-1 pl-4">
                        <span className="text-muted-foreground text-xs">↳</span>
                        {isE ? (
                          <Input
                            autoFocus
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && submitEdit()}
                            className="h-7 flex-1"
                          />
                        ) : (
                          <span className={`flex-1 text-sm ${s.is_active ? '' : 'text-muted-foreground line-through'}`}>{s.name}</span>
                        )}
                        {isE ? (
                          <>
                            <Button size="icon" variant="ghost" className="h-6 w-6" onClick={submitEdit}><Check className="w-3 h-3" /></Button>
                            <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => setEditingId(null)}><X className="w-3 h-3" /></Button>
                          </>
                        ) : (
                          <>
                            <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => move(subs, j, -1)} disabled={j === 0}><ArrowUp className="w-3 h-3" /></Button>
                            <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => move(subs, j, 1)} disabled={j === subs.length - 1}><ArrowDown className="w-3 h-3" /></Button>
                            <Switch
                              checked={s.is_active}
                              onCheckedChange={(v) => update.mutate({ id: s.id, is_active: v })}
                              className="scale-75 mx-1"
                            />
                            <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => { setEditingId(s.id); setEditName(s.name); }}><Pencil className="w-3 h-3" /></Button>
                            <Button size="icon" variant="ghost" className="h-6 w-6 text-destructive"
                              onClick={() => { if (confirm(`Remover "${s.name}"?`)) remove.mutate(s.id); }}>
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </>
                        )}
                      </div>
                    );
                  })}

                  {adding === p.id ? (
                    <div className="flex gap-1 items-center pl-4">
                      <Input
                        autoFocus
                        placeholder="Nome da subcategoria"
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && submitNew(p.id)}
                        className="h-7"
                      />
                      <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => submitNew(p.id)}><Check className="w-3 h-3" /></Button>
                      <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => setAdding(null)}><X className="w-3 h-3" /></Button>
                    </div>
                  ) : (
                    <button
                      onClick={() => { setAdding(p.id); setNewName(''); }}
                      className="text-xs text-primary hover:underline pl-4 inline-flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" /> adicionar subcategoria
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </Card>
  );
};
