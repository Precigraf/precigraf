import React, { forwardRef, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, Loader2, XCircle, Crown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import Header from '@/components/Header';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

const PagamentoConfirmado = forwardRef<HTMLDivElement>((_, ref) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const confirmPayment = async () => {
      if (!user) {
        setStatus('error');
        setMessage('Você precisa estar logado.');
        return;
      }

      const csrfToken = sessionStorage.getItem('payment_csrf_token');
      if (!csrfToken) {
        setStatus('error');
        setMessage('Token de pagamento não encontrado. Faça o upgrade novamente.');
        return;
      }

      try {
        const { data, error } = await supabase.rpc('verify_and_complete_payment', {
          p_csrf_token: csrfToken,
        });

        if (error) {
          console.error('Payment verification error:', error);
          setStatus('error');
          setMessage('Erro ao verificar pagamento. Tente novamente.');
          return;
        }

        const result = data as Record<string, unknown> | null;
        if (result?.success) {
          sessionStorage.removeItem('payment_csrf_token');
          setStatus('success');
          setMessage((result.message as string) || 'Plano ativado com sucesso!');
        } else {
          setStatus('error');
          setMessage((result?.error as string) || 'Erro ao processar pagamento.');
        }
      } catch (err) {
        console.error('Payment confirmation error:', err);
        setStatus('error');
        setMessage('Erro inesperado. Tente novamente.');
      }
    };

    confirmPayment();
  }, [user]);

  return (
    <div ref={ref} className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-16 max-w-md">
        <Card className="bg-card border-border">
          <CardContent className="pt-8 pb-8 flex flex-col items-center text-center gap-4">
            {status === 'loading' && (
              <>
                <Loader2 className="w-16 h-16 text-primary animate-spin" />
                <h2 className="text-xl font-semibold text-foreground">Confirmando pagamento...</h2>
                <p className="text-muted-foreground">Aguarde enquanto ativamos seu plano.</p>
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
                <h2 className="text-xl font-semibold text-foreground">Erro no Pagamento</h2>
                <p className="text-muted-foreground">{message}</p>
                <div className="flex flex-col gap-2 mt-4 w-full">
                  <Button onClick={() => navigate('/upgrade')} className="w-full">
                    Tentar novamente
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
  );
});

PagamentoConfirmado.displayName = 'PagamentoConfirmado';

export default PagamentoConfirmado;
