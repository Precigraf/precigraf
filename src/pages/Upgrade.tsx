import React, { forwardRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Crown, Check, Zap, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/components/AppLayout';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const Upgrade = forwardRef<HTMLDivElement>((_, ref) => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const features = [
    'Cálculos ilimitados',
    'Exportação para PDF e Excel',
    'Histórico completo',
    'Gestão de clientes, orçamentos e pedidos',
    'Suporte prioritário',
    'Todas as atualizações futuras',
  ];

  const handleUpgrade = async () => {
    setIsLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Você precisa estar logado para assinar');
        navigate('/auth');
        return;
      }

      const { data, error } = await supabase.functions.invoke('create-stripe-checkout');
      if (error || !data?.url) {
        console.error('Checkout error:', error);
        toast.error('Erro ao iniciar checkout. Tente novamente.');
        setIsLoading(false);
        return;
      }

      window.location.href = data.url;
    } catch (error) {
      console.error('Error starting checkout:', error);
      toast.error('Erro inesperado. Tente novamente.');
      setIsLoading(false);
    }
  };

  return (
    <AppLayout>
      <div ref={ref}>
      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-6 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>

        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <Crown className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Plano Pro PreciGraf</h1>
          <p className="text-muted-foreground">
            Assinatura mensal — cancele quando quiser
          </p>
        </div>

        <Card className="bg-card border-border">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl flex items-center justify-center gap-2">
              <Zap className="w-6 h-6 text-primary" />
              Recursos Premium
            </CardTitle>
            <CardDescription>
              Tudo o que você precisa para precificar seus trabalhos gráficos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3 mb-6">
              {features.map((feature, index) => (
                <li key={index} className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-success/10 flex items-center justify-center flex-shrink-0">
                    <Check className="w-3 h-3 text-success" />
                  </div>
                  <span className="text-foreground">{feature}</span>
                </li>
              ))}
            </ul>

            <div className="text-center p-6 bg-primary/5 border border-primary/20 rounded-lg mb-6">
              <p className="text-sm font-medium text-primary mb-2">Assinatura mensal</p>
              <p className="text-4xl font-bold text-foreground">
                R$ 15,90<span className="text-lg font-normal text-muted-foreground">/mês</span>
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Cancele a qualquer momento
              </p>
            </div>

            <Button 
              className="w-full gap-2" 
              size="lg"
              onClick={handleUpgrade}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Redirecionando...
                </>
              ) : (
                <>
                  <Crown className="w-5 h-5" />
                  Assinar plano Pro
                </>
              )}
            </Button>

            <p className="text-center text-xs text-muted-foreground mt-4">
              Pagamento seguro via Stripe
            </p>
          </CardContent>
        </Card>
      </main>
      </div>
    </AppLayout>
  );
});

Upgrade.displayName = 'Upgrade';

export default Upgrade;
