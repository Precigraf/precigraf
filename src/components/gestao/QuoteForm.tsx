import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { Client } from '@/hooks/useClients';

interface QuoteFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clients: Client[];
  onSubmit: (data: {
    client_id: string;
    product_name?: string;
    description?: string;
    total_value: number;
    unit_value?: number;
    quantity?: number;
    raw_data?: Record<string, unknown>;
  }) => void;
  isLoading?: boolean;
  prefillData?: {
    product_name?: string;
    total_value?: number;
    unit_value?: number;
    quantity?: number;
    raw_data?: Record<string, unknown>;
  };
}

const QuoteForm: React.FC<QuoteFormProps> = ({ open, onOpenChange, clients, onSubmit, isLoading, prefillData }) => {
  const [clientId, setClientId] = useState('');
  const [productName, setProductName] = useState(prefillData?.product_name || '');
  const [description, setDescription] = useState('');
  const [totalValue, setTotalValue] = useState(prefillData?.total_value?.toString() || '');
  const [unitValue, setUnitValue] = useState(prefillData?.unit_value?.toString() || '');
  const [quantity, setQuantity] = useState(prefillData?.quantity?.toString() || '');

  React.useEffect(() => {
    if (open && prefillData) {
      setProductName(prefillData.product_name || '');
      setTotalValue(prefillData.total_value?.toString() || '');
      setUnitValue(prefillData.unit_value?.toString() || '');
      setQuantity(prefillData.quantity?.toString() || '');
    }
    if (!open) {
      setClientId('');
      setProductName('');
      setDescription('');
      setTotalValue('');
      setUnitValue('');
      setQuantity('');
    }
  }, [open, prefillData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientId || !totalValue) return;
    onSubmit({
      client_id: clientId,
      product_name: productName || undefined,
      description: description || undefined,
      total_value: parseFloat(totalValue),
      unit_value: unitValue ? parseFloat(unitValue) : undefined,
      quantity: quantity ? parseInt(quantity) : undefined,
      raw_data: prefillData?.raw_data,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-card">
        <DialogHeader>
          <DialogTitle>Novo Orçamento</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Cliente *</Label>
            <Select value={clientId} onValueChange={setClientId}>
              <SelectTrigger><SelectValue placeholder="Selecione um cliente" /></SelectTrigger>
              <SelectContent>
                {clients.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Produto</Label>
            <Input value={productName} onChange={e => setProductName(e.target.value)} placeholder="Nome do produto" maxLength={100} />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label>Valor Total *</Label>
              <Input type="number" step="0.01" min="0" value={totalValue} onChange={e => setTotalValue(e.target.value)} required />
            </div>
            <div>
              <Label>Valor Unit.</Label>
              <Input type="number" step="0.01" min="0" value={unitValue} onChange={e => setUnitValue(e.target.value)} />
            </div>
            <div>
              <Label>Quantidade</Label>
              <Input type="number" min="1" value={quantity} onChange={e => setQuantity(e.target.value)} />
            </div>
          </div>
          <div>
            <Label>Descrição</Label>
            <Textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} placeholder="Detalhes do orçamento..." maxLength={500} />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" disabled={isLoading || !clientId || !totalValue}>Criar Orçamento</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default QuoteForm;
