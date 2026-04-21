import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DollarSign } from 'lucide-react';

const formatCurrency = (v: number) => (Number.isFinite(v) ? v : 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  totalRevenue: number;
  currentReceived: number;
  onConfirm: (newAmount: number) => void;
  isLoading?: boolean;
}

const OrderPaymentModal: React.FC<Props> = ({ open, onOpenChange, totalRevenue, currentReceived, onConfirm, isLoading }) => {
  const [amount, setAmount] = useState('');
  const newReceived = currentReceived + (parseFloat(amount) || 0);
  const remaining = Math.max(0, totalRevenue - newReceived);

  const handleSubmit = () => {
    const val = parseFloat(amount) || 0;
    if (val <= 0) return;
    onConfirm(val);
    setAmount('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm bg-card">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-primary" />
            Registrar Pagamento
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg bg-muted/50 border border-border p-3">
              <div className="text-xs text-muted-foreground">Total do Pedido</div>
              <div className="text-sm font-bold text-foreground">{formatCurrency(totalRevenue)}</div>
            </div>
            <div className="rounded-lg bg-green-500/10 border border-green-500/30 p-3">
              <div className="text-xs text-muted-foreground">Já Recebido</div>
              <div className="text-sm font-bold text-green-600">{formatCurrency(currentReceived)}</div>
            </div>
          </div>

          <div className={`rounded-lg border p-3 ${remaining > 0 ? 'bg-yellow-500/10 border-yellow-500/30' : 'bg-muted/50 border-border'}`}>
            <div className="text-xs text-muted-foreground">Saldo a Receber</div>
            <div className={`text-lg font-bold ${remaining > 0 ? 'text-yellow-600' : 'text-muted-foreground'}`}>
              {formatCurrency(Math.max(0, totalRevenue - currentReceived))}
            </div>
          </div>

          <div>
            <Label>Novo valor recebido (R$)</Label>
            <Input
              type="number"
              step="0.01"
              min="0"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              placeholder="0,00"
              autoFocus
            />
          </div>

          {parseFloat(amount) > 0 && (
            <div className="text-xs text-muted-foreground">
              Após registro: Recebido {formatCurrency(newReceived)} · Pendente {formatCurrency(remaining)}
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button onClick={handleSubmit} disabled={!parseFloat(amount) || isLoading}>
              {isLoading ? 'Salvando...' : 'Registrar'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default OrderPaymentModal;
