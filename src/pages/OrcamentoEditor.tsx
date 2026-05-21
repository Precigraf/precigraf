import React, { useState, useEffect, useMemo } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, FileDown, Package as PackageIcon, Plus, Trash2, X, UserPlus, CalendarIcon, Search, MessageCircle, Link2 } from 'lucide-react';
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
import { useCategories } from '@/hooks/useCategories';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';
import { useCompanyProfile } from '@/hooks/useCompanyProfile';
import { buildQuoteApprovalUrl } from '@/lib/publicUrl';


interface QuoteItem {
  id: string;
  product_id?: string | null;
  name: string;
  description?: string;
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
  const { categories } = useCategories();
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
  const [productFilterCat, setProductFilterCat] = useState<string | null>(null);
  const [tierPickerProduct, setTierPickerProduct] = useState<Product | null>(null);

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

  // Realtime: sync status when client responds via public link
  useEffect(() => {
    if (!quoteId) return;
    const channel = supabase
      .channel(`quote-${quoteId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'quotes', filter: `id=eq.${quoteId}` },
        (payload) => {
          const next = (payload.new as { status?: string } | null)?.status;
          if (!next) return;
          setStatus((prev) => {
            if (prev === next) return prev;
            if (next === 'approved') toast({ title: 'Cliente aprovou o orçamento' });
            else if (next === 'rejected') toast({ title: 'Cliente recusou o orçamento', variant: 'destructive' });
            else if (next === 'ajustes_solicitados') toast({ title: 'Cliente solicitou ajustes' });
            qc.invalidateQueries({ queryKey: ['quotes'] });
            qc.invalidateQueries({ queryKey: ['orders'] });
            qc.invalidateQueries({ queryKey: ['receivables'] });
            return next;
          });
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [quoteId, toast, qc]);

  const selectedClient = clients.find(c => c.id === clientId);

  const filteredClients = useMemo(() => {
    const q = clientSearch.toLowerCase();
    return clients.filter(c => c.name.toLowerCase().includes(q) || c.cpf?.includes(clientSearch));
  }, [clients, clientSearch]);

  const filteredProducts = useMemo(() => {
    const q = productSearch.toLowerCase();
    return products.filter(p => {
      if (productFilterCat && p.category_id !== productFilterCat) return false;
      return p.name.toLowerCase().includes(q);
    });
  }, [products, productSearch, productFilterCat]);

  // Financial summary
  const subtotal = useMemo(() => items.reduce((s, i) => s + i.quantity * i.unit_value, 0), [items]);
  const discountAmount = useMemo(() => {
    const v = parseFloat(discountValue) || 0;
    if (discountType === 'percent') return Math.min(subtotal, subtotal * (v / 100));
    return Math.min(subtotal, v);
  }, [discountValue, discountType, subtotal]);
  const shippingAmount = parseFloat(shippingValue) || 0;
  const total = Math.max(0, subtotal - discountAmount + shippingAmount);

  const insertProductWithTier = (p: Product, tier: { quantity: number; price: number }) => {
    const qty = Math.max(1, tier.quantity);
    const unitVal = qty > 0 ? tier.price / qty : tier.price;
    setItems(prev => [...prev, {
      id: crypto.randomUUID(),
      product_id: p.id,
      name: p.name,
      description: p.description || '',
      quantity: qty,
      unit_value: unitVal,
    }]);
    setProductPickerOpen(false);
    setTierPickerProduct(null);
    setProductSearch('');
  };

  const addProduct = (p: Product) => {
    const tiers = Array.isArray(p.price_tiers) ? (p.price_tiers as any[]) : [];

    if (tiers.length > 1) {
      // Multiple variations: open tier picker
      setTierPickerProduct(p);
      return;
    }

    // Single tier or fallback to legacy unit_price
    const tier = tiers[0];
    if (tier && tier.price && tier.quantity) {
      insertProductWithTier(p, { quantity: tier.quantity, price: tier.price });
    } else {
      insertProductWithTier(p, { quantity: p.default_quantity, price: p.unit_price * p.default_quantity });
    }
  };

  const addBlankItem = () => {
    setItems(prev => [...prev, { id: crypto.randomUUID(), name: '', quantity: 1, unit_value: 0 }]);
    setProductPickerOpen(false);
  };

  const updateItem = (idx: number, patch: Partial<QuoteItem>) => {
    setItems(prev => prev.map((it, i) => {
      if (i !== idx) return it;
      const merged = { ...it, ...patch };
      // Auto re-match tier when quantity changes on a product-linked item
      if (patch.quantity !== undefined && it.product_id) {
        const product = products.find(p => p.id === it.product_id);
        const tiers = Array.isArray(product?.price_tiers) ? (product!.price_tiers as any[]) : [];
        const matchingTier = tiers.find((t: any) => Number(t.quantity) === Number(patch.quantity));
        if (matchingTier && matchingTier.price && matchingTier.quantity) {
          merged.unit_value = Number(matchingTier.price) / Number(matchingTier.quantity);
        }
      }
      return merged;
    }));
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

      // 3. Calculate costs from product data
      let orderTotalRevenue = total;
      let orderTotalCost = 0;
      
      for (const item of items) {
        if (item.product_id) {
          const product = products.find(p => p.id === item.product_id);
          if (product) {
            // Check price_tiers for cost at this quantity
            const tiers = Array.isArray(product.price_tiers) ? (product.price_tiers as any[]) : [];
            const matchingTier = tiers.find((t: any) => t.quantity === item.quantity);
            const costPerUnit = matchingTier?.cost ? matchingTier.cost / item.quantity : product.cost / Math.max(1, product.default_quantity);
            orderTotalCost += costPerUnit * item.quantity;
          }
        }
      }

      // 4. Create order with financial data
      const { data: createdOrder, error: orderError } = await supabase.from('orders').insert({
        user_id: user.id,
        client_id: finalClientId,
        quote_id: quoteId,
        status: 'in_production',
        kanban_position: 0,
        total_revenue: orderTotalRevenue,
        total_cost: orderTotalCost + shippingAmount,
        amount_received: data.amountReceived,
        amount_pending: Math.max(0, orderTotalRevenue - data.amountReceived),
      }).select().single();
      if (orderError) throw orderError;

      // 5. Update local state and notify
      setStatus('approved');
      setClientId(finalClientId);
      setConvertModalOpen(false);
      toast({
        title: 'Pedido criado em Produção!',
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
      ...items.flatMap(i => [
        `• ${i.name} — ${i.quantity}x ${formatCurrency(i.unit_value)} = ${formatCurrency(i.quantity * i.unit_value)}`,
        ...(i.description ? [`   _${i.description.replace(/\n/g, ' ')}_`] : []),
      ]),
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

  const handleExportPDF = async () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    let y = 14;

    // Load logo if available
    if (profile?.logo_url) {
      try {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        await new Promise<void>((resolve, reject) => {
          img.onload = () => resolve();
          img.onerror = () => reject();
          img.src = profile.logo_url!;
        });
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        canvas.getContext('2d')!.drawImage(img, 0, 0);
        const logoData = canvas.toDataURL('image/png');
        // Preserve aspect ratio (vertical or horizontal) and apply user-defined scale
        const scale = (profile as any).logo_scale && Number((profile as any).logo_scale) > 0
          ? Number((profile as any).logo_scale)
          : 1;
        const baseH = 18; // mm
        const maxH = baseH * scale;
        const maxW = 40 * scale; // mm
        const ratio = img.width / img.height || 1;
        let logoH = maxH;
        let logoW = logoH * ratio;
        if (logoW > maxW) {
          logoW = maxW;
          logoH = logoW / ratio;
        }
        doc.addImage(logoData, 'PNG', 14, y, logoW, logoH);
        // Company info next to logo
        const infoX = 14 + logoW + 4;
        if (profile.company_name) {
          doc.setFontSize(14);
          doc.setFont('helvetica', 'bold');
          doc.text(profile.company_name, infoX, y + 6);
        }
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100, 100, 100);
        const infoLines = [profile.company_document, profile.company_phone, profile.company_email, profile.company_full_address].filter(Boolean) as string[];
        infoLines.forEach((line, i) => doc.text(line, infoX, y + 12 + i * 4));
        y += Math.max(logoH + 4, 12 + infoLines.length * 4 + 4);
      } catch {
        // Logo failed to load, render text-only header
        if (profile.company_name) {
          doc.setFontSize(14);
          doc.setFont('helvetica', 'bold');
          doc.text(profile.company_name, 14, y + 6);
          y += 10;
        }
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100, 100, 100);
        const infoLines = [profile.company_document, profile.company_phone, profile.company_email, profile.company_full_address].filter(Boolean) as string[];
        infoLines.forEach((line, i) => doc.text(line, 14, y + i * 4));
        y += infoLines.length * 4 + 4;
      }
    } else if (profile?.company_name) {
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text(profile.company_name, 14, y + 6);
      y += 10;
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 100, 100);
      const infoLines = [profile.company_document, profile.company_phone, profile.company_email, profile.company_full_address].filter(Boolean) as string[];
      infoLines.forEach((line, i) => doc.text(line, 14, y + i * 4));
      y += infoLines.length * 4 + 4;
    }

    // Divider
    doc.setDrawColor(200);
    doc.line(14, y, pageWidth - 14, y);
    y += 8;

    // Title + date
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text(`Orçamento ORC-${quoteNumber || '—'}`, 14, y);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 100);
    doc.text(new Date(createdAt).toLocaleDateString('pt-BR'), pageWidth - 14, y, { align: 'right' });
    y += 8;

    // Client
    doc.setFontSize(11);
    doc.setTextColor(80, 80, 80);
    doc.text(`Cliente: ${selectedClient?.name || '—'}`, 14, y);
    y += 10;

    // Items table
    const tableBody = items.map(i => [
      i.description ? `${i.name}\n${i.description}` : i.name,
      String(i.quantity),
      formatCurrency(i.unit_value),
      formatCurrency(i.quantity * i.unit_value),
    ]);

    autoTable(doc, {
      startY: y,
      head: [['Item', 'Qtd', 'Unitário', 'Total']],
      body: tableBody,
      theme: 'striped',
      headStyles: { fillColor: [240, 240, 240], textColor: [80, 80, 80], fontStyle: 'bold', fontSize: 9 },
      styles: { fontSize: 10, cellPadding: 4 },
      columnStyles: {
        0: { cellWidth: 'auto' },
        1: { halign: 'center', cellWidth: 25 },
        2: { halign: 'right', cellWidth: 35 },
        3: { halign: 'right', cellWidth: 35 },
      },
    });

    y = (doc as any).lastAutoTable.finalY + 10;

    // Summary
    const summaryX = pageWidth - 14;
    doc.setFontSize(11);
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'normal');
    doc.text('Subtotal:', summaryX - 60, y);
    doc.text(formatCurrency(subtotal), summaryX, y, { align: 'right' });
    y += 6;

    if (discountAmount > 0) {
      doc.setTextColor(220, 38, 38);
      doc.text('Desconto:', summaryX - 60, y);
      doc.text(`-${formatCurrency(discountAmount)}`, summaryX, y, { align: 'right' });
      y += 6;
    }

    if (shippingAmount > 0) {
      doc.setTextColor(22, 163, 74);
      doc.text('Frete:', summaryX - 60, y);
      doc.text(`+${formatCurrency(shippingAmount)}`, summaryX, y, { align: 'right' });
      y += 6;
    }

    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    y += 2;
    doc.text('Total:', summaryX - 60, y);
    doc.text(formatCurrency(total), summaryX, y, { align: 'right' });
    y += 10;

    // Notes
    if (notes) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(60, 60, 60);
      doc.setFillColor(249, 250, 251);
      const splitNotes = doc.splitTextToSize(notes, pageWidth - 38);
      const notesHeight = splitNotes.length * 5 + 10;
      doc.roundedRect(14, y, pageWidth - 28, notesHeight, 2, 2, 'F');
      doc.setFont('helvetica', 'bold');
      doc.text('Observações:', 18, y + 6);
      doc.setFont('helvetica', 'normal');
      doc.text(splitNotes, 18, y + 12);
      y += notesHeight + 6;
    }

    // Validity
    if (validUntil) {
      doc.setFontSize(9);
      doc.setTextColor(100, 100, 100);
      doc.text(`Validade: ${format(validUntil, 'dd/MM/yyyy')}`, 14, y);
    }

    doc.save(`orcamento-ORC-${quoteNumber || 'novo'}.pdf`);
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
            <Button
              variant="outline"
              onClick={async () => {
                if (!quoteId) return;
                const { data } = await supabase.from('quotes').select('public_token').eq('id', quoteId).single();
                if (!data?.public_token) { toast({ title: 'Salve o orçamento primeiro', variant: 'destructive' }); return; }
                const url = buildQuoteApprovalUrl(data.public_token);
                await navigator.clipboard.writeText(url);
                toast({ title: 'Link de aprovação copiado!', description: url });
              }}
              disabled={!quoteId}
            >
              <Link2 className="w-4 h-4 mr-2" /> Link de aprovação
            </Button>
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
                      <div className="col-span-12">
                        <Label className="text-xs">Especificações / Descrição (opcional)</Label>
                        <Textarea
                          value={item.description || ''}
                          onChange={e => updateItem(idx, { description: e.target.value })}
                          placeholder="Ex: tamanho, material, acabamento, cores..."
                          rows={2}
                          maxLength={500}
                          className="resize-none"
                        />
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
              {categories.length > 0 && (
                <div className="flex gap-1.5 flex-wrap">
                  <Badge
                    variant={productFilterCat === null ? 'default' : 'outline'}
                    className="cursor-pointer text-xs"
                    onClick={() => setProductFilterCat(null)}
                  >
                    Todas
                  </Badge>
                  {categories.map(cat => (
                    <Badge
                      key={cat.id}
                      variant={productFilterCat === cat.id ? 'default' : 'outline'}
                      className="cursor-pointer text-xs"
                      onClick={() => setProductFilterCat(productFilterCat === cat.id ? null : cat.id)}
                    >
                      {cat.name}
                    </Badge>
                  ))}
                </div>
              )}
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
                    <div className="flex justify-between items-center gap-2">
                      <div className="font-medium text-foreground truncate">{p.name}</div>
                      <div className="flex items-center gap-2 shrink-0">
                        {Array.isArray(p.price_tiers) && p.price_tiers.length > 1 ? (
                          <Badge variant="secondary" className="text-[10px]">{p.price_tiers.length} variações</Badge>
                        ) : (
                          <div className="text-sm font-semibold text-foreground">{formatCurrency(p.unit_price)}</div>
                        )}
                      </div>
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

        {/* Tier picker — when product has multiple variations */}
        <Dialog open={!!tierPickerProduct} onOpenChange={(o) => !o && setTierPickerProduct(null)}>
          <DialogContent className="max-w-md bg-card">
            <DialogHeader>
              <DialogTitle>Escolha a variação</DialogTitle>
            </DialogHeader>
            {tierPickerProduct && (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">{tierPickerProduct.name}</span> tem variações de preço por quantidade. Selecione a desejada:
                </p>
                <div className="space-y-1.5 max-h-72 overflow-y-auto">
                  {(Array.isArray(tierPickerProduct.price_tiers) ? tierPickerProduct.price_tiers : [])
                    .slice()
                    .sort((a: any, b: any) => Number(a.quantity) - Number(b.quantity))
                    .map((t: any, idx: number) => {
                      const qty = Number(t.quantity);
                      const price = Number(t.price);
                      const unit = qty > 0 ? price / qty : 0;
                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => insertProductWithTier(tierPickerProduct, { quantity: qty, price })}
                          className="w-full text-left px-4 py-3 rounded-md hover:bg-accent border border-border transition-colors"
                        >
                          <div className="flex justify-between items-center">
                            <div>
                              <div className="font-semibold text-foreground">{qty} unidades</div>
                              <div className="text-xs text-muted-foreground">Unitário: {formatCurrency(unit)}</div>
                            </div>
                            <div className="text-base font-bold text-primary">{formatCurrency(price)}</div>
                          </div>
                        </button>
                      );
                    })}
                </div>
              </div>
            )}
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

        {/* Convert to order */}
        <ConvertToOrderModal
          open={convertModalOpen}
          onOpenChange={setConvertModalOpen}
          totalValue={total}
          initialClientId={clientId}
          onConfirm={handleConvertConfirm}
          isLoading={converting}
        />
      </div>
    </AppLayout>
  );
};

export default OrcamentoEditor;
