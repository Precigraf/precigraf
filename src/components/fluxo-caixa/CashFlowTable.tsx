import React, { useMemo, useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowDownCircle, ArrowUpCircle } from 'lucide-react';
import { format } from 'date-fns';
import type { CashFlowEntry } from '@/hooks/useCashFlow';

const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

type FType = 'all' | 'in' | 'out';
type FStatus = 'all' | 'realized' | 'forecast' | 'overdue';

const statusBadge = (s: CashFlowEntry['status']) => {
  if (s === 'realized') return <Badge className="bg-emerald-600 hover:bg-emerald-600">Realizado</Badge>;
  if (s === 'overdue') return <Badge variant="destructive">Atrasado</Badge>;
  return <Badge variant="secondary">Previsto</Badge>;
};

const CashFlowTable: React.FC<{ entries: CashFlowEntry[] }> = ({ entries }) => {
  const [search, setSearch] = useState('');
  const [type, setType] = useState<FType>('all');
  const [status, setStatus] = useState<FStatus>('all');

  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase();
    return entries.filter(e =>
      (type === 'all' || e.type === type) &&
      (status === 'all' || e.status === status) &&
      (!s || e.origin_label.toLowerCase().includes(s) || e.category.toLowerCase().includes(s))
    );
  }, [entries, search, type, status]);

  return (
    <div className="space-y-3">
      <div className="flex flex-col sm:flex-row gap-2">
        <Input placeholder="Buscar cliente, pedido, despesa..." value={search} onChange={e => setSearch(e.target.value)} className="sm:max-w-xs" />
        <Select value={type} onValueChange={(v) => setType(v as FType)}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os tipos</SelectItem>
            <SelectItem value="in">Entradas</SelectItem>
            <SelectItem value="out">Saídas</SelectItem>
          </SelectContent>
        </Select>
        <Select value={status} onValueChange={(v) => setStatus(v as FStatus)}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os status</SelectItem>
            <SelectItem value="realized">Realizado</SelectItem>
            <SelectItem value="forecast">Previsto</SelectItem>
            <SelectItem value="overdue">Atrasado</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="overflow-x-auto">
        <Table className="min-w-[760px]">
          <TableHeader>
            <TableRow>
              <TableHead className="w-28">Data</TableHead>
              <TableHead className="w-16">Tipo</TableHead>
              <TableHead>Origem</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Valor</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Nenhuma movimentação.</TableCell></TableRow>
            ) : filtered.map(e => (
              <TableRow key={e.id}>
                <TableCell className="text-sm">{format(new Date(e.date + 'T12:00:00'), 'dd/MM/yyyy')}</TableCell>
                <TableCell>
                  {e.type === 'in'
                    ? <ArrowDownCircle className="w-4 h-4 text-emerald-500" />
                    : <ArrowUpCircle className="w-4 h-4 text-red-500" />}
                </TableCell>
                <TableCell className="text-sm">{e.origin_label}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{e.category}</TableCell>
                <TableCell>{statusBadge(e.status)}</TableCell>
                <TableCell className={`text-right font-semibold ${e.type === 'in' ? 'text-emerald-600' : 'text-red-600'}`}>
                  {e.type === 'in' ? '+' : '−'} {fmt(e.amount)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default CashFlowTable;
