import React, { forwardRef, useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, Loader2, XCircle, Crown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import AppLayout from '@/components/AppLayout';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

const PagamentoConfirmado = forwardRef<HTMLDivElement>((_, ref) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!user) return;

    // Stripe redirects with ?session_id=cs_... — webhook ativa o plano.
    // Aqui só verificamos se o profile já está pro_monthly (poll por até ~15s).
    let attempts = 0;
    const maxAttempts = 8;

    const check = async () => {
      attempts++;
      const { data, error } = await supabase
        .from('profiles')
        .select('subscription_status, plan_id, subscription_plans:plan_id(name)')
        .eq('user_id', user.id)
        .single();

      if (error) {
        setStatus('error');
        setMessage('Erro ao verificar assinatura.');
        return;
      }

      const planName = (data?.subscription_plans as { name?: string } | null)?.name;
      const isPro = planName === 'pro_monthly' || planName === 'lifetime';

      if (isPro) {
        setStatus('success');
        setMessage('Sua assinatura Pro está ativa!');
        return;
      }

      if (attempts >= maxAttempts) {
        setStatus('error');
        setMessage('Não conseguimos confirmar o pagamento ainda. Aguarde alguns segundos e atualize a página.');
        return;
      }

      setTimeout(check, 2000);
    };

    check();
  }, [user]);

  const sessionId = searchParams.get('session_id');

  return (
    <AppLayout>
      <div ref={ref}>
      <main className="container mx-auto px-4 py-16 max-w-md">
        <Card className="bg-card border-border">
          <CardContent className="pt-8 pb-8 flex flex-col items-center text-center gap-4">
            {status === 'loading' && (
              <>
                <Loader2 className="w-16 h-16 text-primary animate-spin" />
                <h2 className="text-xl font-semibold text-foreground">Confirmando pagamento...</h2>
                <p className="text-muted-foreground">
                  {sessionId ? 'Aguarde enquanto ativamos sua assinatura.' : 'Aguarde um instante.'}
                </p>
              </>
            )}

            {status === 'success' && (
              <>
                <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center">
                  <CheckCircle className="w-10 h-10 text-success" />
                </div>
                <h2 className="text-xl font-semibold text-foreground">Pagamento Confirmado!</h2>
                <p className="text-muted-foreground">{message}</p>
                <div className="flex items-center gap-2 text-primary font-medium">
                  <Crown className="w-5 h-5" />
                  Você agora é PRO!
                </div>
                <Button onClick={() => navigate('/')} className="mt-4 w-full">
                  Ir para a calculadora
                </Button>
              </>
            )}

            {status === 'error' && (
              <>
                <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
                  <XCircle className="w-10 h-10 text-destructive" />
                </div>
                <h2 className="text-xl font-semibold text-foreground">Atenção</h2>
                <p className="text-muted-foreground">{message}</p>
                <div className="flex flex-col gap-2 mt-4 w-full">
                  <Button onClick={() => window.location.reload()} className="w-full">
                    Atualizar
                  </Button>
                  <Button variant="outline" onClick={() => navigate('/')} className="w-full">
                    Voltar para a calculadora
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </main>
      </div>
    </AppLayout>
  );
});

PagamentoConfirmado.displayName = 'PagamentoConfirmado';

export default PagamentoConfirmado;
