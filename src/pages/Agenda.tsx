import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, CalendarDays, AlertTriangle, Clock, Package, CalendarClock } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AppLayout from '@/components/AppLayout';
import OrderDetailsModal from '@/components/gestao/OrderDetailsModal';
import { KANBAN_COLUMNS, type Order } from '@/hooks/useOrders';
import { useDeliverySchedule, getDeliveryBucket, type DeliveryBucket } from '@/hooks/useDeliverySchedule';
import { cn } from '@/lib/utils';

const WEEKDAYS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];
const MONTHS = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

const BUCKET_STYLES: Record<DeliveryBucket, string> = {
  overdue: 'bg-destructive/15 text-destructive border-destructive/40',
  today: 'bg-orange-500/15 text-orange-600 border-orange-500/40',
  soon: 'bg-yellow-500/15 text-yellow-600 border-yellow-500/40',
  scheduled: 'bg-blue-500/10 text-blue-600 border-blue-500/30',
  delivered: 'bg-green-500/10 text-green-600 border-green-500/30',
  none: 'bg-muted text-muted-foreground border-border',
};

const formatCurrency = (v: number) => (Number.isFinite(v) ? v : 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

function toDateKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function buildMonthGrid(year: number, month: number) {
  // Grid Mon-Sun. month is 0-indexed.
  const first = new Date(year, month, 1);
  // JS: 0=Sun..6=Sat. Convert to Mon=0..Sun=6
  const jsDow = first.getDay();
  const leading = (jsDow + 6) % 7;
  const start = new Date(year, month, 1 - leading);
  const cells: Date[] = [];
  for (let i = 0; i < 42; i++) {
    cells.push(new Date(start.getFullYear(), start.getMonth(), start.getDate() + i));
  }
  return cells;
}

const Agenda: React.FC = () => {
  const { orders, isLoading, stats } = useDeliverySchedule();
  const now = new Date();
  const [cursor, setCursor] = useState(new Date(now.getFullYear(), now.getMonth(), 1));
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedDay, setSelectedDay] = useState<string | null>(toDateKey(now));
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  const filteredOrders = useMemo(() => {
    return orders.filter(o => statusFilter === 'all' || o.status === statusFilter);
  }, [orders, statusFilter]);

  const byDay = useMemo(() => {
    const map = new Map<string, Order[]>();
    for (const o of filteredOrders) {
      if (!o.delivery_date) continue;
      const key = o.delivery_date.slice(0, 10);
      const list = map.get(key) ?? [];
      list.push(o);
      map.set(key, list);
    }
    return map;
  }, [filteredOrders]);

  const noDateOrders = useMemo(
    () => filteredOrders.filter(o => !o.delivery_date && o.status !== 'delivered'),
    [filteredOrders]
  );

  const cells = useMemo(() => buildMonthGrid(cursor.getFullYear(), cursor.getMonth()), [cursor]);
  const todayKey = toDateKey(now);

  const openOrder = (o: Order) => { setSelectedOrder(o); setDetailsOpen(true); };

  const KPIS = [
    { label: 'Atrasados', value: stats.overdue, icon: AlertTriangle, color: 'text-destructive' },
    { label: 'Hoje', value: stats.today, icon: Clock, color: 'text-orange-500' },
    { label: 'Próx. 7 dias', value: stats.next7, icon: CalendarClock, color: 'text-blue-500' },
    { label: 'Sem data', value: stats.noDate, icon: Package, color: 'text-muted-foreground' },
  ];

  const dayOrders = selectedDay ? byDay.get(selectedDay) ?? [] : [];

  return (
    <AppLayout>
      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-foreground flex items-center gap-2">
              <CalendarDays className="w-6 h-6 text-primary" /> Agenda de Entregas
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground">Calendário mensal com todos os pedidos por data de entrega</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <div className="min-w-[160px] text-center font-semibold text-foreground">
              {MONTHS[cursor.getMonth()]} {cursor.getFullYear()}
            </div>
            <Button variant="outline" size="icon" onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))}>
              <ChevronRight className="w-4 h-4" />
            </Button>
            <Button variant="secondary" size="sm" onClick={() => { setCursor(new Date(now.getFullYear(), now.getMonth(), 1)); setSelectedDay(todayKey); }}>
              Hoje
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 mb-5">
          {KPIS.map(k => (
            <Card key={k.label} className="p-3 sm:p-4 bg-card border-border">
              <div className="flex items-center gap-3 min-w-0">
                <div className={cn('p-2 rounded-lg bg-secondary shrink-0', k.color)}>
                  <k.icon className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] sm:text-xs text-muted-foreground truncate">{k.label}</p>
                  <p className="text-lg sm:text-xl font-bold text-foreground">{k.value}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>

        <Card className="p-3 mb-4 bg-card border-border">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <span className="text-sm text-muted-foreground">Filtrar por status:</span>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[220px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                {KANBAN_COLUMNS.map(c => <SelectItem key={c.id} value={c.id}>{c.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </Card>

        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground">Carregando agenda...</div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-4">
            {/* Calendar grid */}
            <Card className="p-2 sm:p-3 bg-card border-border overflow-hidden">
              <div className="grid grid-cols-7 gap-1 mb-1">
                {WEEKDAYS.map(w => (
                  <div key={w} className="text-[11px] sm:text-xs font-semibold text-muted-foreground text-center py-1">{w}</div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1">
                {cells.map((d, i) => {
                  const key = toDateKey(d);
                  const list = byDay.get(key) ?? [];
                  const outsideMonth = d.getMonth() !== cursor.getMonth();
                  const isToday = key === todayKey;
                  const isSelected = key === selectedDay;
                  return (
                    <button
                      key={i}
                      onClick={() => setSelectedDay(key)}
                      className={cn(
                        'min-h-[64px] sm:min-h-[88px] rounded-md border p-1 sm:p-1.5 text-left transition-colors flex flex-col gap-1',
                        'hover:bg-muted/60',
                        outsideMonth ? 'bg-muted/20 border-border/50 text-muted-foreground' : 'bg-background border-border',
                        isToday && 'ring-1 ring-primary',
                        isSelected && 'bg-primary/10 border-primary/40',
                      )}
                    >
                      <div className={cn('text-[11px] sm:text-xs font-medium', isToday && 'text-primary font-bold')}>
                        {d.getDate()}
                      </div>
                      <div className="flex-1 flex flex-col gap-0.5 overflow-hidden">
                        {list.slice(0, 3).map(o => {
                          const bucket = getDeliveryBucket(o, now);
                          return (
                            <span
                              key={o.id}
                              onClick={(e) => { e.stopPropagation(); openOrder(o); }}
                              className={cn(
                                'text-[10px] sm:text-[11px] leading-tight px-1 py-0.5 rounded border truncate cursor-pointer',
                                BUCKET_STYLES[bucket],
                              )}
                              title={`PED-${o.order_number} · ${o.clients?.name || ''}`}
                            >
                              PED-{o.order_number}
                            </span>
                          );
                        })}
                        {list.length > 3 && (
                          <span className="text-[10px] text-muted-foreground">+{list.length - 3} mais</span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </Card>

            {/* Side panel */}
            <div className="space-y-3">
              <Card className="p-3 bg-card border-border">
                <div className="text-sm font-semibold text-foreground mb-2">
                  {selectedDay
                    ? new Date(selectedDay + 'T00:00:00').toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })
                    : 'Selecione um dia'}
                </div>
                {dayOrders.length === 0 ? (
                  <p className="text-xs text-muted-foreground py-4 text-center">Nenhuma entrega neste dia.</p>
                ) : (
                  <div className="space-y-2">
                    {dayOrders.map(o => {
                      const bucket = getDeliveryBucket(o, now);
                      const statusLabel = KANBAN_COLUMNS.find(c => c.id === o.status)?.label || o.status;
                      return (
                        <button
                          key={o.id}
                          onClick={() => openOrder(o)}
                          className="w-full text-left p-2 rounded-md border border-border hover:bg-muted/40 transition-colors"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-mono text-xs text-muted-foreground">PED-{o.order_number}</span>
                            <Badge variant="outline" className={cn('text-[10px]', BUCKET_STYLES[bucket])}>{statusLabel}</Badge>
                          </div>
                          <div className="text-sm font-medium text-foreground truncate mt-0.5">{o.clients?.name || '—'}</div>
                          <div className="text-xs text-muted-foreground flex justify-between">
                            <span>{o.quotes?.product_name || ''}</span>
                            <span>{formatCurrency(Number(o.total_revenue) || 0)}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </Card>

              {noDateOrders.length > 0 && (
                <Card className="p-3 bg-card border-border">
                  <div className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-yellow-500" /> Sem data de entrega
                    <Badge variant="secondary">{noDateOrders.length}</Badge>
                  </div>
                  <div className="space-y-2 max-h-[300px] overflow-y-auto">
                    {noDateOrders.map(o => (
                      <button
                        key={o.id}
                        onClick={() => openOrder(o)}
                        className="w-full text-left p-2 rounded-md border border-dashed border-border hover:bg-muted/40 transition-colors"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-mono text-xs text-muted-foreground">PED-{o.order_number}</span>
                          <span className="text-[10px] text-primary">Definir data →</span>
                        </div>
                        <div className="text-sm font-medium text-foreground truncate">{o.clients?.name || '—'}</div>
                      </button>
                    ))}
                  </div>
                </Card>
              )}

              {/* Legend */}
              <Card className="p-3 bg-card border-border">
                <div className="text-xs font-semibold text-foreground mb-2">Legenda</div>
                <div className="grid grid-cols-1 gap-1 text-[11px]">
                  <div className="flex items-center gap-2"><span className={cn('w-3 h-3 rounded border', BUCKET_STYLES.overdue)} />Atrasado</div>
                  <div className="flex items-center gap-2"><span className={cn('w-3 h-3 rounded border', BUCKET_STYLES.today)} />Hoje</div>
                  <div className="flex items-center gap-2"><span className={cn('w-3 h-3 rounded border', BUCKET_STYLES.soon)} />Em até 2 dias</div>
                  <div className="flex items-center gap-2"><span className={cn('w-3 h-3 rounded border', BUCKET_STYLES.scheduled)} />Agendado</div>
                  <div className="flex items-center gap-2"><span className={cn('w-3 h-3 rounded border', BUCKET_STYLES.delivered)} />Entregue</div>
                </div>
              </Card>
            </div>
          </div>
        )}

        <OrderDetailsModal open={detailsOpen} onOpenChange={setDetailsOpen} order={selectedOrder} />
      </div>
    </AppLayout>
  );
};

export default Agenda;
