import React, { useState, useMemo, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Plus, Trash2 } from 'lucide-react';
import { useClients } from '@/hooks/useClients';
import { useProducts } from '@/hooks/useProducts';
import { useManualEntries, type ManualEntryItem } from '@/hooks/useManualEntries';

export interface ManualEntryEditData {
  order_id: string;
  quote_id: string;
  client_id: string;
  entry_date: string;
  items: ManualEntryItem[];
  total_cost: number;
  amount_received: number;
  total_revenue: number;
  notes?: string | null;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editEntry?: ManualEntryEditData | null;
}

const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const today = () => new Date().toISOString().slice(0, 10);

const ManualEntryModal: React.FC<Props> = ({ open, onOpenChange, editEntry }) => {
  const { clients } = useClients();
  const { products } = useProducts();
  const { createManualEntry, updateManualEntry } = useManualEntries();
  const isEdit = !!editEntry;

  const [clientId, setClientId] = useState('');
  const [entryDate, setEntryDate] = useState(today());
  const [items, setItems] = useState<ManualEntryItem[]>([{ name: '', quantity: 1, unit_value: 0 }]);
  const [totalCost, setTotalCost] = useState('0');
  const [paymentMode, setPaymentMode] = useState<'full' | 'partial' | 'pending'>('full');
  const [partialReceived, setPartialReceived] = useState('0');
  const [dueDate, setDueDate] = useState(today());
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (open && editEntry) {
      setClientId(editEntry.client_id);
      setEntryDate(editEntry.entry_date);
      setItems(editEntry.items.length ? editEntry.items.map(it => ({ name: it.name, quantity: Number(it.quantity) || 1, unit_value: Number(it.unit_value) || 0, product_id: it.product_id ?? null })) : [{ name: '', quantity: 1, unit_value: 0 }]);
      setTotalCost(String(editEntry.total_cost ?? 0));
      const rev = editEntry.total_revenue;
      const rec = editEntry.amount_received;
      const mode: 'full' | 'partial' | 'pending' = rec <= 0 ? 'pending' : rec >= rev ? 'full' : 'partial';
      setPaymentMode(mode);
      setPartialReceived(String(rec));
      setDueDate(editEntry.entry_date);
      setNotes(editEntry.notes ?? '');
    }
  }, [open, editEntry]);


  const subtotal = useMemo(
    () => items.reduce((s, it) => s + (Number(it.quantity) || 0) * (Number(it.unit_value) || 0), 0),
    [items]
  );
  const cost = Number(totalCost.replace(',', '.')) || 0;
  const profit = subtotal - cost;

  const reset = () => {
    setClientId('');
    setEntryDate(today());
    setItems([{ name: '', quantity: 1, unit_value: 0 }]);
    setTotalCost('0');
    setPaymentMode('full');
    setPartialReceived('0');
    setDueDate(today());
    setNotes('');
  };

  const updateItem = (i: number, patch: Partial<ManualEntryItem>) => {
    setItems(prev => prev.map((it, idx) => (idx === i ? { ...it, ...patch } : it)));
  };
  const removeItem = (i: number) => setItems(prev => prev.filter((_, idx) => idx !== i));
  const addItem = () => setItems(prev => [...prev, { name: '', quantity: 1, unit_value: 0 }]);

  const onSelectProduct = (i: number, productId: string) => {
    const p = products.find(pp => pp.id === productId);
    if (!p) return;
    updateItem(i, { name: p.name, unit_value: Number(p.unit_price) || 0, product_id: p.id });
  };

  const canSubmit =
    !!clientId &&
    items.length > 0 &&
    items.every(it => it.name.trim() && it.quantity > 0 && it.unit_value >= 0) &&
    subtotal > 0;

  const handleSubmit = () => {
    const amountReceived =
      paymentMode === 'full' ? subtotal :
      paymentMode === 'pending' ? 0 :
      Math.min(subtotal, Number(partialReceived.replace(',', '.')) || 0);
    createManualEntry.mutate(
      {
        client_id: clientId,
        entry_date: entryDate,
        items,
        total_cost: cost,
        amount_received: amountReceived,
        notes: notes.trim() || null,
        receivable_due_date: paymentMode === 'full' ? null : dueDate,
      },
      {
        onSuccess: () => {
          reset();
          onOpenChange(false);
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) reset(); onOpenChange(o); }}>
      <DialogContent className="max-w-[calc(100vw-1rem)] sm:max-w-2xl max-h-[90vh] overflow-y-auto bg-card">
        <DialogHeader>
          <DialogTitle>Registrar entrada</DialogTitle>
          <DialogDescription>
            Lance uma receita avulsa sem precisar criar orçamento. Aparece em Financeiro e Pedidos.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Cliente *</Label>
              <Select value={clientId} onValueChange={setClientId}>
                <SelectTrigger><SelectValue placeholder="Selecione o cliente" /></SelectTrigger>
                <SelectContent>
                  {clients.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Data da entrada</Label>
              <Input type="date" value={entryDate} onChange={e => setEntryDate(e.target.value)} />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Itens *</Label>
              <Button type="button" variant="outline" size="sm" onClick={addItem}>
                <Plus className="w-3.5 h-3.5 mr-1" /> Adicionar item
              </Button>
            </div>
            <div className="space-y-2">
              {items.map((it, i) => (
                <div key={i} className="grid grid-cols-12 gap-2 p-2 rounded-md border border-border bg-muted/20">
                  <div className="col-span-12 sm:col-span-5 space-y-1">
                    <Input
                      placeholder="Produto/serviço"
                      value={it.name}
                      onChange={e => updateItem(i, { name: e.target.value })}
                    />
                    {products.length > 0 && (
                      <Select value={it.product_id || ''} onValueChange={(v) => onSelectProduct(i, v)}>
                        <SelectTrigger className="h-7 text-xs"><SelectValue placeholder="Ou escolha do catálogo" /></SelectTrigger>
                        <SelectContent>
                          {products.filter(p => p.is_active).map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                  <Input
                    className="col-span-4 sm:col-span-2"
                    type="number" min="1"
                    value={it.quantity}
                    onChange={e => updateItem(i, { quantity: Math.max(1, parseInt(e.target.value) || 1) })}
                    placeholder="Qtd"
                  />
                  <Input
                    className="col-span-5 sm:col-span-3"
                    type="number" step="0.01" min="0"
                    value={it.unit_value}
                    onChange={e => updateItem(i, { unit_value: parseFloat(e.target.value) || 0 })}
                    placeholder="Valor unit."
                  />
                  <div className="col-span-2 sm:col-span-2 flex items-center justify-end gap-1">
                    <span className="text-xs font-semibold tabular-nums">{fmt((it.quantity || 0) * (it.unit_value || 0))}</span>
                    {items.length > 1 && (
                      <Button type="button" size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => removeItem(i)}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Custo total (opcional)</Label>
              <Input type="number" step="0.01" min="0" value={totalCost} onChange={e => setTotalCost(e.target.value)} />
              <p className="text-[11px] text-muted-foreground">Usado para calcular o lucro líquido.</p>
            </div>
            <div className="space-y-1.5">
              <Label>Recebimento</Label>
              <RadioGroup value={paymentMode} onValueChange={(v) => setPaymentMode(v as any)} className="flex flex-col gap-1 mt-1">
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <RadioGroupItem value="full" /> Recebido integralmente
                </label>
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <RadioGroupItem value="partial" /> Parcialmente
                </label>
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <RadioGroupItem value="pending" /> A receber
                </label>
              </RadioGroup>
            </div>
          </div>

          {paymentMode === 'partial' && (
            <div className="space-y-1.5">
              <Label>Valor recebido</Label>
              <Input type="number" step="0.01" min="0" value={partialReceived} onChange={e => setPartialReceived(e.target.value)} />
            </div>
          )}

          {paymentMode !== 'full' && (
            <div className="space-y-1.5">
              <Label>Vencimento da pendência</Label>
              <Input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} />
            </div>
          )}

          <div className="space-y-1.5">
            <Label>Observação</Label>
            <Textarea rows={2} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Opcional" />
          </div>

          <div className="rounded-lg border border-border bg-muted/20 p-3 space-y-1 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Faturamento</span><span className="font-semibold text-emerald-600">{fmt(subtotal)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Custo</span><span className="text-red-500">{fmt(cost)}</span></div>
            <div className="flex justify-between border-t border-border pt-1"><span className="font-semibold">Lucro líquido previsto</span><span className={`font-bold ${profit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>{fmt(profit)}</span></div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSubmit} disabled={!canSubmit || createManualEntry.isPending}>
            {createManualEntry.isPending ? 'Salvando...' : 'Registrar entrada'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ManualEntryModal;
