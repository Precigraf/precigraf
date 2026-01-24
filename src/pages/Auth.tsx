import React, { useState, useEffect, useCallback, forwardRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff, Loader2, Mail, Lock } from 'lucide-react';
import LogoIcon from '@/components/LogoIcon';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const Auth = forwardRef<HTMLDivElement>((_, ref) => {
  const navigate = useNavigate();
  const { user, loading: authLoading, signIn } = useAuth();

  // Form states
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [paymentProcessing, setPaymentProcessing] = useState(false);

  // Login form
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  // Handle payment success from InfinitePay redirect - SECURE VERSION
  // Security: Relies solely on server-side CSRF token validation, not client referrer
  const handlePaymentSuccess = useCallback(async () => {
    // Get CSRF token from sessionStorage (set before redirect to InfinitePay)
    const csrfToken = sessionStorage.getItem('payment_csrf_token');
    
    // Only process if we have a CSRF token - server-side validation handles security
    // The verify_and_complete_payment RPC validates token expiration, status, and user ownership
    if (csrfToken) {
      setPaymentProcessing(true);
      
      try {
        // Verify payment server-side using the secure database function
        const { data, error } = await supabase.rpc('verify_and_complete_payment', {
          p_csrf_token: csrfToken
        });

        if (error) {
          console.error('Error verifying payment:', error);
          toast.error('Erro ao verificar pagamento. Entre em contato com o suporte.');
        } else if (data) {
          // Cast to expected type since RPC returns Json
          const result = data as { success: boolean; message?: string; error?: string };
          
          if (result.success) {
            toast.success('🎉 Pagamento confirmado! Seu plano vitalício foi ativado.', {
              duration: 5000,
            });
          } else {
            // Token invalid/expired is expected for non-payment visits - only log, don't show error
            if (result.error !== 'Token inválido ou expirado') {
              console.error('Payment verification failed:', result.error);
              toast.error(result.error || 'Erro ao ativar plano. Entre em contato com o suporte.');
            }
          }
        }

        // Clear CSRF token from sessionStorage
        sessionStorage.removeItem('payment_csrf_token');
        
        // Also clean up old localStorage key if it exists (migration cleanup)
        localStorage.removeItem('pending_upgrade_user_id');
      } catch (err) {
        console.error('Error processing payment:', err);
        toast.error('Erro ao processar pagamento.');
      } finally {
        setPaymentProcessing(false);
      }
    }
  }, []);

  useEffect(() => {
    handlePaymentSuccess();
  }, [handlePaymentSuccess]);

  // Redirect if already logged in
  const handleRedirect = useCallback(() => {
    if (!authLoading && user && !paymentProcessing) {
      navigate('/', { replace: true });
    }
  }, [authLoading, user, navigate, paymentProcessing]);

  useEffect(() => {
    handleRedirect();
  }, [handleRedirect]);

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email.trim());
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isLoading) return;
    
    setLoginError('');

    const trimmedEmail = loginEmail.trim().toLowerCase();
    const trimmedPassword = loginPassword;

    if (!trimmedEmail || !trimmedPassword) {
      setLoginError('Preencha todos os campos');
      return;
    }

    if (!validateEmail(trimmedEmail)) {
      setLoginError('Email inválido');
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await signIn(trimmedEmail, trimmedPassword);

      if (error) {
        const errorMessage = error.message.toLowerCase();
        
        if (errorMessage.includes('invalid login credentials') || errorMessage.includes('invalid_credentials')) {
          setLoginError('Email ou senha incorretos');
        } else if (errorMessage.includes('email not confirmed')) {
          setLoginError('Confirme seu email antes de entrar');
        } else if (errorMessage.includes('too many requests') || errorMessage.includes('rate limit')) {
          setLoginError('Muitas tentativas. Aguarde alguns minutos.');
        } else {
          setLoginError('Erro ao fazer login. Tente novamente.');
        }
        setIsLoading(false);
        return;
      }

      toast.success('Login realizado! Bem-vindo ao PreciGraf.');
    } catch (err) {
      setLoginError('Erro inesperado. Tente novamente.');
      setIsLoading(false);
    }
  };

  if (authLoading || paymentProcessing) {
    return (
      <div ref={ref} className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        {paymentProcessing && (
          <p className="text-muted-foreground">Processando seu pagamento...</p>
        )}
      </div>
    );
  }

  return (
    <div ref={ref} className="min-h-screen bg-background flex items-center justify-center p-4">
      {/* Background gradient effect */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-primary/5 rounded-full blur-3xl" />
      </div>

      {/* Auth Card */}
      <div className="w-full max-w-md relative z-10">
        <div className="glass-card p-8 animate-slide-up">
          {/* Logo */}
          <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-foreground flex items-center justify-center mb-4">
              <LogoIcon className="w-8 h-8 text-background" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">PreciGraf</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Calculadora de Preços para Gráficas
            </p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            {loginError && (
              <Alert className="bg-destructive/10 border-destructive/30">
                <AlertDescription className="text-destructive text-sm">
                  {loginError}
                </AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="email"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="seu@email.com"
                  className="input-currency pl-10"
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Senha</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type={showPassword ? 'text' : 'password'}
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="••••••••"
                  className="input-currency pl-10 pr-10"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full bg-foreground text-background hover:bg-foreground/90"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Entrando...
                </>
              ) : (
              'Entrar'
            )}
          </Button>
        </form>

        {/* Link to create account */}
        <div className="mt-6 text-center">
          <Link to="/cadastro" className="text-sm text-primary hover:underline font-medium">
            Criar conta gratuitamente
          </Link>
        </div>
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-muted-foreground mt-6">
          © {new Date().getFullYear()} PreciGraf. Todos os direitos reservados.
        </p>
      </div>
    </div>
  );
});

Auth.displayName = 'Auth';

export default Auth;