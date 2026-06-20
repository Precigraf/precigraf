import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Settings2 } from 'lucide-react';
import type { Supply, SupplyInput } from '@/hooks/useSupplyStock';
import { useSupplyCategories } from '@/hooks/useSupplyCategories';
import SupplyCategoryManager from './SupplyCategoryManager';

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSubmit: (data: SupplyInput) => void;
  initialData?: Supply | null;
  isLoading?: boolean;
}

const SupplyForm: React.FC<Props> = ({ open, onOpenChange, onSubmit, initialData, isLoading }) => {
  const { categories } = useSupplyCategories();
  const [catMgrOpen, setCatMgrOpen] = useState(false);
  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState<string>('');
  const [unit, setUnit] = useState('un');
  const [quantity, setQuantity] = useState('0');
  const [unitCost, setUnitCost] = useState('0');
  const [minAlert, setMinAlert] = useState('0');
  const [notes, setNotes] = useState('');
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    if (initialData) {
      setName(initialData.name);
      setCategoryId(initialData.category_id ?? '');
      setUnit(initialData.unit);
      setQuantity(String(initialData.quantity));
      setUnitCost(String(initialData.unit_cost));
      setMinAlert(String(initialData.min_alert));
      setNotes(initialData.notes ?? '');
      setIsActive(initialData.is_active);
    } else {
      setName(''); setCategoryId(''); setUnit('un');
      setQuantity('0'); setUnitCost('0'); setMinAlert('0');
      setNotes(''); setIsActive(true);
    }
  }, [initialData, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSubmit({
      name: name.trim(),
      type: 'other',
      category_id: categoryId || null,
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
    <>
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
                <div className="flex items-center justify-between">
                  <Label>Tipo</Label>
                  <button
                    type="button"
                    className="text-xs text-primary hover:underline inline-flex items-center gap-1"
                    onClick={() => setCatMgrOpen(true)}
                  >
                    <Settings2 className="w-3 h-3" /> Gerenciar
                  </button>
                </div>
                {categories.length === 0 ? (
                  <Button type="button" variant="outline" className="w-full" onClick={() => setCatMgrOpen(true)}>
                    + Criar categoria
                  </Button>
                ) : (
                  <Select value={categoryId || 'none'} onValueChange={(v) => setCategoryId(v === 'none' ? '' : v)}>
                    <SelectTrigger><SelectValue placeholder="Sem categoria" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Sem categoria</SelectItem>
                      {categories.map((c) => (
                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
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
      <SupplyCategoryManager open={catMgrOpen} onOpenChange={setCatMgrOpen} />
    </>
  );
};

export default SupplyForm;
