import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { InventoryMaterial } from '@/hooks/useInventory';
import type { MovementInput } from '@/hooks/useInventoryMovements';

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onSubmit: (data: MovementInput) => void;
  materials: InventoryMaterial[];
  defaultMaterialId?: string;
  isLoading?: boolean;
}

const MovementForm: React.FC<Props> = ({ open, onOpenChange, onSubmit, materials, defaultMaterialId, isLoading }) => {
  const [materialId, setMaterialId] = useState<string>('');
  const [type, setType] = useState<'in' | 'adjustment'>('in');
  const [quantity, setQuantity] = useState('');
  const [unitCost, setUnitCost] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (open) {
      setMaterialId(defaultMaterialId || materials[0]?.id || '');
      setType('in');
      setQuantity('');
      setUnitCost('');
      setNotes('');
    }
  }, [open, defaultMaterialId, materials]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!materialId) return;
    const qty = parseFloat(quantity.replace(',', '.')) || 0;
    if (qty === 0) return;
    const signedQty = type === 'in' ? Math.abs(qty) : qty; // adjustment may be negative
    const cost = unitCost ? parseFloat(unitCost.replace(',', '.')) : null;
    onSubmit({
      material_id: materialId,
      movement_type: type === 'in' ? 'in' : 'adjustment',
      quantity: signedQty,
      unit_cost: cost,
      notes: notes.trim() || null,
      reference_type: type === 'in' ? 'purchase' : 'manual',
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-card">
        <DialogHeader>
          <DialogTitle>Nova Entrada de Estoque</DialogTitle>
          <DialogDescription>Registre uma compra ou um ajuste manual de estoque.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Material *</Label>
            <Select value={materialId} onValueChange={setMaterialId}>
              <SelectTrigger><SelectValue placeholder="Selecione um material" /></SelectTrigger>
              <SelectContent>
                {materials.map(m => (
                  <SelectItem key={m.id} value={m.id}>{m.name} ({m.unit})</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Tipo</Label>
            <Select value={type} onValueChange={(v: 'in' | 'adjustment') => setType(v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="in">Entrada (compra)</SelectItem>
                <SelectItem value="adjustment">Ajuste manual (use negativo p/ reduzir)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Quantidade Total *</Label>
              <Input type="number" step="any" value={quantity} onChange={e => setQuantity(e.target.value)} required placeholder={type === 'in' ? 'Ex: 750' : 'Ex: -10'} />
              <p className="text-xs text-muted-foreground">Ex: 2 pacotes × 250 = 500</p>
            </div>
            <div className="space-y-2">
              <Label>Custo Unit. (R$)</Label>
              <Input type="number" step="0.01" min="0" value={unitCost} onChange={e => setUnitCost(e.target.value)} placeholder="Opcional" />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Observações</Label>
            <Textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} maxLength={300} placeholder="Fornecedor, NF, motivo..." />
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t border-border">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" disabled={isLoading || !materialId || !quantity}>Registrar</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default MovementForm;
