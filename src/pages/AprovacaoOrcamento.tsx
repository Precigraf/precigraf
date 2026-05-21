import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Check, Loader2, FileText, Ban } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

type QuoteData = {
  id: string;
  quote_number: number | null;
  status: string;
  product_name: string | null;
  description: string | null;
  items: Array<{ name: string; description?: string; quantity: number; unit_value: number }>;
  subtotal: number;
  discount_value: number;
  discount_type: string;
  shipping_value: number;
  total_value: number;
  valid_until: string | null;
  notes: string | null;
  created_at: string;
  client: { name: string; email: string | null; whatsapp: string | null };
  seller: {
    company_name: string;
    company_email: string | null;
    company_phone: string | null;
    logo_url: string | null;
    logo_scale: number | null;
    company_document: string | null;
  };
  already_responded: boolean;
};

type Action = 'approved' | 'changes_requested' | 'rejected';

const fmt = (v: number) =>
  (Number.isFinite(v) ? v : 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const AprovacaoOrcamento: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const [loading, setLoading] = useState(true);
  const [quote, setQuote] = useState<QuoteData | null>(null);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState<Action | null>(null);

  // Force light theme on this public page
  useEffect(() => {
    const root = document.documentElement;
    const prev = root.className;
    root.classList.remove('dark');
    root.classList.add('light');
    return () => {
      root.className = prev;
    };
  }, []);

  useEffect(() => {
    if (!token) return;
    (async () => {
      const { data, error } = await supabase.rpc('get_quote_by_token', { p_token: token });
      if (error || !data) {
        toast.error('Orçamento não encontrado');
        setLoading(false);
        return;
      }
      setQuote(data as unknown as QuoteData);
      setLoading(false);
    })();
  }, [token]);

  const respond = async (action: Action) => {
    if (!token) return;
    if ((action === 'changes_requested' || action === 'rejected') && !comment.trim()) {
      toast.error(action === 'rejected' ? 'Informe o motivo da recusa' : 'Descreva os ajustes desejados');
      return;
    }
    setSubmitting(true);
    const { data, error } = await supabase.rpc('respond_to_quote_by_token', {
      p_token: token,
      p_action: action,
      p_comment: comment || null,
    });
    setSubmitting(false);
    const result = data as { success?: boolean; error?: string } | null;
    if (error || !result?.success) {
      toast.error(result?.error === 'already_responded' ? 'Este orçamento já foi respondido' : 'Erro ao enviar resposta');
      return;
    }
    setDone(action);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <Loader2 className="w-6 h-6 animate-spin text-gray-500" />
      </div>
    );
  }

  if (!quote) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
        <Card className="bg-white border-gray-200 p-8 text-center max-w-md shadow-sm">
          <FileText className="w-10 h-10 text-gray-400 mx-auto mb-3" />
          <h1 className="text-lg font-semibold text-gray-900">Orçamento não encontrado</h1>
          <p className="text-sm text-gray-500 mt-2">O link pode ter expirado ou estar incorreto.</p>
        </Card>
      </div>
    );
  }

  const discountAmount =
    quote.discount_type === 'percent' ? quote.subtotal * (quote.discount_value / 100) : quote.discount_value;

  const sellerInfo = [quote.seller.company_phone, quote.seller.company_email, quote.seller.company_document]
    .filter(Boolean)
    .join(' · ');
  const clientInfo = [quote.client.whatsapp, quote.client.email].filter(Boolean).join(' · ');

  const statusBadge = () => {
    const map: Record<string, { label: string; cls: string }> = {
      pending: { label: 'Aguardando resposta', cls: 'bg-blue-100 text-blue-700 border-blue-200' },
      sent: { label: 'Aguardando resposta', cls: 'bg-blue-100 text-blue-700 border-blue-200' },
      enviado: { label: 'Aguardando resposta', cls: 'bg-blue-100 text-blue-700 border-blue-200' },
      draft: { label: 'Rascunho', cls: 'bg-gray-100 text-gray-700 border-gray-200' },
      approved: { label: 'Aprovado', cls: 'bg-green-100 text-green-700 border-green-200' },
      aprovado: { label: 'Aprovado', cls: 'bg-green-100 text-green-700 border-green-200' },
      rejected: { label: 'Recusado', cls: 'bg-red-100 text-red-700 border-red-200' },
      recusado: { label: 'Recusado', cls: 'bg-red-100 text-red-700 border-red-200' },
      changes_requested: { label: 'Ajustes solicitados', cls: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
      expired: { label: 'Expirado', cls: 'bg-gray-100 text-gray-700 border-gray-200' },
      expirado: { label: 'Expirado', cls: 'bg-gray-100 text-gray-700 border-gray-200' },
    };
    const s = map[quote.status] ?? { label: 'Status indisponível', cls: 'bg-gray-100 text-gray-700 border-gray-200' };
    return <Badge className={`${s.cls} hover:${s.cls}`}>{s.label}</Badge>;
  };

  return (
    <div className="min-h-screen bg-gray-100 text-gray-900">
      <div className="max-w-3xl mx-auto px-4 py-8 md:py-12 space-y-5">
        {/* Header */}
        <header className="text-center">
          {quote.seller.logo_url ? (
            <img
              src={quote.seller.logo_url}
              alt="logo"
              style={{
                maxHeight: `${64 * (quote.seller.logo_scale ?? 1)}px`,
                maxWidth: `${240 * (quote.seller.logo_scale ?? 1)}px`,
              }}
              className="w-auto h-auto object-contain mx-auto mb-3"
            />
          ) : (
            <div className="w-16 h-16 rounded bg-gray-900 text-white flex items-center justify-center text-xl font-bold mx-auto mb-3">
              {quote.seller.company_name.charAt(0)}
            </div>
          )}
          <h1 className="text-xl md:text-2xl font-bold text-gray-900">{quote.seller.company_name}</h1>
          {sellerInfo && <p className="text-xs text-gray-500 mt-1 break-words">{sellerInfo}</p>}
          <p className="text-sm text-gray-600 mt-3 font-medium">
            Orçamento ORC-{quote.quote_number ?? '—'}
          </p>
        </header>

        {/* Card: Cliente */}
        <Card className="p-5 md:p-6 bg-white border-gray-200 shadow-sm">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div>
              <div className="text-xs text-gray-500 uppercase font-semibold tracking-wide">Cliente</div>
              <h2 className="text-lg font-semibold text-gray-900 mt-1">{quote.client.name}</h2>
              {clientInfo && <p className="text-xs text-gray-500 mt-0.5">{clientInfo}</p>}
            </div>
            {statusBadge()}
          </div>
          <div className="mt-4 pt-3 border-t border-gray-200 flex flex-wrap gap-x-6 gap-y-1 text-xs text-gray-500">
            <span>
              Emitido em <span className="text-gray-700 font-medium">{new Date(quote.created_at).toLocaleDateString('pt-BR')}</span>
            </span>
            {quote.valid_until && (
              <span>
                Válido até{' '}
                <span className="text-gray-700 font-medium">
                  {new Date(quote.valid_until + 'T00:00:00').toLocaleDateString('pt-BR')}
                </span>
              </span>
            )}
          </div>
        </Card>

        {/* Card: Itens */}
        <Card className="p-5 md:p-6 bg-white border-gray-200 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Itens do Orçamento</h3>
          <ul className="divide-y divide-gray-200">
            {quote.items.map((it, i) => (
              <li key={i} className="py-3 flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-900 break-words">{it.name}</p>
                  {it.description && (
                    <p className="text-xs text-gray-600 mt-1 whitespace-pre-wrap break-words">{it.description}</p>
                  )}
                  <p className="text-xs text-gray-500 mt-1">
                    {it.quantity} × {fmt(it.unit_value)}
                  </p>
                </div>
                <span className="text-sm font-semibold text-gray-900 tabular-nums shrink-0">
                  {fmt(it.quantity * it.unit_value)}
                </span>
              </li>
            ))}
          </ul>
        </Card>

        {/* Card: Resumo Financeiro */}
        <Card className="p-5 md:p-6 bg-white border-gray-200 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Resumo</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between text-gray-600">
              <span>Subtotal</span>
              <span className="tabular-nums">{fmt(quote.subtotal)}</span>
            </div>
            {quote.discount_value > 0 && (
              <div className="flex justify-between text-red-600">
                <span>Desconto</span>
                <span className="tabular-nums">−{fmt(discountAmount)}</span>
              </div>
            )}
            {quote.shipping_value > 0 && (
              <div className="flex justify-between text-gray-600">
                <span>Frete</span>
                <span className="tabular-nums">+{fmt(quote.shipping_value)}</span>
              </div>
            )}
            <div className="flex justify-between text-lg font-bold pt-3 mt-2 border-t-2 border-gray-900 text-gray-900">
              <span>Total</span>
              <span className="tabular-nums">{fmt(quote.total_value)}</span>
            </div>
          </div>
        </Card>

        {/* Card: Observações */}
        {quote.notes && (
          <Card className="p-5 md:p-6 bg-white border-gray-200 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">Observações</h3>
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{quote.notes}</p>
          </Card>
        )}

        {/* Card: Ação */}
        {done ? (
          <Card className="p-6 bg-white border-gray-200 shadow-sm text-center">
            {done === 'approved' && (
              <>
                <div className="w-12 h-12 rounded-full bg-green-100 text-green-600 flex items-center justify-center mx-auto mb-3">
                  <Check className="w-6 h-6" />
                </div>
                <h3 className="font-semibold text-gray-900">Orçamento aprovado!</h3>
                <p className="text-sm text-gray-500 mt-1">Obrigado. Em breve entraremos em contato.</p>
              </>
            )}
            {done === 'changes_requested' && (
              <>
                <div className="w-12 h-12 rounded-full bg-yellow-100 text-yellow-700 flex items-center justify-center mx-auto mb-3">
                  <FileText className="w-6 h-6" />
                </div>
                <h3 className="font-semibold text-gray-900">Solicitação enviada</h3>
                <p className="text-sm text-gray-500 mt-1">Recebemos seu pedido de ajustes.</p>
              </>
            )}
            {done === 'rejected' && (
              <>
                <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-3">
                  <Ban className="w-6 h-6" />
                </div>
                <h3 className="font-semibold text-gray-900">Orçamento recusado</h3>
                <p className="text-sm text-gray-500 mt-1">Resposta registrada. Obrigado pelo retorno.</p>
              </>
            )}
          </Card>
        ) : quote.already_responded ? (
          <Card className="p-6 bg-white border-gray-200 shadow-sm text-center">
            <p className="text-sm text-gray-500">Este orçamento já foi respondido.</p>
          </Card>
        ) : (
          <Card className="p-5 md:p-6 bg-white border-gray-200 shadow-sm space-y-3">
            <h3 className="text-lg font-semibold text-gray-900">Sua resposta</h3>
            <Textarea
              placeholder="Comentário (obrigatório se solicitar ajustes ou recusar)"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={3}
              className="bg-white border-gray-300 text-gray-900 placeholder:text-gray-400"
            />
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <Button
                onClick={() => respond('approved')}
                disabled={submitting}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                <Check className="w-4 h-4 mr-1" /> Aprovar
              </Button>
              <Button
                onClick={() => respond('changes_requested')}
                disabled={submitting}
                className="bg-yellow-500 hover:bg-yellow-600 text-white border-0"
              >
                <FileText className="w-4 h-4 mr-1" /> Solicitar ajustes
              </Button>
              <Button
                onClick={() => respond('rejected')}
                disabled={submitting}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                <Ban className="w-4 h-4 mr-1" /> Recusar
              </Button>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};

export default AprovacaoOrcamento;
