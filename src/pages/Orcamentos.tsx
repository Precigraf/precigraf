import React, { useState } from 'react';
import { Plus, Search, Check, X, Trash2, FileText, Eye, FileDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import AppLayout from '@/components/AppLayout';
import QuoteForm from '@/components/gestao/QuoteForm';
import { useQuotes } from '@/hooks/useQuotes';
import { useClients } from '@/hooks/useClients';
import { useCompanyProfile } from '@/hooks/useCompanyProfile';

const statusLabels: Record<string, string> = { pending: 'Pendente', approved: 'Aprovado', rejected: 'Recusado' };
const statusColors: Record<string, string> = { pending: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/30', approved: 'bg-green-500/10 text-green-600 border-green-500/30', rejected: 'bg-red-500/10 text-red-600 border-red-500/30' };

const Orcamentos: React.FC = () => {
  const { quotes, isLoading, createQuote, approveQuote, rejectQuote, deleteQuote } = useQuotes();
  const { clients } = useClients();
  const { profile } = useCompanyProfile();
  const [formOpen, setFormOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const filtered = quotes.filter(q => {
    const matchSearch = (q.clients?.name || '').toLowerCase().includes(search.toLowerCase()) ||
      (q.product_name || '').toLowerCase().includes(search.toLowerCase());
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
          <Button onClick={() => setFormOpen(true)} disabled={clients.length === 0}>
            <Plus className="w-4 h-4 mr-2" /> Novo Orçamento
          </Button>
        </div>

        {clients.length === 0 && (
          <div className="bg-warning/10 border border-warning/30 rounded-lg p-4 mb-4 text-sm text-warning">
            Cadastre um cliente primeiro para poder criar orçamentos.
          </div>
        )}

        <div className="flex gap-3 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Buscar por cliente ou produto..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="pending">Pendentes</SelectItem>
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
            {filtered.map(quote => (
              <Card key={quote.id} className="p-4 bg-card border-border">
                {/* Company header */}
                {profile && (profile.company_name || profile.store_name || profile.logo_url) && (
                  <div className="flex items-center gap-3 mb-3 pb-3 border-b border-border">
                    {profile.logo_url && (
                      <img src={profile.logo_url} alt="Logo" className="w-8 h-8 object-contain rounded" />
                    )}
                    <div className="text-xs text-muted-foreground">
                      <p className="font-semibold text-foreground text-sm">{profile.store_name || profile.company_name}</p>
                      {profile.company_document && <span>{profile.company_document}</span>}
                      {profile.company_phone && <span> · {profile.company_phone}</span>}
                      {profile.company_email && <span> · {profile.company_email}</span>}
                      {profile.company_city && profile.company_state && (
                        <span> · {profile.company_city}/{profile.company_state}</span>
                      )}
                    </div>
                  </div>
                )}

                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <FileText className="w-4 h-4 text-muted-foreground shrink-0" />
                      <h3 className="font-semibold text-foreground truncate">{quote.product_name || 'Sem nome'}</h3>
                      <Badge variant="outline" className={statusColors[quote.status]}>{statusLabels[quote.status]}</Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Cliente: <span className="text-foreground">{quote.clients?.name || '—'}</span>
                      {quote.quantity && <> · Qtd: {quote.quantity}</>}
                    </div>
                    {quote.description && <p className="text-sm text-muted-foreground mt-1 line-clamp-1">{quote.description}</p>}
                    <div className="text-xs text-muted-foreground mt-1">{new Date(quote.created_at).toLocaleDateString('pt-BR')}</div>
                  </div>
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <span className="text-lg font-bold text-foreground">{formatCurrency(quote.total_value)}</span>
                    <div className="flex gap-1">
                      {quote.status === 'pending' && (
                        <>
                          <Button size="sm" variant="outline" className="text-green-600 border-green-500/30 hover:bg-green-500/10" onClick={() => approveQuote.mutate(quote.id)}>
                            <Check className="w-4 h-4 mr-1" /> Aprovar
                          </Button>
                          <Button size="sm" variant="outline" className="text-red-600 border-red-500/30 hover:bg-red-500/10" onClick={() => rejectQuote.mutate(quote.id)}>
                            <X className="w-4 h-4 mr-1" /> Recusar
                          </Button>
                        </>
                      )}
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive h-8 w-8">
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
            ))}
          </div>
        )}

        <QuoteForm open={formOpen} onOpenChange={setFormOpen} clients={clients} onSubmit={data => {
          createQuote.mutate(data, { onSuccess: () => setFormOpen(false) });
        }} isLoading={createQuote.isPending} />
      </div>
    </AppLayout>
  );
};

export default Orcamentos;
