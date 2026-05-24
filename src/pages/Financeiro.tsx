import React, { useState, useMemo } from 'react';
import { DollarSign, TrendingDown, TrendingUp, Clock, Plus, Pencil, FileDown, FileText } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import AppLayout from '@/components/AppLayout';
import PeriodFilter, { type PeriodKey, getDateRange } from '@/components/PeriodFilter';
import { useOrders } from '@/hooks/useOrders';
import ManualEntryModal, { type ManualEntryEditData } from '@/components/financeiro/ManualEntryModal';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';

const formatCurrency = (v: number) => (Number.isFinite(v) ? v : 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const isManualEntry = (o: any) => !!o?.quotes?.raw_data?.manual_entry;

const Financeiro: React.FC = () => {
  const { orders } = useOrders();
  const [period, setPeriod] = useState<PeriodKey>('current_month');
  const [customStart, setCustomStart] = useState<Date | undefined>();
  const [customEnd, setCustomEnd] = useState<Date | undefined>();
  const [entryOpen, setEntryOpen] = useState(false);
  const [editEntry, setEditEntry] = useState<ManualEntryEditData | null>(null);

  const filteredOrders = useMemo(() => {
    const { start, end } = getDateRange(period, customStart, customEnd);
    if (!start) return orders;
    return orders.filter(o => {
      const d = new Date(o.created_at);
      return d >= start && (!end || d <= end);
    });
  }, [orders, period, customStart, customEnd]);

  const totalFaturamento = filteredOrders.reduce((s, o) => s + (Number((o as any).total_revenue) || 0), 0);
  const totalDespesas = filteredOrders.reduce((s, o) => s + (Number((o as any).total_cost) || 0), 0);
  const totalLucro = totalFaturamento - totalDespesas;
  const totalAReceber = filteredOrders.reduce((s, o) => s + (Number((o as any).amount_pending) || 0), 0);

  const kpis = [
    { label: 'Faturamento', value: formatCurrency(totalFaturamento), icon: DollarSign, color: 'text-green-500' },
    { label: 'Despesas', value: formatCurrency(totalDespesas), icon: TrendingDown, color: 'text-red-500' },
    { label: 'Lucro Líquido', value: formatCurrency(totalLucro), icon: TrendingUp, color: totalLucro >= 0 ? 'text-emerald-500' : 'text-red-500' },
    { label: 'A Receber', value: formatCurrency(totalAReceber), icon: Clock, color: 'text-yellow-500' },
  ];

  const periodLabel = useMemo(() => {
    const { start, end } = getDateRange(period, customStart, customEnd);
    if (!start) return 'Todo período';
    const s = format(start, 'dd/MM/yyyy');
    const e = end ? format(end, 'dd/MM/yyyy') : format(new Date(), 'dd/MM/yyyy');
    return `${s} a ${e}`;
  }, [period, customStart, customEnd]);

  const buildRows = () => filteredOrders.map(o => {
    const rev = Number((o as any).total_revenue) || 0;
    const cost = Number((o as any).total_cost) || 0;
    const received = Number((o as any).amount_received) || 0;
    const pending = Number((o as any).amount_pending) || 0;
    return {
      cliente: o.clients?.name || '—',
      produto: o.quotes?.product_name || '—',
      tipo: isManualEntry(o) ? 'Entrada manual' : 'Pedido',
      faturamento: rev,
      despesas: cost,
      lucro: rev - cost,
      recebido: received,
      pendente: pending,
    };
  });

  const exportCSV = () => {
    const rows = buildRows();
    const header = ['Cliente', 'Produto', 'Tipo', 'Faturamento', 'Despesas', 'Lucro', 'Recebido', 'Pendente'];
    const lines = [header.join(';')];
    rows.forEach(r => {
      lines.push([r.cliente, r.produto, r.tipo, r.faturamento.toFixed(2), r.despesas.toFixed(2), r.lucro.toFixed(2), r.recebido.toFixed(2), r.pendente.toFixed(2)]
        .map(v => `"${String(v).replace(/"/g, '""')}"`).join(';'));
    });
    lines.push('');
    lines.push(`"Faturamento total";"${totalFaturamento.toFixed(2)}"`);
    lines.push(`"Despesas";"${totalDespesas.toFixed(2)}"`);
    lines.push(`"Lucro líquido";"${totalLucro.toFixed(2)}"`);
    lines.push(`"A receber";"${totalAReceber.toFixed(2)}"`);
    const blob = new Blob(['\uFEFF' + lines.join('\n')], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `financeiro-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    doc.setFontSize(16); doc.setFont('helvetica', 'bold');
    doc.text('Resumo Financeiro', 14, 18);
    doc.setFontSize(10); doc.setFont('helvetica', 'normal');
    doc.text(`Período: ${periodLabel}`, 14, 25);

    autoTable(doc, {
      startY: 32,
      head: [['Indicador', 'Valor']],
      body: [
        ['Faturamento', formatCurrency(totalFaturamento)],
        ['Despesas', formatCurrency(totalDespesas)],
        ['Lucro Líquido', formatCurrency(totalLucro)],
        ['A Receber', formatCurrency(totalAReceber)],
      ],
      theme: 'striped',
      headStyles: { fillColor: [16, 185, 129] },
    });

    const rows = buildRows();
    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 8,
      head: [['Cliente', 'Produto', 'Tipo', 'Fat.', 'Desp.', 'Lucro', 'Receb.', 'Pend.']],
      body: rows.map(r => [r.cliente, r.produto, r.tipo, formatCurrency(r.faturamento), formatCurrency(r.despesas), formatCurrency(r.lucro), formatCurrency(r.recebido), formatCurrency(r.pendente)]),
      styles: { fontSize: 8 },
      headStyles: { fillColor: [30, 30, 30] },
    });

    doc.save(`financeiro-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
  };

  const openEdit = (o: any) => {
    const q = o.quotes;
    const items = Array.isArray(q?.items) ? q.items.map((it: any) => ({
      name: it.name ?? '',
      quantity: Number(it.quantity) || 1,
      unit_value: Number(it.unit_value ?? it.unitValue ?? it.price) || 0,
      product_id: it.product_id ?? null,
    })) : [];
    setEditEntry({
      order_id: o.id,
      quote_id: o.quote_id,
      client_id: q?.client_id ?? o.client_id,
      entry_date: (o.created_at as string).slice(0, 10),
      items: items.length ? items : [{ name: q?.product_name ?? '', quantity: 1, unit_value: Number(o.total_revenue) || 0 }],
      total_cost: Number(o.total_cost) || 0,
      amount_received: Number(o.amount_received) || 0,
      total_revenue: Number(o.total_revenue) || 0,
      notes: null,
    });
    setEntryOpen(true);
  };

  const handleOpenChange = (o: boolean) => {
    setEntryOpen(o);
    if (!o) setEditEntry(null);
  };

  return (
    <AppLayout>
      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 max-w-6xl">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5 sm:mb-6">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-foreground">Financeiro</h1>
            <p className="text-xs sm:text-sm text-muted-foreground">Controle financeiro dos pedidos</p>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <PeriodFilter
              value={period}
              onChange={setPeriod}
              customStart={customStart}
              customEnd={customEnd}
              onCustomStartChange={setCustomStart}
              onCustomEndChange={setCustomEnd}
            />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="shrink-0">
                  <FileDown className="w-4 h-4 mr-1" /> Exportar
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={exportCSV}>
                  <FileDown className="w-4 h-4 mr-2" /> CSV
                </DropdownMenuItem>
                <DropdownMenuItem onClick={exportPDF}>
                  <FileText className="w-4 h-4 mr-2" /> PDF
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button
              onClick={() => { setEditEntry(null); setEntryOpen(true); }}
              className="shrink-0 bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              <Plus className="w-4 h-4 mr-1" /> Registrar entrada
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 mb-5 sm:mb-6">
          {kpis.map(kpi => (
            <Card key={kpi.label} className="p-3 sm:p-4 bg-card border-border">
              <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                <div className={`p-2 rounded-lg bg-secondary ${kpi.color} shrink-0`}>
                  <kpi.icon className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] sm:text-xs text-muted-foreground truncate">{kpi.label}</p>
                  <p className="text-sm font-bold text-foreground truncate">{kpi.value}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>

        <Card className="bg-card border-border overflow-hidden">
          <div className="overflow-x-auto">
            <Table className="min-w-[760px]">
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Produto</TableHead>
                  <TableHead className="text-right">Faturamento</TableHead>
                  <TableHead className="text-right">Despesas</TableHead>
                  <TableHead className="text-right">Lucro</TableHead>
                  <TableHead className="text-right">Recebido</TableHead>
                  <TableHead className="text-right">Pendente</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      Nenhum pedido encontrado no período.
                    </TableCell>
                  </TableRow>
                ) : filteredOrders.map(order => {
                  const rev = Number((order as any).total_revenue) || 0;
                  const cost = Number((order as any).total_cost) || 0;
                  const received = Number((order as any).amount_received) || 0;
                  const pending = Number((order as any).amount_pending) || 0;
                  const manual = isManualEntry(order);
                  return (
                    <TableRow key={order.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          {order.clients?.name || '—'}
                          {manual && <Badge variant="secondary" className="text-[10px]">manual</Badge>}
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{order.quotes?.product_name || '—'}</TableCell>
                      <TableCell className="text-right font-semibold text-green-600">{formatCurrency(rev)}</TableCell>
                      <TableCell className="text-right text-red-500">{formatCurrency(cost)}</TableCell>
                      <TableCell className={`text-right font-semibold ${rev - cost >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                        {formatCurrency(rev - cost)}
                      </TableCell>
                      <TableCell className="text-right">{formatCurrency(received)}</TableCell>
                      <TableCell className={`text-right font-semibold ${pending > 0 ? 'text-yellow-600' : 'text-muted-foreground'}`}>
                        {formatCurrency(pending)}
                      </TableCell>
                      <TableCell>
                        {manual && (
                          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEdit(order)} title="Editar entrada">
                            <Pencil className="w-3.5 h-3.5" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </Card>
      </div>
      <ManualEntryModal open={entryOpen} onOpenChange={handleOpenChange} editEntry={editEntry} />
    </AppLayout>
  );
};

export default Financeiro;
