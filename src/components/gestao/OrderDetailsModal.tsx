import React, { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, User, Mail, MapPin, Package } from 'lucide-react';
import WhatsAppIcon from '@/components/WhatsAppIcon';
import { useOrders, KANBAN_COLUMNS, type Order } from '@/hooks/useOrders';
import { useProducts } from '@/hooks/useProducts';

interface OrderDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: Order | null;
}

const STATUS_BADGE: Record<string, string> = {
  approved: 'bg-blue-500/10 text-blue-600 border-blue-500/30',
  creating_art: 'bg-purple-500/10 text-purple-600 border-purple-500/30',
  awaiting_client_approval: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/30',
  in_production: 'bg-orange-500/10 text-orange-600 border-orange-500/30',
  in_transit: 'bg-cyan-500/10 text-cyan-600 border-cyan-500/30',
  delivered: 'bg-green-500/10 text-green-600 border-green-500/30',
};

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
    return Array.isArray(order.quotes.items) ? (order.quotes.items as any[]) : [];
  }, [order]);

  if (!order) return null;

  const client = order.clients as any;
  const quote = order.quotes as any;
  const subtotal = items.reduce((s, it: any) => s + (Number(it.quantity) || 0) * (Number(it.unit_value) || 0), 0);
  const discountValue = Number(quote?.discount_value) || 0;
  const discountType = quote?.discount_type || 'fixed';
  const shippingValue = Number(quote?.shipping_value) || 0;
  const discountAmount = discountType === 'percent'
    ? Math.min(subtotal, subtotal * (discountValue / 100))
    : Math.min(subtotal, discountValue);
  const total = Number(order.total_revenue) || Math.max(0, subtotal - discountAmount + shippingValue);
  const statusLabel = KANBAN_COLUMNS.find(c => c.id === order.status)?.label || order.status;

  const handleAdd = () => {
    const product = products.find(p => p.id === productId);
    const quantity = Math.max(1, parseInt(qty) || 1);
    const unit = parseFloat(unitValue.replace(',', '.')) || 0;
    if (!product || unit <= 0) return;
    addItemToOrder.mutate({
      orderId: order.id,
      item: { name: product.name, quantity, unit_value: unit, product_id: product.id },
    }, {
      onSuccess: () => { setProductId(''); setQty('1'); setUnitValue(''); setConfirming(false); },
    });
  };

  const addedRevenue = (parseInt(qty) || 0) * (parseFloat(unitValue.replace(',', '.')) || 0);
  const newTotal = total + addedRevenue;

  const openWhatsApp = () => {
    if (!client?.whatsapp) return;
    const phone = client.whatsapp.replace(/\D/g, '');
    window.open(`https://wa.me/55${phone}`, '_blank', 'noopener,noreferrer');
  };

  const address = [client?.address, client?.address_number].filter(Boolean).join(', ');
  const cityState = [client?.city, client?.state].filter(Boolean).join('/');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-card">
        <DialogHeader>
          <div className="flex items-center gap-3 flex-wrap">
            <DialogTitle>Pedido PED-{order.order_number ?? '—'}</DialogTitle>
            <Badge variant="outline" className={STATUS_BADGE[order.status] || ''}>{statusLabel}</Badge>
          </div>
          <DialogDescription>
            Criado em {new Date(order.created_at).toLocaleDateString('pt-BR')} às {new Date(order.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          {/* Cliente */}
          <div className="rounded-lg border border-border p-4 bg-muted/20">
            <Label className="text-base font-semibold mb-3 flex items-center gap-2">
              <User className="w-4 h-4" /> Cliente
            </Label>
            <div className="space-y-1.5 text-sm">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-foreground">{client?.name || '—'}</span>
                {client?.whatsapp && (
                  <button
                    onClick={openWhatsApp}
                    className="inline-flex items-center justify-center w-7 h-7 rounded-md border border-[#25D366]/40 bg-[#25D366]/10 text-[#25D366] hover:bg-[#25D366]/20 transition-colors"
                    title="Abrir WhatsApp"
                  >
                    <WhatsAppIcon className="w-4 h-4" />
                  </button>
                )}
              </div>
              {client?.whatsapp && <div className="text-muted-foreground">{client.whatsapp}</div>}
              {client?.email && (
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Mail className="w-3.5 h-3.5" /> {client.email}
                </div>
              )}
              {(address || cityState) && (
                <div className="flex items-start gap-1.5 text-muted-foreground">
                  <MapPin className="w-3.5 h-3.5 mt-0.5" />
                  <span>{[address, client?.neighborhood, cityState].filter(Boolean).join(' · ')}</span>
                </div>
              )}
            </div>
          </div>

          {/* Status */}
          <div>
            <Label className="text-base font-semibold mb-2 block">Status</Label>
            <Select value={order.status} onValueChange={(v) => updateOrderStatus.mutate({ orderId: order.id, newStatus: v, oldStatus: order.status })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {KANBAN_COLUMNS.map(c => <SelectItem key={c.id} value={c.id}>{c.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {/* Itens */}
          <div>
            <Label className="text-base font-semibold mb-2 flex items-center gap-2">
              <Package className="w-4 h-4" /> Itens do pedido
            </Label>
            {items.length === 0 ? (
              <p className="text-sm text-muted-foreground italic py-4 text-center">Nenhum item registrado.</p>
            ) : (
              <div className="rounded-lg border border-border overflow-hidden">
                <div className="grid grid-cols-12 gap-2 bg-muted/40 px-3 py-2 text-xs font-medium text-muted-foreground">
                  <div className="col-span-6">Produto</div>
                  <div className="col-span-2 text-center">Qtd</div>
                  <div className="col-span-2 text-right">Valor unit.</div>
                  <div className="col-span-2 text-right">Subtotal</div>
                </div>
                {items.map((it: any, i: number) => (
                  <div key={it.id || i} className="grid grid-cols-12 gap-2 px-3 py-2 text-sm border-t border-border">
                    <div className="col-span-6 text-foreground">{it.name}</div>
                    <div className="col-span-2 text-center">{it.quantity}</div>
                    <div className="col-span-2 text-right">{formatCurrency(Number(it.unit_value) || 0)}</div>
                    <div className="col-span-2 text-right font-semibold">{formatCurrency((Number(it.quantity) || 0) * (Number(it.unit_value) || 0))}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Resumo financeiro */}
          <div className="rounded-lg border border-border p-4 bg-muted/20 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal ({items.length} {items.length === 1 ? 'item' : 'itens'})</span>
              <span className="font-medium">{formatCurrency(subtotal)}</span>
            </div>
            {discountAmount > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Desconto {discountType === 'percent' ? `(${discountValue}%)` : ''}</span>
                <span className="text-destructive">- {formatCurrency(discountAmount)}</span>
              </div>
            )}
            {shippingValue > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Frete</span>
                <span className="font-medium">{formatCurrency(shippingValue)}</span>
              </div>
            )}
            <div className="border-t border-border pt-2 flex justify-between items-baseline">
              <span className="text-base font-semibold">Total</span>
              <span className="text-2xl font-bold text-foreground">{formatCurrency(total)}</span>
            </div>
            {Number(order.amount_pending) > 0 && (
              <div className="flex justify-between text-sm pt-1">
                <span className="text-muted-foreground">A receber</span>
                <span className="text-yellow-600 font-semibold">{formatCurrency(Number(order.amount_pending))}</span>
              </div>
            )}
          </div>

          {/* Adicionar novo item */}
          <div className="border-t border-border pt-4">
            <Label className="text-base font-semibold mb-2 block">Adicionar novo item</Label>
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
