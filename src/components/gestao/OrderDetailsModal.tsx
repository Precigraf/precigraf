import React, { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, User, Calendar, Package } from 'lucide-react';
import { useOrders, KANBAN_COLUMNS, type Order } from '@/hooks/useOrders';
import { useProducts } from '@/hooks/useProducts';

interface OrderDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: Order | null;
}

const formatCurrency = (v: number) => (Number.isFinite(v) ? v : 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const OrderDetailsModal: React.FC<OrderDetailsModalProps> = ({ open, onOpenChange, order }) => {
  const { updateOrderStatus, addItemToOrder } = useOrders();
  const { products } = useProducts();
  const [productId, setProductId] = useState<string>('');
  const [qty, setQty] = useState('1');
  const [unitValue, setUnitValue] = useState('');
  const [confirming, setConfirming] = useState(false);

  const items = useMemo(() => {
    if (!order?.quotes?.items) return [];
    return Array.isArray(order.quotes.items) ? order.quotes.items : [];
  }, [order]);

  if (!order) return null;

  const handleAdd = () => {
    const product = products.find(p => p.id === productId);
    const quantity = Math.max(1, parseInt(qty) || 1);
    const unit = parseFloat(unitValue.replace(',', '.')) || 0;
    if (!product || unit <= 0) return;
    addItemToOrder.mutate({
      orderId: order.id,
      item: { name: product.name, quantity, unit_value: unit, product_id: product.id },
    }, {
      onSuccess: () => {
        setProductId(''); setQty('1'); setUnitValue(''); setConfirming(false);
      },
    });
  };

  const addedRevenue = (parseInt(qty) || 0) * (parseFloat(unitValue.replace(',', '.')) || 0);
  const newTotal = Number(order.total_revenue || 0) + addedRevenue;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-card">
        <DialogHeader>
          <DialogTitle>Pedido PED-{order.order_number ?? '—'}</DialogTitle>
          <DialogDescription>Detalhes e itens do pedido</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 p-3 rounded-md bg-muted/30 border border-border">
            <div className="flex items-center gap-2 text-sm"><User className="w-4 h-4 text-muted-foreground" /> {order.clients?.name || '—'}</div>
            <div className="flex items-center gap-2 text-sm"><Calendar className="w-4 h-4 text-muted-foreground" /> {new Date(order.created_at).toLocaleDateString('pt-BR')}</div>
            <div className="text-sm"><span className="text-muted-foreground">Total:</span> <strong>{formatCurrency(Number(order.total_revenue) || 0)}</strong></div>
            <div className="text-sm"><span className="text-muted-foreground">A receber:</span> <strong className="text-yellow-600">{formatCurrency(Number(order.amount_pending) || 0)}</strong></div>
          </div>

          <div>
            <Label className="text-base mb-2 block">Status</Label>
            <Select value={order.status} onValueChange={(v) => updateOrderStatus.mutate({ orderId: order.id, newStatus: v, oldStatus: order.status })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {KANBAN_COLUMNS.map(c => <SelectItem key={c.id} value={c.id}>{c.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-base mb-2 flex items-center gap-2"><Package className="w-4 h-4" /> Itens</Label>
            {items.length === 0 ? (
              <p className="text-sm text-muted-foreground italic">Nenhum item registrado.</p>
            ) : (
              <div className="space-y-1">
                {items.map((it: any, i: number) => (
                  <div key={it.id || i} className="flex justify-between text-sm py-1.5 px-2 rounded bg-muted/20">
                    <span>{it.name} <Badge variant="outline" className="ml-2">×{it.quantity}</Badge></span>
                    <strong>{formatCurrency((it.quantity || 0) * (it.unit_value || 0))}</strong>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="border-t border-border pt-4">
            <Label className="text-base mb-2 block">Adicionar novo item</Label>
            <div className="grid grid-cols-12 gap-2">
              <div className="col-span-6">
                <Select value={productId} onValueChange={(v) => {
                  setProductId(v);
                  const p = products.find(pp => pp.id === v);
                  if (p) setUnitValue(String(p.unit_price));
                }}>
                  <SelectTrigger><SelectValue placeholder="Selecione um produto" /></SelectTrigger>
                  <SelectContent>
                    {products.filter(p => p.is_active).map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <Input className="col-span-2" type="number" min="1" value={qty} onChange={e => setQty(e.target.value)} placeholder="Qtd" />
              <Input className="col-span-3" type="number" step="0.01" min="0" value={unitValue} onChange={e => setUnitValue(e.target.value)} placeholder="Valor unit." />
              <Button className="col-span-1" size="icon" onClick={() => setConfirming(true)} disabled={!productId || addedRevenue <= 0}>
                <Plus className="w-4 h-4" />
              </Button>
            </div>

            {confirming && (
              <div className="mt-3 p-3 rounded-md border border-primary/30 bg-primary/5 space-y-2">
                <p className="text-sm">Adicionar <strong>{formatCurrency(addedRevenue)}</strong> ao pedido. Novo total: <strong>{formatCurrency(newTotal)}</strong>.</p>
                <div className="flex gap-2 justify-end">
                  <Button size="sm" variant="outline" onClick={() => setConfirming(false)}>Cancelar</Button>
                  <Button size="sm" onClick={handleAdd} disabled={addItemToOrder.isPending}>Confirmar</Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default OrderDetailsModal;
