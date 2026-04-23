import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { InventoryMaterial, MaterialInput } from '@/hooks/useInventory';

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onSubmit: (data: MaterialInput) => void;
  initialData?: InventoryMaterial | null;
  isLoading?: boolean;
}

const MaterialForm: React.FC<Props> = ({ open, onOpenChange, onSubmit, initialData, isLoading }) => {
  const [name, setName] = useState('');
  const [unit, setUnit] = useState('unidade');
  const [minStock, setMinStock] = useState('0');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (initialData) {
      setName(initialData.name);
      setUnit(initialData.unit);
      setMinStock(String(initialData.min_stock));
      setNotes(initialData.notes || '');
    } else {
      setName(''); setUnit('unidade'); setMinStock('0'); setNotes('');
    }
  }, [initialData, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSubmit({
      name: name.trim(),
      unit: unit.trim() || 'unidade',
      min_stock: Math.max(0, parseFloat(minStock.replace(',', '.')) || 0),
      notes: notes.trim() || null,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-card">
        <DialogHeader>
          <DialogTitle>{initialData ? 'Editar Material' : 'Novo Material'}</DialogTitle>
          <DialogDescription>Cadastre um insumo do seu estoque (folha, alça, embalagem, etc.).</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Nome do Material *</Label>
            <Input value={name} onChange={e => setName(e.target.value)} required maxLength={100} placeholder="Ex: Papel offset 180g A4" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Unidade *</Label>
              <Input value={unit} onChange={e => setUnit(e.target.value)} required maxLength={20} placeholder="folha, alça, kg..." />
            </div>
            <div className="space-y-2">
              <Label>Estoque Mínimo</Label>
              <Input type="number" min="0" step="any" value={minStock} onChange={e => setMinStock(e.target.value)} placeholder="0" />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Observações</Label>
            <Textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} maxLength={300} placeholder="Fornecedor, especificações..." />
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t border-border">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" disabled={isLoading || !name.trim()}>{initialData ? 'Salvar' : 'Criar'}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default MaterialForm;
