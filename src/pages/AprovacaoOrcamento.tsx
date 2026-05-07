import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Check, X, Loader2, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
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
  seller: { company_name: string; company_email: string | null; company_phone: string | null; logo_url: string | null; company_document: string | null };
  already_responded: boolean;
};

const fmt = (v: number) => (Number.isFinite(v) ? v : 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const AprovacaoOrcamento: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const [loading, setLoading] = useState(true);
  const [quote, setQuote] = useState<QuoteData | null>(null);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState<'approved' | 'changes_requested' | null>(null);

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

  const respond = async (action: 'approved' | 'changes_requested') => {
    if (!token) return;
    if (action === 'changes_requested' && !comment.trim()) {
      toast.error('Descreva os ajustes desejados');
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
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!quote) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4">
        <Card className="p-8 text-center max-w-md">
          <FileText className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <h1 className="text-lg font-semibold">Orçamento não encontrado</h1>
          <p className="text-sm text-muted-foreground mt-2">O link pode ter expirado ou estar incorreto.</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30 py-8 px-4">
      <div className="max-w-2xl mx-auto space-y-4">
        {/* Seller header */}
        <Card className="p-5 bg-card border-border flex items-center gap-4">
          {quote.seller.logo_url ? (
            <img src={quote.seller.logo_url} alt="logo" className="w-14 h-14 rounded-lg object-contain bg-muted" />
          ) : (
            <div className="w-14 h-14 rounded-lg bg-foreground text-background flex items-center justify-center font-bold">
              {quote.seller.company_name.charAt(0)}
            </div>
          )}
          <div className="min-w-0">
            <h1 className="font-bold text-foreground truncate">{quote.seller.company_name}</h1>
            <p className="text-xs text-muted-foreground truncate">
              {[quote.seller.company_phone, quote.seller.company_email].filter(Boolean).join(' · ')}
            </p>
          </div>
        </Card>

        <Card className="p-5 bg-card border-border">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
            <div>
              <h2 className="text-xl font-bold">Orçamento {quote.quote_number ? `ORC-${quote.quote_number}` : ''}</h2>
              <p className="text-xs text-muted-foreground">
                Para <span className="text-foreground font-medium">{quote.client.name}</span> · {new Date(quote.created_at).toLocaleDateString('pt-BR')}
              </p>
            </div>
            <Badge variant="outline">{quote.status}</Badge>
          </div>

          <div className="space-y-2 border-t border-border pt-4">
            {quote.items.map((it, i) => (
              <div key={i} className="flex justify-between text-sm gap-2">
                <span className="flex-1 min-w-0 truncate">{it.name} <span className="text-muted-foreground">×{it.quantity}</span></span>
                <span className="font-medium tabular-nums">{fmt(it.quantity * it.unit_value)}</span>
              </div>
            ))}
          </div>

          <div className="border-t border-border mt-4 pt-4 space-y-1.5 text-sm">
            <div className="flex justify-between text-muted-foreground">
              <span>Subtotal</span>
              <span className="tabular-nums">{fmt(quote.subtotal)}</span>
            </div>
            {quote.discount_value > 0 && (
              <div className="flex justify-between text-destructive">
                <span>Desconto</span>
                <span className="tabular-nums">−{fmt(quote.discount_type === 'percent' ? quote.subtotal * (quote.discount_value / 100) : quote.discount_value)}</span>
              </div>
            )}
            {quote.shipping_value > 0 && (
              <div className="flex justify-between">
                <span>Frete</span>
                <span className="tabular-nums">+{fmt(quote.shipping_value)}</span>
              </div>
            )}
            <div className="flex justify-between text-lg font-bold pt-2 border-t border-border">
              <span>Total</span>
              <span className="tabular-nums">{fmt(quote.total_value)}</span>
            </div>
          </div>

          {quote.notes && (
            <div className="mt-4 p-3 rounded-md bg-muted text-xs text-muted-foreground whitespace-pre-wrap">
              {quote.notes}
            </div>
          )}
          {quote.valid_until && (
            <p className="text-xs text-muted-foreground mt-3">
              Válido até {new Date(quote.valid_until + 'T00:00:00').toLocaleDateString('pt-BR')}
            </p>
          )}
        </Card>

        {done ? (
          <Card className="p-6 text-center bg-card border-border">
            {done === 'approved' ? (
              <>
                <div className="w-12 h-12 rounded-full bg-green-500/10 text-green-600 flex items-center justify-center mx-auto mb-3">
                  <Check className="w-6 h-6" />
                </div>
                <h3 className="font-semibold">Orçamento aprovado!</h3>
                <p className="text-sm text-muted-foreground mt-1">Obrigado. Em breve entraremos em contato para os próximos passos.</p>
              </>
            ) : (
              <>
                <div className="w-12 h-12 rounded-full bg-yellow-500/10 text-yellow-600 flex items-center justify-center mx-auto mb-3">
                  <FileText className="w-6 h-6" />
                </div>
                <h3 className="font-semibold">Solicitação enviada</h3>
                <p className="text-sm text-muted-foreground mt-1">Recebemos seu pedido de ajustes e retornaremos em breve.</p>
              </>
            )}
          </Card>
        ) : quote.already_responded ? (
          <Card className="p-6 text-center bg-card border-border">
            <p className="text-sm text-muted-foreground">Este orçamento já foi respondido.</p>
          </Card>
        ) : (
          <Card className="p-5 bg-card border-border space-y-3">
            <Textarea
              placeholder="Comentário (obrigatório se solicitar ajustes)"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={3}
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <Button onClick={() => respond('approved')} disabled={submitting} className="bg-green-600 hover:bg-green-700 text-white">
                <Check className="w-4 h-4 mr-1" /> Aprovar orçamento
              </Button>
              <Button variant="outline" onClick={() => respond('changes_requested')} disabled={submitting}>
                <X className="w-4 h-4 mr-1" /> Solicitar ajustes
              </Button>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};

export default AprovacaoOrcamento;
