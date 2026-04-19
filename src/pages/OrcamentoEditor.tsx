import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, FileDown, Package as PackageIcon, Plus, Trash2, X, UserPlus, CalendarIcon, Search, MessageCircle } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import AppLayout from '@/components/AppLayout';
import ClientForm from '@/components/gestao/ClientForm';
import ConvertToOrderModal, { type ConvertToOrderData } from '@/components/gestao/ConvertToOrderModal';
import { useClients } from '@/hooks/useClients';
import { useProducts, type Product } from '@/hooks/useProducts';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';
import { useCompanyProfile } from '@/hooks/useCompanyProfile';

interface QuoteItem {
  id: string;
  product_id?: string | null;
  name: string;
  quantity: number;
  unit_value: number;
}

const STATUS_OPTIONS = [
  { value: 'draft', label: 'Rascunho' },
  { value: 'pending', label: 'Enviado' },
  { value: 'approved', label: 'Aprovado' },
  { value: 'rejected', label: 'Recusado' },
];

const STATUS_BADGE: Record<string, string> = {
  draft: 'bg-muted text-muted-foreground border-border',
  pending: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/30',
  approved: 'bg-green-500/10 text-green-600 border-green-500/30',
  rejected: 'bg-red-500/10 text-red-600 border-red-500/30',
};

const formatCurrency = (v: number) => (Number.isFinite(v) ? v : 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const OrcamentoEditor: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();
  const { clients, createClient } = useClients();
  const { products } = useProducts();
  const { profile } = useCompanyProfile();

  const isNew = !id || id === 'novo';

  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [quoteId, setQuoteId] = useState<string | null>(isNew ? null : id!);
  const [quoteNumber, setQuoteNumber] = useState<number | null>(null);
  const [createdAt, setCreatedAt] = useState<string>(new Date().toISOString());
  const [status, setStatus] = useState('draft');

  const [clientId, setClientId] = useState<string>('');
  const [clientSearch, setClientSearch] = useState('');
  const [clientPopoverOpen, setClientPopoverOpen] = useState(false);
  const [newClientOpen, setNewClientOpen] = useState(false);

  const [items, setItems] = useState<QuoteItem[]>([]);
  const [productPickerOpen, setProductPickerOpen] = useState(false);
  const [productSearch, setProductSearch] = useState('');

  const [notes, setNotes] = useState('');
  const [validUntil, setValidUntil] = useState<Date | undefined>();

  const [discountValue, setDiscountValue] = useState('0');
  const [discountType, setDiscountType] = useState<'fixed' | 'percent'>('fixed');
  const [shippingValue, setShippingValue] = useState('0');

  const [convertModalOpen, setConvertModalOpen] = useState(false);
  const [converting, setConverting] = useState(false);

  // Load existing quote
  useEffect(() => {
    if (isNew) return;
    (async () => {
      const { data, error } = await supabase
        .from('quotes')
        .select('*')
        .eq('id', id!)
        .single();
      if (error) {
        toast({ title: 'Erro ao carregar orçamento', description: error.message, variant: 'destructive' });
        navigate('/orcamentos');
        return;
      }
      setQuoteId(data.id);
      setQuoteNumber(data.quote_number);
      setCreatedAt(data.created_at);
      setStatus(data.status === 'pending' && !(data.items as any)?.length ? data.status : data.status);
      setClientId(data.client_id);
      const loadedItems = Array.isArray(data.items) ? (data.items as unknown as QuoteItem[]) : [];
      setItems(loadedItems);
      setNotes(data.notes || data.description || '');
      setValidUntil(data.valid_until ? new Date(data.valid_until + 'T00:00:00') : undefined);
      setDiscountValue(String(data.discount_value ?? 0));
      setDiscountType((data.discount_type as 'fixed' | 'percent') || 'fixed');
      setShippingValue(String(data.shipping_value ?? 0));
      setLoading(false);
    })();
  }, [id, isNew, navigate, toast]);

  const selectedClient = clients.find(c => c.id === clientId);

  const filteredClients = useMemo(() => {
    const q = clientSearch.toLowerCase();
    return clients.filter(c => c.name.toLowerCase().includes(q) || c.cpf?.includes(clientSearch));
  }, [clients, clientSearch]);

  const filteredProducts = useMemo(() => {
    const q = productSearch.toLowerCase();
    return products.filter(p => p.name.toLowerCase().includes(q));
  }, [products, productSearch]);

  // Financial summary
  const subtotal = useMemo(() => items.reduce((s, i) => s + i.quantity * i.unit_value, 0), [items]);
  const discountAmount = useMemo(() => {
    const v = parseFloat(discountValue) || 0;
    if (discountType === 'percent') return Math.min(subtotal, subtotal * (v / 100));
    return Math.min(subtotal, v);
  }, [discountValue, discountType, subtotal]);
  const shippingAmount = parseFloat(shippingValue) || 0;
  const total = Math.max(0, subtotal - discountAmount + shippingAmount);

  const addProduct = (p: Product) => {
    setItems(prev => [...prev, {
      id: crypto.randomUUID(),
      product_id: p.id,
      name: p.name,
      quantity: p.default_quantity,
      unit_value: p.unit_price,
    }]);
    setProductPickerOpen(false);
    setProductSearch('');
  };

  const addBlankItem = () => {
    setItems(prev => [...prev, { id: crypto.randomUUID(), name: '', quantity: 1, unit_value: 0 }]);
    setProductPickerOpen(false);
  };

  const updateItem = (idx: number, patch: Partial<QuoteItem>) => {
    setItems(prev => prev.map((it, i) => i === idx ? { ...it, ...patch } : it));
  };

  const removeItem = (idx: number) => setItems(prev => prev.filter((_, i) => i !== idx));

  const handleClientCreated = (data: any) => {
    createClient.mutate(data, {
      onSuccess: (created) => {
        setClientId(created.id);
        setNewClientOpen(false);
      },
    });
  };

  const handleSave = async (overrideStatus?: string): Promise<string | null> => {
    if (!user) return null;
    if (!clientId) {
      toast({ title: 'Selecione um cliente', variant: 'destructive' });
      return null;
    }
    if (items.length === 0) {
      toast({ title: 'Adicione pelo menos um item', variant: 'destructive' });
      return null;
    }
    setSaving(true);
    try {
      const payload = {
        client_id: clientId,
        status: overrideStatus || status,
        items: items as any,
        subtotal,
        discount_value: parseFloat(discountValue) || 0,
        discount_type: discountType,
        shipping_value: shippingAmount,
        notes: notes || null,
        valid_until: validUntil ? format(validUntil, 'yyyy-MM-dd') : null,
        total_value: total,
        product_name: items[0]?.name || null,
        unit_value: items[0]?.unit_value || null,
        quantity: items.reduce((s, i) => s + i.quantity, 0),
        description: notes || null,
      };

      if (quoteId) {
        const { error } = await supabase.from('quotes').update(payload).eq('id', quoteId);
        if (error) throw error;
        if (overrideStatus) setStatus(overrideStatus);
        toast({ title: 'Orçamento salvo!' });
        qc.invalidateQueries({ queryKey: ['quotes'] });
        return quoteId;
      } else {
        const { data, error } = await supabase
          .from('quotes')
          .insert({ ...payload, user_id: user.id })
          .select()
          .single();
        if (error) throw error;
        setQuoteId(data.id);
        setQuoteNumber(data.quote_number);
        setCreatedAt(data.created_at);
        if (overrideStatus) setStatus(overrideStatus);
        toast({ title: 'Orçamento criado!' });
        qc.invalidateQueries({ queryKey: ['quotes'] });
        // update url silently
        window.history.replaceState(null, '', `/orcamentos/${data.id}`);
        return data.id;
      }
    } catch (e: any) {
      toast({ title: 'Erro ao salvar', description: e.message, variant: 'destructive' });
      return null;
    } finally {
      setSaving(false);
    }
  };

  const openConvertModal = () => {
    if (!quoteId) {
      toast({ title: 'Salve o orçamento primeiro', variant: 'destructive' });
      return;
    }
    setConvertModalOpen(true);
  };

  const handleConvertConfirm = async (data: ConvertToOrderData) => {
    if (!quoteId || !user) return;
    setConverting(true);
    try {
      // 1. Update or create client with form data
      let finalClientId = data.clientId;
      if (finalClientId) {
        await supabase.from('clients').update(data.formData).eq('id', finalClientId);
      } else {
        const { data: newClient, error: clientError } = await supabase
          .from('clients')
          .insert({ ...data.formData, name: data.formData.name!, user_id: user.id })
          .select()
          .single();
        if (clientError) throw clientError;
        finalClientId = newClient.id;
      }

      // 2. Update quote → approved + linked to client
      await supabase.from('quotes').update({
        status: 'approved',
        client_id: finalClientId,
      }).eq('id', quoteId);

      // 3. Create order
      const { error: orderError } = await supabase.from('orders').insert({
        user_id: user.id,
        client_id: finalClientId,
        quote_id: quoteId,
        status: data.status,
        kanban_position: 0,
      });
      if (orderError) throw orderError;

      // 4. Register received amount as a positive expense entry? No → just toast.
      setStatus('approved');
      setClientId(finalClientId);
      setConvertModalOpen(false);
      toast({
        title: 'Convertido em pedido!',
        description: `Recebido: ${formatCurrency(data.amountReceived)} · A receber: ${formatCurrency(Math.max(0, total - data.amountReceived))}`,
      });
      qc.invalidateQueries({ queryKey: ['quotes'] });
      qc.invalidateQueries({ queryKey: ['orders'] });
      qc.invalidateQueries({ queryKey: ['clients'] });
    } catch (e: any) {
      toast({ title: 'Erro ao converter', description: e.message, variant: 'destructive' });
    } finally {
      setConverting(false);
    }
  };

  const handleSendWhatsApp = () => {
    if (!selectedClient?.whatsapp) {
      toast({ title: 'Cliente sem WhatsApp', description: 'Cadastre um número de WhatsApp para o cliente.', variant: 'destructive' });
      return;
    }
    const phone = selectedClient.whatsapp.replace(/\D/g, '');
    const code = quoteNumber ? `ORC-${quoteNumber}` : 'Orçamento';
    const lines = [
      `Olá ${selectedClient.name}! Segue seu orçamento *${code}*:`,
      '',
      ...items.map(i => `• ${i.name} — ${i.quantity}x ${formatCurrency(i.unit_value)} = ${formatCurrency(i.quantity * i.unit_value)}`),
      '',
      `Subtotal: ${formatCurrency(subtotal)}`,
      discountAmount > 0 ? `Desconto: -${formatCurrency(discountAmount)}` : '',
      shippingAmount > 0 ? `Frete: +${formatCurrency(shippingAmount)}` : '',
      `*Total: ${formatCurrency(total)}*`,
      validUntil ? `\nVálido até: ${format(validUntil, 'dd/MM/yyyy')}` : '',
      notes ? `\nObservações: ${notes}` : '',
      profile?.company_name ? `\n— ${profile.company_name}` : '',
    ].filter(Boolean).join('\n');
    const url = `https://wa.me/55${phone}?text=${encodeURIComponent(lines)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleExportPDF = () => {
    const w = window.open('', '_blank');
    if (!w) return;
    const companyInfo = profile ? [
      profile.company_name,
      profile.company_document,
      profile.company_phone,
      profile.company_email,
      profile.company_cep,
      [profile.company_city, profile.company_state].filter(Boolean).join(' - '),
    ].filter(Boolean) : [];
    const companyHeader = profile ? `
      <div style="display:flex;align-items:flex-start;gap:16px;margin-bottom:24px;padding-bottom:16px;border-bottom:2px solid #e5e7eb;">
        ${profile.logo_url ? `<img src="${profile.logo_url}" style="width:64px;height:64px;object-fit:contain;" />` : ''}
        <div style="flex:1;">
          ${companyInfo[0] ? `<h2 style="margin:0;font-size:18px;">${companyInfo[0]}</h2>` : ''}
          <div style="margin-top:4px;font-size:12px;color:#666;line-height:1.5;">
            ${companyInfo.slice(1).map(v => `<div>${v}</div>`).join('')}
            ${profile.company_full_address ? `<div>${profile.company_full_address}</div>` : ''}
          </div>
        </div>
      </div>` : '';

    const itemsHtml = items.map(i => `
      <tr>
        <td>${i.name}</td>
        <td style="text-align:center;">${i.quantity}</td>
        <td style="text-align:right;">${formatCurrency(i.unit_value)}</td>
        <td style="text-align:right;font-weight:600;">${formatCurrency(i.quantity * i.unit_value)}</td>
      </tr>`).join('');

    w.document.write(`
      <html><head><title>Orçamento ORC-${quoteNumber || ''}</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 40px; color: #222; }
        table { width: 100%; border-collapse: collapse; margin-top: 16px; }
        th, td { text-align: left; padding: 8px 12px; border-bottom: 1px solid #e5e7eb; font-size:13px; }
        th { background: #f9fafb; font-size: 11px; text-transform: uppercase; color: #666; }
        .summary { margin-top: 24px; margin-left: auto; width: 280px; }
        .summary-row { display:flex; justify-content:space-between; padding:6px 0; font-size:13px; }
        .total-row { border-top: 2px solid #222; margin-top:8px; padding-top:8px; font-size:18px; font-weight:bold; }
      </style></head><body>
      ${companyHeader}
      <div style="display:flex;justify-content:space-between;align-items:flex-end;margin-bottom:8px;">
        <h1 style="font-size:22px;margin:0;">Orçamento ORC-${quoteNumber || '—'}</h1>
        <span style="font-size:13px;color:#666;">${new Date(createdAt).toLocaleDateString('pt-BR')}</span>
      </div>
      <p style="color:#666;font-size:13px;margin:4px 0 16px;">Cliente: <strong>${selectedClient?.name || '—'}</strong></p>
      <table>
        <thead><tr><th>Item</th><th style="text-align:center;">Qtd</th><th style="text-align:right;">Unit.</th><th style="text-align:right;">Total</th></tr></thead>
        <tbody>${itemsHtml}</tbody>
      </table>
      <div class="summary">
        <div class="summary-row"><span>Subtotal</span><span>${formatCurrency(subtotal)}</span></div>
        ${discountAmount > 0 ? `<div class="summary-row" style="color:#dc2626;"><span>Desconto</span><span>−${formatCurrency(discountAmount)}</span></div>` : ''}
        ${shippingAmount > 0 ? `<div class="summary-row" style="color:#16a34a;"><span>Frete</span><span>+${formatCurrency(shippingAmount)}</span></div>` : ''}
        <div class="summary-row total-row"><span>Total</span><span>${formatCurrency(total)}</span></div>
      </div>
      ${notes ? `<div style="margin-top:24px;padding:12px;background:#f9fafb;border-radius:6px;font-size:13px;"><strong>Observações:</strong><br/>${notes.replace(/\n/g, '<br/>')}</div>` : ''}
      ${validUntil ? `<p style="margin-top:16px;font-size:12px;color:#666;">Validade: ${format(validUntil, "dd/MM/yyyy")}</p>` : ''}
      <script>setTimeout(() => { window.print(); }, 300);</script>
      </body></html>
    `);
    w.document.close();
  };

  if (loading) {
    return <AppLayout><div className="p-8 text-center text-muted-foreground">Carregando...</div></AppLayout>;
  }

  const canConvert = !!quoteId && !!clientId && items.length > 0 && status !== 'approved';

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-6 max-w-6xl">
        <Button variant="ghost" onClick={() => navigate('/orcamentos')} className="mb-4 text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-4 h-4 mr-2" /> Voltar
        </Button>

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-bold text-foreground">
                {quoteNumber ? `ORC-${quoteNumber}` : 'Novo Orçamento'}
              </h1>
              <Badge variant="outline" className={STATUS_BADGE[status]}>
                {STATUS_OPTIONS.find(s => s.value === status)?.label}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              Criado em {format(new Date(createdAt), "d 'de' MMMM 'de' yyyy", { locale: ptBR })}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={handleSendWhatsApp} disabled={!quoteId || !selectedClient?.whatsapp} className="text-green-600 border-green-600/40 hover:bg-green-500/10 hover:text-green-700">
              <MessageCircle className="w-4 h-4 mr-2" /> Enviar WhatsApp
            </Button>
            <Button variant="outline" onClick={openConvertModal} disabled={!canConvert}>
              <PackageIcon className="w-4 h-4 mr-2" /> Converter para Pedido
            </Button>
            <Button variant="outline" onClick={handleExportPDF} disabled={!quoteId}>
              <FileDown className="w-4 h-4 mr-2" /> Exportar PDF
            </Button>
            <Button onClick={() => handleSave()} disabled={saving}>
              <Save className="w-4 h-4 mr-2" /> {saving ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left panel */}
          <div className="lg:col-span-2 space-y-4">
            {/* Cliente */}
            <Card className="p-4 bg-card border-border">
              <Label className="text-base font-semibold mb-3 block">Cliente</Label>
              <div className="flex gap-2">
                <Popover open={clientPopoverOpen} onOpenChange={setClientPopoverOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="flex-1 justify-start font-normal">
                      <Search className="w-4 h-4 mr-2 text-muted-foreground" />
                      {selectedClient ? selectedClient.name : 'Buscar cliente por nome ou documento...'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="p-0 w-[var(--radix-popover-trigger-width)] bg-card" align="start">
                    <div className="p-2 border-b border-border">
                      <Input autoFocus placeholder="Digite para buscar..." value={clientSearch} onChange={e => setClientSearch(e.target.value)} className="h-9" />
                    </div>
                    <div className="max-h-64 overflow-y-auto">
                      {filteredClients.length === 0 ? (
                        <div className="p-4 text-sm text-muted-foreground text-center">Nenhum cliente encontrado</div>
                      ) : filteredClients.map(c => (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => { setClientId(c.id); setClientPopoverOpen(false); setClientSearch(''); }}
                          className="w-full text-left px-3 py-2 hover:bg-accent text-sm border-b border-border/50 last:border-0"
                        >
                          <div className="font-medium text-foreground">{c.name}</div>
                          {c.cpf && <div className="text-xs text-muted-foreground">{c.cpf}</div>}
                        </button>
                      ))}
                    </div>
                  </PopoverContent>
                </Popover>
                {clientId && (
                  <Button variant="outline" size="icon" onClick={() => setClientId('')} title="Limpar">
                    <X className="w-4 h-4" />
                  </Button>
                )}
                <Button variant="outline" onClick={() => setNewClientOpen(true)} title="Novo cliente">
                  <UserPlus className="w-4 h-4" />
                </Button>
              </div>
              {selectedClient && (
                <div className="mt-2 text-xs text-muted-foreground">
                  {[selectedClient.email, selectedClient.whatsapp, selectedClient.city].filter(Boolean).join(' · ')}
                </div>
              )}
            </Card>

            {/* Itens */}
            <Card className="p-4 bg-card border-border">
              <div className="flex items-center justify-between mb-3">
                <Label className="text-base font-semibold">Itens do Orçamento</Label>
                <Button size="sm" variant="outline" onClick={() => setProductPickerOpen(true)}>
                  <Plus className="w-4 h-4 mr-1" /> Adicionar Item
                </Button>
              </div>
              {items.length === 0 ? (
                <div className="text-center py-8 text-sm text-muted-foreground">
                  Nenhum item adicionado. Clique em "Adicionar Item" para começar.
                </div>
              ) : (
                <div className="space-y-2">
                  {items.map((item, idx) => (
                    <div key={item.id} className="grid grid-cols-12 gap-2 items-end p-2 rounded-lg bg-muted/30 border border-border">
                      <div className="col-span-12 sm:col-span-5">
                        <Label className="text-xs">Produto</Label>
                        <Input value={item.name} onChange={e => updateItem(idx, { name: e.target.value })} placeholder="Nome do item" />
                      </div>
                      <div className="col-span-4 sm:col-span-2">
                        <Label className="text-xs">Qtd.</Label>
                        <Input type="number" min="1" value={item.quantity} onChange={e => updateItem(idx, { quantity: Math.max(1, parseInt(e.target.value) || 1) })} />
                      </div>
                      <div className="col-span-4 sm:col-span-2">
                        <Label className="text-xs">Valor Unit.</Label>
                        <Input type="number" step="0.01" min="0" value={item.unit_value} onChange={e => updateItem(idx, { unit_value: parseFloat(e.target.value) || 0 })} />
                      </div>
                      <div className="col-span-3 sm:col-span-2 text-right">
                        <Label className="text-xs">Total</Label>
                        <div className="h-12 flex items-center justify-end font-semibold text-foreground">
                          {formatCurrency(item.quantity * item.unit_value)}
                        </div>
                      </div>
                      <div className="col-span-1 sm:col-span-1 flex justify-end">
                        <Button variant="ghost" size="icon" onClick={() => removeItem(idx)} className="text-destructive hover:text-destructive">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {/* Observações */}
            <Card className="p-4 bg-card border-border space-y-4">
              <div>
                <Label className="text-base font-semibold mb-2 block">Observações</Label>
                <Textarea value={notes} onChange={e => setNotes(e.target.value)} rows={4} placeholder="Condições, prazos, formas de pagamento..." maxLength={1000} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label>Validade do Orçamento</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !validUntil && "text-muted-foreground")}>
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {validUntil ? format(validUntil, "PPP", { locale: ptBR }) : 'Selecione a data'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 bg-card" align="start">
                      <Calendar mode="single" selected={validUntil} onSelect={setValidUntil} initialFocus className={cn("p-3 pointer-events-auto")} />
                    </PopoverContent>
                  </Popover>
                </div>
                <div>
                  <Label>Status</Label>
                  <Select value={status} onValueChange={setStatus}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {STATUS_OPTIONS.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </Card>
          </div>

          {/* Right panel - Financial summary */}
          <div className="lg:col-span-1">
            <Card className="p-5 bg-card border-border lg:sticky lg:top-20 space-y-4">
              <h2 className="text-lg font-bold text-foreground">Resumo Financeiro</h2>

              <div className="flex justify-between items-baseline">
                <div>
                  <div className="text-sm text-muted-foreground">Subtotal</div>
                  <div className="text-xs text-muted-foreground">{items.length} {items.length === 1 ? 'item' : 'itens'}</div>
                </div>
                <div className="text-lg font-semibold text-foreground">{formatCurrency(subtotal)}</div>
              </div>

              <div className="border-t border-border pt-3 space-y-2">
                <Label className="text-sm">Desconto</Label>
                <div className="flex gap-2">
                  <Input type="number" step="0.01" min="0" value={discountValue} onChange={e => setDiscountValue(e.target.value)} className="flex-1" />
                  <Select value={discountType} onValueChange={(v: 'fixed' | 'percent') => setDiscountType(v)}>
                    <SelectTrigger className="w-20"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fixed">R$</SelectItem>
                      <SelectItem value="percent">%</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {discountAmount > 0 && (
                  <div className="text-right text-sm font-semibold text-red-500">−{formatCurrency(discountAmount)}</div>
                )}
              </div>

              <div className="border-t border-border pt-3 space-y-2">
                <Label className="text-sm">Frete (opcional)</Label>
                <Input type="number" step="0.01" min="0" value={shippingValue} onChange={e => setShippingValue(e.target.value)} />
                {shippingAmount > 0 && (
                  <div className="text-right text-sm font-semibold text-green-600">+{formatCurrency(shippingAmount)}</div>
                )}
              </div>

              <div className="border-t-2 border-foreground pt-3 flex justify-between items-baseline">
                <div className="text-sm font-semibold text-foreground">Total</div>
                <div className="text-2xl font-bold text-foreground">{formatCurrency(total)}</div>
              </div>
            </Card>
          </div>
        </div>

        {/* Product picker */}
        <Dialog open={productPickerOpen} onOpenChange={setProductPickerOpen}>
          <DialogContent className="max-w-md bg-card">
            <DialogHeader><DialogTitle>Adicionar Item</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input autoFocus value={productSearch} onChange={e => setProductSearch(e.target.value)} placeholder="Buscar produto..." className="pl-10" />
              </div>
              <div className="max-h-72 overflow-y-auto space-y-1">
                {filteredProducts.length === 0 ? (
                  <div className="text-center py-6 text-sm text-muted-foreground">
                    {products.length === 0 ? 'Nenhum produto cadastrado.' : 'Nenhum produto encontrado.'}
                  </div>
                ) : filteredProducts.map(p => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => addProduct(p)}
                    className="w-full text-left px-3 py-2 rounded-md hover:bg-accent border border-border"
                  >
                    <div className="flex justify-between items-center">
                      <div className="font-medium text-foreground">{p.name}</div>
                      <div className="text-sm font-semibold text-foreground">{formatCurrency(p.unit_price)}</div>
                    </div>
                    {p.description && <div className="text-xs text-muted-foreground line-clamp-1">{p.description}</div>}
                  </button>
                ))}
              </div>
              <div className="flex justify-between pt-2 border-t border-border">
                <Button variant="ghost" size="sm" onClick={() => navigate('/produtos')}>Gerenciar produtos</Button>
                <Button variant="outline" size="sm" onClick={addBlankItem}>+ Item livre</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* New client */}
        <ClientForm
          open={newClientOpen}
          onOpenChange={setNewClientOpen}
          onSubmit={handleClientCreated}
          initialData={null}
          isLoading={createClient.isPending}
        />
      </div>
    </AppLayout>
  );
};

export default OrcamentoEditor;
