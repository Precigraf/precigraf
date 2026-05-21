import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { Supply, SupplyInput, SupplyType } from '@/hooks/useSupplyStock';

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSubmit: (data: SupplyInput) => void;
  initialData?: Supply | null;
  isLoading?: boolean;
}

const SupplyForm: React.FC<Props> = ({ open, onOpenChange, onSubmit, initialData, isLoading }) => {
  const [name, setName] = useState('');
  const [type, setType] = useState<SupplyType>('paper');
  const [unit, setUnit] = useState('un');
  const [quantity, setQuantity] = useState('0');
  const [unitCost, setUnitCost] = useState('0');
  const [minAlert, setMinAlert] = useState('0');
  const [notes, setNotes] = useState('');
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    if (initialData) {
      setName(initialData.name);
      setType(initialData.type);
      setUnit(initialData.unit);
      setQuantity(String(initialData.quantity));
      setUnitCost(String(initialData.unit_cost));
      setMinAlert(String(initialData.min_alert));
      setNotes(initialData.notes ?? '');
      setIsActive(initialData.is_active);
    } else {
      setName(''); setType('paper'); setUnit('un');
      setQuantity('0'); setUnitCost('0'); setMinAlert('0');
      setNotes(''); setIsActive(true);
    }
  }, [initialData, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSubmit({
      name: name.trim(),
      type,
      unit: unit.trim() || 'un',
      quantity: parseFloat(quantity.replace(',', '.')) || 0,
      unit_cost: parseFloat(unitCost.replace(',', '.')) || 0,
      min_alert: parseFloat(minAlert.replace(',', '.')) || 0,
      expiry_date: null,
      notes: notes.trim() || null,
      is_active: isActive,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[calc(100vw-1rem)] sm:max-w-lg max-h-[90vh] overflow-y-auto bg-card">
        <DialogHeader>
          <DialogTitle>{initialData ? 'Editar insumo' : 'Novo insumo'}</DialogTitle>
          <DialogDescription>Cadastre papéis, tintas e outros materiais usados na produção.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Nome *</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} required maxLength={150} placeholder="Ex: Papel couché 250g A4" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Tipo *</Label>
              <Select value={type} onValueChange={(v) => setType(v as SupplyType)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="paper">Papel</SelectItem>
                  <SelectItem value="ink">Tinta</SelectItem>
                  <SelectItem value="handle">Alça</SelectItem>
                  <SelectItem value="packaging">Embalagem</SelectItem>
                  <SelectItem value="glue">Cola</SelectItem>
                  <SelectItem value="other">Outros</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Unidade</Label>
              <Input value={unit} onChange={(e) => setUnit(e.target.value)} placeholder="un, kg, L, folha..." maxLength={20} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Quantidade atual</Label>
              <Input type="number" step="0.01" min="0" value={quantity} onChange={(e) => setQuantity(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Custo unitário (R$)</Label>
              <Input type="number" step="0.01" min="0" value={unitCost} onChange={(e) => setUnitCost(e.target.value)} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Alerta mínimo</Label>
            <Input type="number" step="0.01" min="0" value={minAlert} onChange={(e) => setMinAlert(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Observações</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} maxLength={500} />
          </div>
          <div className="flex items-center justify-between pt-3 border-t border-border">
            <div className="flex items-center gap-3">
              <Switch checked={isActive} onCheckedChange={setIsActive} />
              <Label className="cursor-pointer">Ativo</Label>
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
              <Button type="submit" disabled={isLoading || !name.trim()}>{initialData ? 'Salvar' : 'Criar'}</Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default SupplyForm;
