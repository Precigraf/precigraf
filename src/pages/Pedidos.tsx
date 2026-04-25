import React, { useState, useMemo } from 'react';
import { Package, Clock, CheckCircle2, DollarSign, Search, Eye, Trash2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import AppLayout from '@/components/AppLayout';
import OrderDetailsModal from '@/components/gestao/OrderDetailsModal';
import PeriodFilter, { type PeriodKey, getDateRange } from '@/components/PeriodFilter';
import { useOrders, KANBAN_COLUMNS, type Order } from '@/hooks/useOrders';

const WhatsAppIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.002-5.45 4.436-9.884 9.888-9.884 2.364 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.5.335.157 11.892c0 2.096.547 4.142 1.58 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
  </svg>
);

const formatCurrency = (v: number) => (Number.isFinite(v) ? v : 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const STATUS_BADGE: Record<string, string> = {
  approved: 'bg-blue-500/10 text-blue-600 border-blue-500/30',
  creating_art: 'bg-purple-500/10 text-purple-600 border-purple-500/30',
  awaiting_client_approval: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/30',
  in_production: 'bg-orange-500/10 text-orange-600 border-orange-500/30',
  in_transit: 'bg-cyan-500/10 text-cyan-600 border-cyan-500/30',
  delivered: 'bg-green-500/10 text-green-600 border-green-500/30',
};

const Pedidos: React.FC = () => {
  const { orders, isLoading, updateOrderStatus, deleteOrder } = useOrders();
  const [period, setPeriod] = useState<PeriodKey>('current_month');
  const [customStart, setCustomStart] = useState<Date | undefined>();
  const [customEnd, setCustomEnd] = useState<Date | undefined>();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selected, setSelected] = useState<Order | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  const filteredOrders = useMemo(() => {
    const { start, end } = getDateRange(period, customStart, customEnd);
    return orders.filter(o => {
      if (start) {
        const d = new Date(o.created_at);
        if (d < start || (end && d > end)) return false;
      }
      if (statusFilter !== 'all' && o.status !== statusFilter) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchClient = o.clients?.name?.toLowerCase().includes(q);
        const matchProduct = o.quotes?.product_name?.toLowerCase().includes(q);
        const matchNumber = `ped-${o.order_number}`.includes(q);
        if (!matchClient && !matchProduct && !matchNumber) return false;
      }
      return true;
    });
  }, [orders, period, customStart, customEnd, statusFilter, search]);

  const total = filteredOrders.length;
  const emAndamento = filteredOrders.filter(o => o.status !== 'delivered').length;
  const aprovados = filteredOrders.filter(o => o.status === 'approved').length;
  const faturamento = filteredOrders.reduce((sum, o) => sum + (Number(o.total_revenue) || 0), 0);

  const kpis = [
    { label: 'Faturamento', icon: DollarSign, color: 'text-emerald-500', display: formatCurrency(faturamento) },
    { label: 'Total', icon: Package, color: 'text-blue-500', display: String(total) },
    { label: 'Em andamento', icon: Clock, color: 'text-orange-500', display: String(emAndamento) },
    { label: 'Aprovados', icon: CheckCircle2, color: 'text-green-500', display: String(aprovados) },
  ];

  const openDetails = (o: Order) => { setSelected(o); setDetailsOpen(true); };

  const openWhatsApp = (o: Order) => {
    if (!o.clients?.whatsapp) return;
    const phone = o.clients.whatsapp.replace(/\D/g, '');
    window.open(`https://wa.me/55${phone}`, '_blank', 'noopener,noreferrer');
  };

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Pedidos</h1>
            <p className="text-sm text-muted-foreground">Gerencie seus pedidos e acompanhe o status</p>
          </div>
          <PeriodFilter
            value={period}
            onChange={setPeriod}
            customStart={customStart}
            customEnd={customEnd}
            onCustomStartChange={setCustomStart}
            onCustomEndChange={setCustomEnd}
          />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {kpis.map(kpi => (
            <Card key={kpi.label} className="p-4 bg-card border-border">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg bg-secondary ${kpi.color}`}>
                  <kpi.icon className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">{kpi.label}</p>
                  <p className="text-base font-bold text-foreground truncate">{kpi.display}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>

        <Card className="p-3 mb-4 bg-card border-border">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative flex-1 min-w-[220px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por nome, número ou produto..." className="pl-9" />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Status:</span>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {KANBAN_COLUMNS.map(c => <SelectItem key={c.id} value={c.id}>{c.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
        </Card>

        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground">Carregando...</div>
        ) : filteredOrders.length === 0 ? (
          <Card className="p-12 text-center bg-card border-border">
            <Package className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">Nenhum pedido encontrado.</p>
          </Card>
        ) : (
          <div className="space-y-2">
            {filteredOrders.map(o => {
              return (
                <Card key={o.id} className="p-4 bg-card border-border hover:border-primary/30 transition-colors">
                  <div className="flex items-center gap-4 flex-wrap md:flex-nowrap">
                    <div className="shrink-0 min-w-[90px]">
                      <div className="text-xs text-muted-foreground font-mono">PED-{o.order_number ?? '—'}</div>
                    </div>

                    <div className="flex-1 min-w-[180px]">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-foreground">{o.clients?.name || '—'}</span>
                        {o.clients?.whatsapp && (
                          <button onClick={() => openWhatsApp(o)} className="text-green-500 hover:text-green-400" title="Abrir WhatsApp">
                            <MessageCircle className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                      {o.clients?.whatsapp && <div className="text-xs text-muted-foreground">{o.clients.whatsapp}</div>}
                      <div className="text-xs text-muted-foreground">Criado em {new Date(o.created_at).toLocaleDateString('pt-BR')} às {new Date(o.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</div>
                    </div>

                    <div className="shrink-0 text-right min-w-[110px]">
                      <div className="font-bold text-foreground">{formatCurrency(Number(o.total_revenue) || 0)}</div>
                      {Number(o.amount_pending) > 0 && (
                        <div className="text-xs text-yellow-600">A receber: {formatCurrency(Number(o.amount_pending))}</div>
                      )}
                    </div>

                    <div className="shrink-0">
                      <Select value={o.status} onValueChange={(v) => updateOrderStatus.mutate({ orderId: o.id, newStatus: v, oldStatus: o.status })}>
                        <SelectTrigger className={`w-[180px] ${STATUS_BADGE[o.status] || ''}`}><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {KANBAN_COLUMNS.map(c => <SelectItem key={c.id} value={c.id}>{c.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="shrink-0 flex items-center gap-1">
                      <Button size="icon" variant="ghost" onClick={() => openDetails(o)} title="Visualizar">
                        <Eye className="w-4 h-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button size="icon" variant="ghost" className="text-destructive hover:text-destructive" title="Excluir">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="bg-card">
                          <AlertDialogHeader>
                            <AlertDialogTitle>Excluir pedido?</AlertDialogTitle>
                            <AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={() => deleteOrder.mutate(o.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                              Excluir
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        <OrderDetailsModal open={detailsOpen} onOpenChange={setDetailsOpen} order={selected} />
      </div>
    </AppLayout>
  );
};

export default Pedidos;
