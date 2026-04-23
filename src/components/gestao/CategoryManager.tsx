import React, { useState } from 'react';
import { Trash2, FolderPlus } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useCategories } from '@/hooks/useCategories';

interface CategoryManagerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const CategoryManager: React.FC<CategoryManagerProps> = ({ open, onOpenChange }) => {
  const { categories, createCategory, deleteCategory } = useCategories();
  const [newName, setNewName] = useState('');

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    createCategory.mutate(newName, { onSuccess: () => setNewName('') });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-card">
        <DialogHeader>
          <DialogTitle>Gerenciar Categorias</DialogTitle>
          <DialogDescription>Crie categorias para organizar seus produtos.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleCreate} className="flex gap-2">
          <Input
            value={newName}
            onChange={e => setNewName(e.target.value)}
            placeholder="Nome da categoria"
            maxLength={60}
            className="flex-1"
          />
          <Button type="submit" disabled={!newName.trim() || createCategory.isPending} size="sm">
            <FolderPlus className="w-4 h-4 mr-1" /> Criar
          </Button>
        </form>

        {categories.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">Nenhuma categoria criada.</p>
        ) : (
          <ul className="space-y-2 max-h-60 overflow-y-auto">
            {categories.map(cat => (
              <li key={cat.id} className="flex items-center justify-between rounded-lg border border-border px-3 py-2">
                <span className="text-sm text-foreground truncate">{cat.name}</span>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive h-7 w-7">
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="bg-card">
                    <AlertDialogHeader>
                      <AlertDialogTitle>Excluir categoria "{cat.name}"?</AlertDialogTitle>
                      <AlertDialogDescription>Os produtos dessa categoria ficarão sem categoria.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction onClick={() => deleteCategory.mutate(cat.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Excluir</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </li>
            ))}
          </ul>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default CategoryManager;
