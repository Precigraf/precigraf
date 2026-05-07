import React, { useMemo, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import AppLayout from '@/components/AppLayout';
import { useReceivables, type Receivable } from '@/hooks/useReceivables';
import { CheckCircle2, Clock, AlertCircle, DollarSign } from 'lucide-react';

const fmt = (v: number) => (Number.isFinite(v) ? v : 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const STATUS_LABEL: Record<string, string> = { pendente: 'Pendente', parcial: 'Parcial', pago: 'Pago', atrasado: 'Atrasado' };
const STATUS_COLOR: Record<string, string> = {
  pendente: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/30',
  parcial: 'bg-blue-500/10 text-blue-600 border-blue-500/30',
  pago: 'bg-green-500/10 text-green-600 border-green-500/30',
  atrasado: 'bg-red-500/10 text-red-600 border-red-500/30',
};

const ContasReceber: React.FC = () => {
  const { items, registerPayment } = useReceivables();
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [paymentTarget, setPaymentTarget] = useState<Receivable | null>(null);
  const [paymentAmount, setPaymentAmount] = useState('');

  const today = new Date().toISOString().split('T')[0];
  const enriched = useMemo(
    () =>
      items.map((r) => ({
        ...r,
        effectiveStatus: r.status === 'pendente' && r.due_date < today ? 'atrasado' : r.status,
      })),
    [items, today]
  );

  const filtered = enriched.filter((r) => statusFilter === 'all' || r.effectiveStatus === statusFilter);

  const totals = useMemo(() => {
    const pending = enriched.filter((r) => r.effectiveStatus === 'pendente' || r.effectiveStatus === 'parcial');
    const overdue = enriched.filter((r) => r.effectiveStatus === 'atrasado');
    const paid = enriched.filter((r) => r.effectiveStatus === 'pago');
    return {
      pending: pending.reduce((s, r) => s + (Number(r.amount) - Number(r.amount_paid)), 0),
      overdue: overdue.reduce((s, r) => s + (Number(r.amount) - Number(r.amount_paid)), 0),
      paid: paid.reduce((s, r) => s + Number(r.amount_paid), 0),
    };
  }, [enriched]);

  const submitPayment = () => {
    if (!paymentTarget) return;
    const amt = parseFloat(paymentAmount);
    if (!amt || amt <= 0) return;
    registerPayment.mutate({ id: paymentTarget.id, amount: amt });
    setPaymentTarget(null);
    setPaymentAmount('');
  };

  return (
    <AppLayout>
      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 max-w-6xl">
        <div className="mb-5">
          <h1 className="text-xl sm:text-2xl font-bold">Contas a Receber</h1>
          <p className="text-xs sm:text-sm text-muted-foreground">{items.length} parcela(s)</p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3 mb-5">
          <Card className="p-3 sm:p-4 bg-card border-border">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-yellow-500" />
              <p className="text-[11px] text-muted-foreground">A receber</p>
            </div>
            <p className="text-lg font-bold mt-1">{fmt(totals.pending)}</p>
          </Card>
          <Card className="p-3 sm:p-4 bg-card border-border">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-500" />
              <p className="text-[11px] text-muted-foreground">Atrasado</p>
            </div>
            <p className="text-lg font-bold mt-1 text-red-600">{fmt(totals.overdue)}</p>
          </Card>
          <Card className="p-3 sm:p-4 bg-card border-border">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-500" />
              <p className="text-[11px] text-muted-foreground">Recebido</p>
            </div>
            <p className="text-lg font-bold mt-1 text-green-600">{fmt(totals.paid)}</p>
          </Card>
        </div>

        <div className="mb-3">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="pendente">Pendentes</SelectItem>
              <SelectItem value="parcial">Parciais</SelectItem>
              <SelectItem value="atrasado">Atrasados</SelectItem>
              <SelectItem value="pago">Pagos</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Card className="bg-card border-border overflow-hidden">
          <div className="overflow-x-auto">
            <Table className="min-w-[720px]">
              <TableHeader>
                <TableRow>
                  <TableHead>Pedido</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Vencimento</TableHead>
                  <TableHead>Parcela</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                  <TableHead className="text-right">Pago</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      Nenhuma conta encontrada.
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell>{r.orders?.order_number ? `#${r.orders.order_number}` : '—'}</TableCell>
                      <TableCell>{r.orders?.clients?.name || '—'}</TableCell>
                      <TableCell>{new Date(r.due_date + 'T00:00:00').toLocaleDateString('pt-BR')}</TableCell>
                      <TableCell>{r.installment_number}/{r.installment_total}</TableCell>
                      <TableCell className="text-right font-medium">{fmt(Number(r.amount))}</TableCell>
                      <TableCell className="text-right text-muted-foreground">{fmt(Number(r.amount_paid))}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={STATUS_COLOR[r.effectiveStatus]}>
                          {STATUS_LABEL[r.effectiveStatus]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {r.effectiveStatus !== 'pago' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setPaymentTarget(r);
                              setPaymentAmount(String(Number(r.amount) - Number(r.amount_paid)));
                            }}
                          >
                            <DollarSign className="w-3 h-3 mr-1" /> Receber
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </Card>
      </div>

      <Dialog open={!!paymentTarget} onOpenChange={(o) => !o && setPaymentTarget(null)}>
        <DialogContent className="bg-card max-w-sm">
          <DialogHeader>
            <DialogTitle>Registrar pagamento</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="text-sm text-muted-foreground">
              Restante: <span className="text-foreground font-semibold">{paymentTarget ? fmt(Number(paymentTarget.amount) - Number(paymentTarget.amount_paid)) : ''}</span>
            </div>
            <div>
              <Label>Valor recebido</Label>
              <Input type="number" step="0.01" value={paymentAmount} onChange={(e) => setPaymentAmount(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPaymentTarget(null)}>Cancelar</Button>
            <Button onClick={submitPayment}>Confirmar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
};

export default ContasReceber;
