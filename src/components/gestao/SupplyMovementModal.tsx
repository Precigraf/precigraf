import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { Supply } from '@/hooks/useSupplyStock';

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  supply: Supply | null;
  type: 'in' | 'out';
  onSubmit: (args: { quantity: number; unit_cost?: number | null; reason?: string | null }) => void;
  isLoading?: boolean;
}

const SupplyMovementModal: React.FC<Props> = ({ open, onOpenChange, supply, type, onSubmit, isLoading }) => {
  const [qty, setQty] = useState('');
  const [cost, setCost] = useState('');
  const [reason, setReason] = useState('');

  useEffect(() => {
    if (open) { setQty(''); setCost(''); setReason(''); }
  }, [open]);

  if (!supply) return null;
  const isIn = type === 'in';

  const handle = (e: React.FormEvent) => {
    e.preventDefault();
    const q = parseFloat(qty.replace(',', '.'));
    if (!q || q <= 0) return;
    const payload: any = { quantity: q, reason: reason.trim() || null };
    if (isIn) payload.unit_cost = cost ? parseFloat(cost.replace(',', '.')) : null;
    onSubmit(payload);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-card">
        <DialogHeader>
          <DialogTitle>{isIn ? 'Entrada de estoque' : 'Saída de estoque'}</DialogTitle>
          <DialogDescription>
            {supply.name} — atual: {supply.quantity} {supply.unit}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handle} className="space-y-3">
          <div className="space-y-2">
            <Label>Quantidade ({supply.unit})</Label>
            <Input type="number" step="0.01" min="0.01" value={qty} onChange={(e) => setQty(e.target.value)} required autoFocus />
          </div>
          {isIn && (
            <div className="space-y-2">
              <Label>Custo unitário (opcional)</Label>
              <Input type="number" step="0.01" min="0" value={cost} onChange={(e) => setCost(e.target.value)} placeholder={`Atual: ${supply.unit_cost}`} />
            </div>
          )}
          <div className="space-y-2">
            <Label>Motivo</Label>
            <Textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={2} maxLength={300} placeholder={isIn ? 'Compra, devolução...' : 'Perda, ajuste, uso interno...'} />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" disabled={isLoading}>{isIn ? 'Registrar entrada' : 'Registrar saída'}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default SupplyMovementModal;
