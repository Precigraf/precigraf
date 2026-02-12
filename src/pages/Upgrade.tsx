import React, { forwardRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Crown, Check, Zap, Infinity, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Header from '@/components/Header';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const Upgrade = forwardRef<HTMLDivElement>((_, ref) => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const features = [
    'Cálculos ilimitados',
    'Exportação para PDF e Excel',
    'Histórico completo',
    'Suporte prioritário',
    'Acesso vitalício (sem mensalidade)',
    'Todas as atualizações futuras',
  ];

  const handleUpgrade = async () => {
    setIsLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast.error('Você precisa estar logado para fazer upgrade');
        navigate('/auth');
        return;
      }

      // Generate secure CSRF token
      const csrfToken = crypto.randomUUID();
      
      // Store pending payment in database (secure, not localStorage)
      const { error: insertError } = await supabase
        .from('pending_payments')
        .insert({
          user_id: session.user.id,
          csrf_token: csrfToken,
        });

      if (insertError) {
        console.error('Error creating pending payment:', insertError);
        toast.error('Erro ao iniciar pagamento. Tente novamente.');
        setIsLoading(false);
        return;
      }

      // Store CSRF token in sessionStorage (more secure than localStorage, cleared on tab close)
      sessionStorage.setItem('payment_csrf_token', csrfToken);

      // Redirect to InfinitePay static checkout link
      window.location.href = 'https://checkout.infinitepay.io/israel-shaina-wanderley/tBMthxjk5';
    } catch (error) {
      console.error('Error starting checkout:', error);
      toast.error('Erro inesperado. Tente novamente.');
      setIsLoading(false);
    }
  };

  return (
    <div ref={ref} className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8 max-w-2xl">
        {/* Back button */}
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
          <h1 className="text-3xl font-bold text-foreground mb-2">Acesso Vitalício PreciGraf</h1>
          <p className="text-muted-foreground">
            Pague uma vez, use para sempre!
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
              <div className="flex items-center justify-center gap-2 mb-2">
                <Infinity className="w-5 h-5 text-primary" />
                <p className="text-sm font-medium text-primary">Pagamento único</p>
              </div>
              <p className="text-4xl font-bold text-foreground">
                R$ 19,90
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Sem mensalidade, sem recorrência
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
                  Desbloquear acesso vitalício
                </>
              )}
            </Button>

            <p className="text-center text-xs text-muted-foreground mt-4">
              Pagamento seguro via InfinitePay
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
});

Upgrade.displayName = 'Upgrade';

export default Upgrade;
