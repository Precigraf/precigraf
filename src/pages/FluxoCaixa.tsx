import React, { useState, useMemo } from 'react';
import { ArrowDownCircle, ArrowUpCircle, Wallet, Clock, AlertTriangle, FileDown, FileText } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import AppLayout from '@/components/AppLayout';
import PeriodFilter, { type PeriodKey, getDateRange } from '@/components/PeriodFilter';
import CashFlowChart from '@/components/fluxo-caixa/CashFlowChart';
import CashFlowTable from '@/components/fluxo-caixa/CashFlowTable';
import { useCashFlow } from '@/hooks/useCashFlow';
import { format } from 'date-fns';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const fmt = (v: number) => (Number.isFinite(v) ? v : 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const FluxoCaixa: React.FC = () => {
  const [period, setPeriod] = useState<PeriodKey>('current_month');
  const [customStart, setCustomStart] = useState<Date | undefined>();
  const [customEnd, setCustomEnd] = useState<Date | undefined>();

  const { start, end } = useMemo(() => getDateRange(period, customStart, customEnd), [period, customStart, customEnd]);
  const { data, isLoading } = useCashFlow({ start, end });

  const totals = data?.totals ?? { realizedIn: 0, realizedOut: 0, realizedBalance: 0, forecastIn: 0, overdue: 0 };

  const kpis = [
    { label: 'Saldo realizado', value: fmt(totals.realizedBalance), icon: Wallet, color: totals.realizedBalance >= 0 ? 'text-emerald-500' : 'text-red-500' },
    { label: 'Entradas', value: fmt(totals.realizedIn), icon: ArrowDownCircle, color: 'text-emerald-500' },
    { label: 'Saídas', value: fmt(totals.realizedOut), icon: ArrowUpCircle, color: 'text-red-500' },
    { label: 'A receber', value: fmt(totals.forecastIn), icon: Clock, color: 'text-yellow-500' },
  ];

  const periodLabel = useMemo(() => {
    if (!start) return 'Todo período';
    return `${format(start, 'dd/MM/yyyy')} a ${format(end ?? new Date(), 'dd/MM/yyyy')}`;
  }, [start, end]);

  const exportCSV = () => {
    if (!data) return;
    const lines = ['Data;Tipo;Status;Origem;Categoria;Valor'];
    data.entries.forEach(e => {
      lines.push([
        e.date,
        e.type === 'in' ? 'Entrada' : 'Saída',
        e.status,
        `"${e.origin_label.replace(/"/g, '""')}"`,
        e.category,
        e.amount.toFixed(2),
      ].join(';'));
    });
    lines.push('');
    lines.push(`Entradas realizadas;${totals.realizedIn.toFixed(2)}`);
    lines.push(`Saídas realizadas;${totals.realizedOut.toFixed(2)}`);
    lines.push(`Saldo;${totals.realizedBalance.toFixed(2)}`);
    lines.push(`A receber;${totals.forecastIn.toFixed(2)}`);
    lines.push(`Atrasados;${totals.overdue.toFixed(2)}`);
    const blob = new Blob(['\uFEFF' + lines.join('\n')], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fluxo-caixa-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportPDF = () => {
    if (!data) return;
    const doc = new jsPDF();
    doc.setFontSize(16); doc.setFont('helvetica', 'bold');
    doc.text('Fluxo de Caixa', 14, 18);
    doc.setFontSize(10); doc.setFont('helvetica', 'normal');
    doc.text(`Período: ${periodLabel}`, 14, 25);

    autoTable(doc, {
      startY: 32,
      head: [['Indicador', 'Valor']],
      body: [
        ['Entradas realizadas', fmt(totals.realizedIn)],
        ['Saídas realizadas', fmt(totals.realizedOut)],
        ['Saldo do período', fmt(totals.realizedBalance)],
        ['A receber (previsto)', fmt(totals.forecastIn)],
        ['Atrasados', fmt(totals.overdue)],
      ],
      theme: 'striped',
      headStyles: { fillColor: [16, 185, 129] },
    });

    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 8,
      head: [['Data', 'Tipo', 'Status', 'Origem', 'Categoria', 'Valor']],
      body: data.entries.map(e => [
        format(new Date(e.date + 'T12:00:00'), 'dd/MM/yyyy'),
        e.type === 'in' ? 'Entrada' : 'Saída',
        e.status,
        e.origin_label,
        e.category,
        fmt(e.amount),
      ]),
      styles: { fontSize: 8 },
      headStyles: { fillColor: [30, 30, 30] },
    });

    doc.save(`fluxo-caixa-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
  };

  return (
    <AppLayout>
      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 max-w-6xl">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5 sm:mb-6">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-foreground">Fluxo de Caixa</h1>
            <p className="text-xs sm:text-sm text-muted-foreground">Entradas, saídas e projeção de caixa</p>
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
                <DropdownMenuItem onClick={exportCSV}><FileDown className="w-4 h-4 mr-2" /> CSV</DropdownMenuItem>
                <DropdownMenuItem onClick={exportPDF}><FileText className="w-4 h-4 mr-2" /> PDF</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 mb-5 sm:mb-6">
          {kpis.map(k => (
            <Card key={k.label} className="p-3 sm:p-4">
              <div className="flex items-center gap-3 min-w-0">
                <div className={`p-2 rounded-lg bg-secondary ${k.color} shrink-0`}>
                  <k.icon className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] sm:text-xs text-muted-foreground truncate">{k.label}</p>
                  <p className="text-sm font-bold text-foreground truncate">{k.value}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {totals.overdue > 0 && (
          <Card className="p-3 mb-4 border-red-500/40 bg-red-500/5 flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-red-500 shrink-0" />
            <div className="text-sm">
              <span className="font-semibold text-red-500">{fmt(totals.overdue)}</span>{' '}
              <span className="text-muted-foreground">em recebimentos atrasados no período.</span>
            </div>
          </Card>
        )}

        <Card className="p-3 sm:p-4 mb-5">
          <h2 className="text-sm font-semibold text-foreground mb-3">Evolução diária</h2>
          {isLoading ? (
            <div className="h-72 flex items-center justify-center text-muted-foreground text-sm">Carregando...</div>
          ) : (
            <CashFlowChart daily={data?.daily ?? []} />
          )}
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-5">
          <Card className="p-3 sm:p-4 lg:col-span-2">
            <h2 className="text-sm font-semibold text-foreground mb-3">Movimentações</h2>
            <CashFlowTable entries={data?.entries ?? []} />
          </Card>

          <Card className="p-3 sm:p-4">
            <h2 className="text-sm font-semibold text-foreground mb-3">Próximos 30 dias</h2>
            {(data?.upcoming ?? []).length === 0 ? (
              <p className="text-sm text-muted-foreground">Nada previsto.</p>
            ) : (
              <ul className="space-y-2">
                {data!.upcoming.map(u => (
                  <li key={u.id} className="flex items-center justify-between gap-2 text-sm border-b border-border pb-2 last:border-0">
                    <div className="min-w-0">
                      <p className="truncate font-medium">{u.origin_label}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(u.date + 'T12:00:00'), 'dd/MM/yyyy')}
                        {u.status === 'overdue' && <Badge variant="destructive" className="ml-2 text-[10px]">atrasado</Badge>}
                      </p>
                    </div>
                    <span className={`font-semibold ${u.status === 'overdue' ? 'text-red-600' : 'text-emerald-600'}`}>{fmt(u.amount)}</span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>
    </AppLayout>
  );
};

export default FluxoCaixa;
