import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Trash2, FileText, Edit2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import AppLayout from '@/components/AppLayout';
import { useQuotes, type Quote } from '@/hooks/useQuotes';

const statusLabels: Record<string, string> = { draft: 'Rascunho', pending: 'Enviado', approved: 'Aprovado', rejected: 'Recusado' };
const statusColors: Record<string, string> = {
  draft: 'bg-muted text-muted-foreground border-border',
  pending: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/30',
  approved: 'bg-green-500/10 text-green-600 border-green-500/30',
  rejected: 'bg-red-500/10 text-red-600 border-red-500/30',
};

const Orcamentos: React.FC = () => {
  const navigate = useNavigate();
  const { quotes, isLoading, deleteQuote } = useQuotes();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const filtered = quotes.filter(q => {
    const matchSearch = (q.clients?.name || '').toLowerCase().includes(search.toLowerCase()) ||
      (q.product_name || '').toLowerCase().includes(search.toLowerCase()) ||
      String((q as Quote & { quote_number?: number }).quote_number ?? '').includes(search);
    const matchStatus = statusFilter === 'all' || q.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const formatCurrency = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Orçamentos</h1>
            <p className="text-sm text-muted-foreground">{quotes.length} orçamento{quotes.length !== 1 ? 's' : ''}</p>
          </div>
          <Button onClick={() => navigate('/orcamentos/novo')}>
            <Plus className="w-4 h-4 mr-2" /> Novo Orçamento
          </Button>
        </div>

        <div className="flex gap-3 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Buscar por cliente, produto ou número..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="draft">Rascunhos</SelectItem>
              <SelectItem value="pending">Enviados</SelectItem>
              <SelectItem value="approved">Aprovados</SelectItem>
              <SelectItem value="rejected">Recusados</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground">Carregando...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">Nenhum orçamento encontrado.</div>
        ) : (
          <div className="space-y-3">
            {filtered.map(quote => {
              const num = (quote as Quote & { quote_number?: number }).quote_number;
              return (
                <Card key={quote.id} className="p-4 bg-card border-border hover:border-primary/40 transition-colors cursor-pointer" onClick={() => navigate(`/orcamentos/${quote.id}`)}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <FileText className="w-4 h-4 text-muted-foreground shrink-0" />
                        <h3 className="font-semibold text-foreground">
                          {num ? `ORC-${num}` : 'Sem número'}
                          {quote.product_name && <span className="text-muted-foreground font-normal"> · {quote.product_name}</span>}
                        </h3>
                        <Badge variant="outline" className={statusColors[quote.status] || statusColors.draft}>
                          {statusLabels[quote.status] || quote.status}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Cliente: <span className="text-foreground">{quote.clients?.name || '—'}</span>
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">{new Date(quote.created_at).toLocaleDateString('pt-BR')}</div>
                    </div>
                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <span className="text-lg font-bold text-foreground">{formatCurrency(quote.total_value)}</span>
                      <div className="flex gap-1" onClick={e => e.stopPropagation()}>
                        <Button size="sm" variant="outline" onClick={() => navigate(`/orcamentos/${quote.id}`)} title="Editar / Visualizar">
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive h-9 w-9">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent className="bg-card">
                            <AlertDialogHeader>
                              <AlertDialogTitle>Excluir orçamento?</AlertDialogTitle>
                              <AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction onClick={() => deleteQuote.mutate(quote.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Excluir</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default Orcamentos;
