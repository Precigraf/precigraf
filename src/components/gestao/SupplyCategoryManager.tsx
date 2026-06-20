import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Trash2, Check, X, Pencil } from 'lucide-react';
import { useSupplyCategories } from '@/hooks/useSupplyCategories';

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

const SupplyCategoryManager: React.FC<Props> = ({ open, onOpenChange }) => {
  const { categories, create, update, remove } = useSupplyCategories();
  const [newName, setNewName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');

  const handleCreate = () => {
    if (!newName.trim()) return;
    create.mutate(newName, { onSuccess: () => setNewName('') });
  };

  const startEdit = (id: string, name: string) => {
    setEditingId(id);
    setEditingName(name);
  };

  const saveEdit = () => {
    if (!editingId || !editingName.trim()) return;
    update.mutate({ id: editingId, name: editingName }, {
      onSuccess: () => { setEditingId(null); setEditingName(''); },
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[calc(100vw-1rem)] sm:max-w-md bg-card">
        <DialogHeader>
          <DialogTitle>Categorias de insumos</DialogTitle>
          <DialogDescription>Crie e gerencie suas próprias categorias.</DialogDescription>
        </DialogHeader>

        <div className="flex gap-2">
          <Input
            placeholder="Nova categoria (ex: Papel, Tinta…)"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleCreate(); } }}
            maxLength={60}
          />
          <Button onClick={handleCreate} disabled={!newName.trim() || create.isPending}>
            <Plus className="w-4 h-4" />
          </Button>
        </div>

        <div className="space-y-1 max-h-[50vh] overflow-y-auto">
          {categories.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">
              Nenhuma categoria criada. Crie sua primeira acima.
            </p>
          ) : (
            categories.map((c) => (
              <div key={c.id} className="flex items-center gap-2 p-2 border border-border rounded-md">
                {editingId === c.id ? (
                  <>
                    <Input
                      autoFocus
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); saveEdit(); } }}
                      maxLength={60}
                      className="h-8"
                    />
                    <Button size="icon" variant="ghost" className="h-8 w-8" onClick={saveEdit}>
                      <Check className="w-4 h-4 text-success" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setEditingId(null)}>
                      <X className="w-4 h-4" />
                    </Button>
                  </>
                ) : (
                  <>
                    <span className="flex-1 text-sm truncate">{c.name}</span>
                    <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => startEdit(c.id, c.name)}>
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => {
                        if (confirm(`Excluir "${c.name}"? Insumos vinculados ficarão sem categoria.`)) {
                          remove.mutate(c.id);
                        }
                      }}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </>
                )}
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SupplyCategoryManager;
