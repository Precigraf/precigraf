import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Trash2, FileText, Eye, FileDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import AppLayout from '@/components/AppLayout';
import { useQuotes } from '@/hooks/useQuotes';
import { useClients } from '@/hooks/useClients';
import { useCompanyProfile } from '@/hooks/useCompanyProfile';

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
  const { clients } = useClients();
  const { profile } = useCompanyProfile();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [viewQuote, setViewQuote] = useState<any>(null);
  

  const filtered = quotes.filter(q => {
    const matchSearch = (q.clients?.name || '').toLowerCase().includes(search.toLowerCase()) ||
      (q.product_name || '').toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || q.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const formatCurrency = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const handleGeneratePDF = (quote: any) => {
    const w = window.open('', '_blank');
    if (!w) return;
    const companyHeader = profile ? `
      <div style="display:flex;align-items:center;gap:16px;margin-bottom:24px;padding-bottom:16px;border-bottom:2px solid #e5e7eb;">
        ${profile.logo_url ? `<img src="${profile.logo_url}" style="width:60px;height:60px;object-fit:contain;" />` : ''}
        <div>
          <h2 style="margin:0;font-size:18px;">${profile.store_name || profile.company_name || ''}</h2>
          <p style="margin:4px 0 0;font-size:12px;color:#666;">
            ${[profile.company_document, profile.company_phone, profile.company_email].filter(Boolean).join(' · ')}
          </p>
          ${profile.company_city && profile.company_state ? `<p style="margin:2px 0 0;font-size:12px;color:#666;">${profile.company_address || ''}${profile.company_address_number ? ', ' + profile.company_address_number : ''} - ${profile.company_neighborhood || ''} - ${profile.company_city}/${profile.company_state}</p>` : ''}
        </div>
      </div>
    ` : '';

    w.document.write(`
      <html><head><title>Orçamento</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 40px; color: #222; }
        table { width: 100%; border-collapse: collapse; margin-top: 16px; }
        th, td { text-align: left; padding: 8px 12px; border-bottom: 1px solid #e5e7eb; }
        th { background: #f9fafb; font-size: 12px; text-transform: uppercase; color: #666; }
        .total { font-size: 20px; font-weight: bold; margin-top: 24px; text-align: right; }
        .status { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; }
        .status-pending { background: #fef3c7; color: #d97706; }
        .status-approved { background: #dcfce7; color: #16a34a; }
        .status-rejected { background: #fee2e2; color: #dc2626; }
      </style></head><body>
      ${companyHeader}
      <h1 style="font-size:22px;margin-bottom:4px;">Orçamento</h1>
      <p style="color:#666;font-size:13px;">Data: ${new Date(quote.created_at).toLocaleDateString('pt-BR')}</p>
      <span class="status status-${quote.status}">${statusLabels[quote.status]}</span>
      <table>
        <tr><th>Cliente</th><td>${quote.clients?.name || '—'}</td></tr>
        <tr><th>Produto</th><td>${quote.product_name || '—'}</td></tr>
        ${quote.quantity ? `<tr><th>Quantidade</th><td>${quote.quantity}</td></tr>` : ''}
        ${quote.unit_value ? `<tr><th>Valor Unitário</th><td>${formatCurrency(quote.unit_value)}</td></tr>` : ''}
        ${quote.description ? `<tr><th>Descrição</th><td>${quote.description}</td></tr>` : ''}
      </table>
      <div class="total">Total: ${formatCurrency(quote.total_value)}</div>
      <script>setTimeout(() => { window.print(); }, 300);</script>
      </body></html>
    `);
    w.document.close();
  };

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
                      <Button size="sm" variant="outline" onClick={() => setViewQuote(quote)} title="Visualizar">
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleGeneratePDF(quote)} title="Gerar PDF">
                        <FileDown className="w-4 h-4" />
                      </Button>
                      {quote.status === 'pending' && (
                        <>
                          <Button size="sm" variant="outline" className="text-green-600 border-green-500/30 hover:bg-green-500/10" onClick={() => approveQuote.mutate(quote.id)}>
                            <Check className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="outline" className="text-red-600 border-red-500/30 hover:bg-red-500/10" onClick={() => rejectQuote.mutate(quote.id)}>
                            <X className="w-4 h-4" />
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

        {/* View Quote Modal */}
        <Dialog open={!!viewQuote} onOpenChange={(open) => !open && setViewQuote(null)}>
          <DialogContent className="max-w-lg bg-card">
            <DialogHeader>
              <DialogTitle>Detalhes do Orçamento</DialogTitle>
            </DialogHeader>
            {viewQuote && (
              <div className="space-y-4">
                {profile && (profile.store_name || profile.company_name || profile.logo_url) && (
                  <div className="flex items-center gap-3 pb-3 border-b border-border">
                    {profile.logo_url && <img src={profile.logo_url} alt="Logo" className="w-10 h-10 object-contain rounded" />}
                    <div>
                      <p className="font-semibold text-foreground">{profile.store_name || profile.company_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {[profile.company_document, profile.company_phone, profile.company_email].filter(Boolean).join(' · ')}
                      </p>
                    </div>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div><span className="text-muted-foreground">Cliente:</span> <span className="font-medium text-foreground">{viewQuote.clients?.name || '—'}</span></div>
                  <div><span className="text-muted-foreground">Status:</span> <Badge variant="outline" className={statusColors[viewQuote.status]}>{statusLabels[viewQuote.status]}</Badge></div>
                  <div><span className="text-muted-foreground">Produto:</span> <span className="font-medium text-foreground">{viewQuote.product_name || '—'}</span></div>
                  <div><span className="text-muted-foreground">Data:</span> <span className="font-medium text-foreground">{new Date(viewQuote.created_at).toLocaleDateString('pt-BR')}</span></div>
                  {viewQuote.quantity && <div><span className="text-muted-foreground">Quantidade:</span> <span className="font-medium text-foreground">{viewQuote.quantity}</span></div>}
                  {viewQuote.unit_value && <div><span className="text-muted-foreground">Valor Unit.:</span> <span className="font-medium text-foreground">{formatCurrency(viewQuote.unit_value)}</span></div>}
                </div>
                {viewQuote.description && (
                  <div className="text-sm">
                    <span className="text-muted-foreground">Descrição:</span>
                    <p className="mt-1 text-foreground">{viewQuote.description}</p>
                  </div>
                )}
                <div className="pt-3 border-t border-border text-right">
                  <span className="text-muted-foreground text-sm">Total: </span>
                  <span className="text-xl font-bold text-foreground">{formatCurrency(viewQuote.total_value)}</span>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => handleGeneratePDF(viewQuote)}>
                    <FileDown className="w-4 h-4 mr-2" /> Gerar PDF
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        <QuoteForm open={formOpen} onOpenChange={setFormOpen} clients={clients} onSubmit={data => {
          createQuote.mutate(data, { onSuccess: () => setFormOpen(false) });
        }} isLoading={createQuote.isPending} />
      </div>
    </AppLayout>
  );
};

export default Orcamentos;
