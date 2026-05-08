import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Check, X, Loader2, FileText, Ban } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

type QuoteData = {
  id: string;
  quote_number: number | null;
  status: string;
  product_name: string | null;
  description: string | null;
  items: Array<{ name: string; quantity: number; unit_value: number }>;
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
        <div className="bg-white border border-gray-200 rounded-lg p-8 text-center max-w-md shadow-sm">
          <FileText className="w-10 h-10 text-gray-400 mx-auto mb-3" />
          <h1 className="text-lg font-semibold text-gray-900">Orçamento não encontrado</h1>
          <p className="text-sm text-gray-500 mt-2">O link pode ter expirado ou estar incorreto.</p>
        </div>
      </div>
    );
  }

  const discountAmount =
    quote.discount_type === 'percent' ? quote.subtotal * (quote.discount_value / 100) : quote.discount_value;

  const sellerInfo = [quote.seller.company_phone, quote.seller.company_email, quote.seller.company_document]
    .filter(Boolean)
    .join(' · ');
  const clientInfo = [quote.client.whatsapp, quote.client.email].filter(Boolean).join(' · ');

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4 text-gray-900">
      <div className="max-w-3xl mx-auto">
        {/* PDF-like document */}
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-8 sm:p-10">
          {/* Header */}
          <div className="flex items-start gap-4 pb-5 border-b border-gray-300">
            {quote.seller.logo_url ? (
              <img
                src={quote.seller.logo_url}
                alt="logo"
                className="w-16 h-16 object-contain rounded"
              />
            ) : (
              <div className="w-16 h-16 rounded bg-gray-900 text-white flex items-center justify-center text-xl font-bold">
                {quote.seller.company_name.charAt(0)}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <h1 className="text-xl font-bold text-gray-900 truncate">{quote.seller.company_name}</h1>
              {sellerInfo && <p className="text-xs text-gray-500 mt-1 break-words">{sellerInfo}</p>}
            </div>
          </div>

          {/* Title row */}
          <div className="flex items-baseline justify-between mt-6 mb-4">
            <h2 className="text-2xl font-bold text-gray-900">
              Orçamento ORC-{quote.quote_number ?? '—'}
            </h2>
            <span className="text-sm text-gray-500">
              {new Date(quote.created_at).toLocaleDateString('pt-BR')}
            </span>
          </div>

          {/* Client */}
          <div className="mb-6 text-sm text-gray-700">
            <p>
              <span className="text-gray-500">Cliente:</span>{' '}
              <span className="font-medium">{quote.client.name}</span>
            </p>
            {clientInfo && <p className="text-xs text-gray-500 mt-0.5">{clientInfo}</p>}
          </div>

          {/* Items table */}
          <div className="border border-gray-200 rounded overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-100 text-gray-700">
                <tr>
                  <th className="text-left font-semibold px-3 py-2">Produto</th>
                  <th className="text-right font-semibold px-3 py-2 w-16">Qtd</th>
                  <th className="text-right font-semibold px-3 py-2 w-28">Unit.</th>
                  <th className="text-right font-semibold px-3 py-2 w-28">Total</th>
                </tr>
              </thead>
              <tbody>
                {quote.items.map((it, i) => (
                  <tr key={i} className="border-t border-gray-200">
                    <td className="px-3 py-2 text-gray-900">{it.name}</td>
                    <td className="px-3 py-2 text-right tabular-nums text-gray-700">{it.quantity}</td>
                    <td className="px-3 py-2 text-right tabular-nums text-gray-700">{fmt(it.unit_value)}</td>
                    <td className="px-3 py-2 text-right tabular-nums font-medium text-gray-900">
                      {fmt(it.quantity * it.unit_value)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="mt-4 ml-auto max-w-xs space-y-1 text-sm">
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
            <div className="flex justify-between text-lg font-bold pt-2 mt-2 border-t-2 border-gray-900 text-gray-900">
              <span>Total</span>
              <span className="tabular-nums">{fmt(quote.total_value)}</span>
            </div>
          </div>

          {quote.notes && (
            <div className="mt-6 pt-4 border-t border-gray-200">
              <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Observações</p>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{quote.notes}</p>
            </div>
          )}

          {quote.valid_until && (
            <p className="text-xs text-gray-500 mt-6">
              Válido até {new Date(quote.valid_until + 'T00:00:00').toLocaleDateString('pt-BR')}
            </p>
          )}
        </div>

        {/* Action area */}
        <div className="mt-4">
          {done ? (
            <div className="bg-white border border-gray-200 rounded-lg p-6 text-center shadow-sm">
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
            </div>
          ) : quote.already_responded ? (
            <div className="bg-white border border-gray-200 rounded-lg p-6 text-center shadow-sm">
              <p className="text-sm text-gray-500">Este orçamento já foi respondido.</p>
            </div>
          ) : (
            <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm space-y-3">
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
                  variant="outline"
                  onClick={() => respond('changes_requested')}
                  disabled={submitting}
                  className="border-gray-300 text-gray-900 hover:bg-gray-50"
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
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AprovacaoOrcamento;
