import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Check, Package, Palette, Clock, Truck, CheckCircle2, Loader2, AlertCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';

interface TrackingData {
  order_number: number;
  status: string;
  created_at: string;
  client_name: string;
  seller_name: string;
  items: { name: string; quantity: number }[];
}

const STEPS = [
  { id: 'approved', label: 'Pedido Recebido', icon: Package },
  { id: 'creating_art', label: 'Criando Arte', icon: Palette },
  { id: 'awaiting_client_approval', label: 'Aguardando Aprovação', icon: Clock },
  { id: 'in_transit', label: 'Em Transporte', icon: Truck },
  { id: 'delivered', label: 'Entregue', icon: CheckCircle2 },
] as const;

const STATUS_TO_STEP_INDEX: Record<string, number> = {
  approved: 0,
  creating_art: 1,
  awaiting_client_approval: 2,
  in_production: 3,
  in_transit: 3,
  delivered: 4,
};

const STATUS_LABEL: Record<string, string> = {
  approved: 'Aprovado',
  creating_art: 'Criando Arte',
  awaiting_client_approval: 'Aguardando Aprovação',
  in_production: 'Em Produção',
  in_transit: 'Em Transporte',
  delivered: 'Entregue',
};

const RastreioPedido: React.FC = () => {
  const params = useParams<{ token: string }>();
  const pathToken = typeof window !== 'undefined'
    ? window.location.pathname.match(/^\/pedido\/([^/?#]+)/)?.[1]
    : undefined;
  const token = params.token || pathToken;
  const [data, setData] = useState<TrackingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setError('Pedido não encontrado.');
      setLoading(false);
      return;
    }
    let cancelled = false;

    const fetchData = async () => {
      const { data: result, error: rpcErr } = await supabase.rpc('get_order_by_tracking_token', { p_token: token });
      if (cancelled) return;
      if (rpcErr || !result) {
        setError('Pedido não encontrado.');
        setLoading(false);
        return;
      }
      setData(result as unknown as TrackingData);
      setLoading(false);
    };

    fetchData();

    // Realtime poll fallback every 30s
    const interval = setInterval(fetchData, 30000);
    return () => { cancelled = true; clearInterval(interval); };
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
        <AlertCircle className="w-12 h-12 text-muted-foreground mb-3" />
        <h1 className="text-xl font-semibold text-foreground">Pedido não encontrado</h1>
        <p className="text-sm text-muted-foreground mt-1">O link pode estar incorreto ou expirado.</p>
      </div>
    );
  }

  const currentStepIndex = STATUS_TO_STEP_INDEX[data.status] ?? 0;
  const formattedDate = new Date(data.created_at).toLocaleDateString('pt-BR', {
    day: 'numeric', month: 'long', year: 'numeric',
  });

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 py-8 md:py-12">
        {/* Header */}
        <header className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight">Área do Cliente</h1>
          <p className="text-sm md:text-base text-muted-foreground mt-2">{data.seller_name}</p>
        </header>

        {/* Status Card */}
        <Card className="p-5 md:p-6 mb-5 bg-card border-border">
          <div className="flex items-start justify-between gap-3 mb-4 flex-wrap">
            <div>
              <div className="text-sm text-muted-foreground font-mono">Pedido #{data.order_number}</div>
              <h2 className="text-xl md:text-2xl font-semibold text-foreground mt-1">
                Olá, {data.client_name}!
              </h2>
            </div>
            <Badge className="bg-primary/15 text-primary border-primary/30 hover:bg-primary/15">
              {STATUS_LABEL[data.status] || data.status}
            </Badge>
          </div>

          {/* Timeline */}
          <div className="my-8">
            {/* Desktop horizontal */}
            <div className="hidden md:flex items-start justify-between relative">
              {STEPS.map((step, idx) => {
                const completed = idx < currentStepIndex;
                const current = idx === currentStepIndex;
                const Icon = step.icon;
                return (
                  <React.Fragment key={step.id}>
                    <div className="flex flex-col items-center text-center flex-1 relative z-10">
                      <div
                        className={`w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all
                          ${completed ? 'bg-green-500 border-green-500 text-white' : ''}
                          ${current ? 'bg-primary border-primary text-primary-foreground ring-4 ring-primary/20 scale-110' : ''}
                          ${!completed && !current ? 'bg-muted border-border text-muted-foreground' : ''}`}
                      >
                        {completed ? <Check className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                      </div>
                      <p className={`text-xs mt-2 font-medium px-1 ${current ? 'text-foreground' : completed ? 'text-foreground/80' : 'text-muted-foreground'}`}>
                        {step.label}
                      </p>
                    </div>
                    {idx < STEPS.length - 1 && (
                      <div className="flex-1 h-0.5 mt-6 -mx-2 relative z-0">
                        <div className={`h-full ${idx < currentStepIndex ? 'bg-green-500' : 'bg-border'}`} />
                      </div>
                    )}
                  </React.Fragment>
                );
              })}
            </div>

            {/* Mobile vertical */}
            <div className="md:hidden space-y-3">
              {STEPS.map((step, idx) => {
                const completed = idx < currentStepIndex;
                const current = idx === currentStepIndex;
                const Icon = step.icon;
                return (
                  <div key={step.id} className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 shrink-0 rounded-full flex items-center justify-center border-2
                        ${completed ? 'bg-green-500 border-green-500 text-white' : ''}
                        ${current ? 'bg-primary border-primary text-primary-foreground ring-4 ring-primary/20' : ''}
                        ${!completed && !current ? 'bg-muted border-border text-muted-foreground' : ''}`}
                    >
                      {completed ? <Check className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                    </div>
                    <p className={`text-sm font-medium ${current ? 'text-foreground' : completed ? 'text-foreground/80' : 'text-muted-foreground'}`}>
                      {step.label}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="text-xs text-muted-foreground border-t border-border pt-3 text-center">
            Pedido realizado em: {formattedDate}
          </div>
        </Card>

        {/* Itens */}
        <Card className="p-5 md:p-6 bg-card border-border">
          <h3 className="text-lg font-semibold text-foreground mb-3">Itens do Pedido</h3>
          {data.items.length === 0 ? (
            <p className="text-sm text-muted-foreground italic">Nenhum item registrado.</p>
          ) : (
            <ul className="divide-y divide-border">
              {data.items.map((item, i) => (
                <li key={i} className="py-2.5 flex items-center justify-between">
                  <span className="text-foreground">{item.name}</span>
                  <span className="text-sm text-muted-foreground font-medium">Qtd: {item.quantity}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <p className="text-center text-xs text-muted-foreground mt-8">
          Última atualização automática a cada 30 segundos
        </p>
      </div>
    </div>
  );
};

export default RastreioPedido;
