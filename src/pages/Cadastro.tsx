import React, { useState, useEffect, useCallback, forwardRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff, Loader2, Mail, Lock, User } from 'lucide-react';
import LogoIcon from '@/components/LogoIcon';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

const Cadastro = forwardRef<HTMLDivElement>((_, ref) => {
  const navigate = useNavigate();
  const { user, loading: authLoading, signUp } = useAuth();

  // Form states
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Signup form
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  // Redirect if already logged in
  const handleRedirect = useCallback(() => {
    if (!authLoading && user) {
      navigate('/', { replace: true });
    }
  }, [authLoading, user, navigate]);

  useEffect(() => {
    handleRedirect();
  }, [handleRedirect]);

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email.trim());
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isLoading) return;
    
    setError('');

    const trimmedName = name.trim();
    const trimmedEmail = email.trim().toLowerCase();
    const trimmedPassword = password;

    if (!trimmedName || !trimmedEmail || !trimmedPassword) {
      setError('Preencha todos os campos');
      return;
    }

    if (trimmedName.length < 2) {
      setError('Nome deve ter pelo menos 2 caracteres');
      return;
    }

    if (!validateEmail(trimmedEmail)) {
      setError('Email inválido');
      return;
    }

    if (trimmedPassword.length < 8) {
      setError('Senha deve ter pelo menos 8 caracteres');
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await signUp(trimmedEmail, trimmedPassword, trimmedName);

      if (error) {
        const errorMessage = error.message.toLowerCase();
        
        if (errorMessage.includes('user already registered') || errorMessage.includes('already been registered')) {
          setError('Este email já está cadastrado');
        } else if (errorMessage.includes('password')) {
          setError('Senha muito fraca. Use letras e números.');
        } else if (errorMessage.includes('too many requests') || errorMessage.includes('rate limit')) {
          setError('Muitas tentativas. Aguarde alguns minutos.');
        } else {
          setError('Erro ao criar conta. Tente novamente.');
        }
        setIsLoading(false);
        return;
      }

      toast.success('Conta criada! Bem-vindo ao PreciGraf.');
      navigate('/', { replace: true });
    } catch (err) {
      setError('Erro inesperado. Tente novamente.');
      setIsLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div ref={ref} className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
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
            <h1 className="text-2xl font-bold text-foreground">Criar Conta</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Comece a usar o PreciGraf gratuitamente
            </p>
          </div>

          {/* Signup Form */}
          <form onSubmit={handleSignUp} className="space-y-4">
            {error && (
              <Alert className="bg-destructive/10 border-destructive/30">
                <AlertDescription className="text-destructive text-sm">
                  {error}
                </AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Nome</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Seu nome completo"
                  className="input-currency pl-10"
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
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
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mínimo 8 caracteres"
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
                  Criando conta...
                </>
              ) : (
                'Criar conta gratuita'
              )}
            </Button>
          </form>

          {/* Link to login */}
          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              Já tem uma conta?{' '}
              <Link to="/auth" className="text-primary hover:underline font-medium">
                Entrar
              </Link>
            </p>
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

Cadastro.displayName = 'Cadastro';

export default Cadastro;
