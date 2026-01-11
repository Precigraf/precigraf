import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Loader2, Mail, Lock, User, CheckCircle } from 'lucide-react';
import LogoIcon from '@/components/LogoIcon';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

const Auth: React.FC = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading, signIn, signUp } = useAuth();

  // Form states
  const [activeTab, setActiveTab] = useState<'login' | 'signup'>('login');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Login form
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  // Signup form
  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupConfirmPassword, setSignupConfirmPassword] = useState('');
  const [signupError, setSignupError] = useState('');
  const [signupSuccess, setSignupSuccess] = useState(false);

  // Redirect if already logged in - use useCallback to prevent infinite loops
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

  const validatePassword = (password: string): boolean => {
    return password.length >= 8;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Prevent multiple submissions
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
      // Navigation will happen automatically via useEffect when user state updates
    } catch (err) {
      setLoginError('Erro inesperado. Tente novamente.');
      setIsLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Prevent multiple submissions
    if (isLoading) return;
    
    setSignupError('');
    setSignupSuccess(false);

    const trimmedName = signupName.trim();
    const trimmedEmail = signupEmail.trim().toLowerCase();
    const trimmedPassword = signupPassword;
    const trimmedConfirmPassword = signupConfirmPassword;

    if (!trimmedName || !trimmedEmail || !trimmedPassword || !trimmedConfirmPassword) {
      setSignupError('Preencha todos os campos');
      return;
    }

    if (trimmedName.length < 2) {
      setSignupError('Nome deve ter pelo menos 2 caracteres');
      return;
    }

    if (!validateEmail(trimmedEmail)) {
      setSignupError('Email inválido');
      return;
    }

    if (!validatePassword(trimmedPassword)) {
      setSignupError('A senha deve ter pelo menos 8 caracteres');
      return;
    }

    if (trimmedPassword !== trimmedConfirmPassword) {
      setSignupError('As senhas não coincidem');
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await signUp(trimmedEmail, trimmedPassword, trimmedName);

      if (error) {
        const errorMessage = error.message.toLowerCase();
        
        if (errorMessage.includes('already registered') || errorMessage.includes('user_repeated_signup')) {
          setSignupError('Este email já está cadastrado. Tente fazer login.');
        } else if (errorMessage.includes('signup_disabled') || errorMessage.includes('signups not allowed')) {
          setSignupError('Cadastros temporariamente desabilitados. Tente novamente em alguns minutos.');
        } else if (errorMessage.includes('weak_password')) {
          setSignupError('Senha muito fraca. Use letras, números e caracteres especiais.');
        } else if (errorMessage.includes('rate limit') || errorMessage.includes('too many requests')) {
          setSignupError('Muitas tentativas. Aguarde alguns minutos.');
        } else {
          setSignupError(`Erro ao criar conta: ${error.message}`);
        }
        setIsLoading(false);
        return;
      }

      setSignupSuccess(true);
      toast.success('Conta criada com sucesso! Bem-vindo ao PreciGraf.');

      // Clear form
      setSignupName('');
      setSignupEmail('');
      setSignupPassword('');
      setSignupConfirmPassword('');

      // With auto-confirm enabled, user is automatically logged in
      // Navigation will happen via useEffect when user state updates
    } catch (err) {
      setSignupError('Erro inesperado. Tente novamente.');
      setIsLoading(false);
    }
  };

  // Clear errors when switching tabs
  const handleTabChange = (value: string) => {
    setActiveTab(value as 'login' | 'signup');
    setLoginError('');
    setSignupError('');
    setSignupSuccess(false);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
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

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={handleTabChange}>
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="login" className="data-[state=active]:bg-foreground data-[state=active]:text-background">
                Entrar
              </TabsTrigger>
              <TabsTrigger value="signup" className="data-[state=active]:bg-foreground data-[state=active]:text-background">
                Criar conta
              </TabsTrigger>
            </TabsList>

            {/* Login Tab */}
            <TabsContent value="login" className="space-y-4">
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
            </TabsContent>

            {/* Signup Tab */}
            <TabsContent value="signup" className="space-y-4">
              <form onSubmit={handleSignup} className="space-y-4">
                {signupError && (
                  <Alert className="bg-destructive/10 border-destructive/30">
                    <AlertDescription className="text-destructive text-sm">
                      {signupError}
                    </AlertDescription>
                  </Alert>
                )}

                {signupSuccess && (
                  <Alert className="bg-green-500/10 border-green-500/30">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <AlertDescription className="text-green-500 text-sm ml-2">
                      Conta criada com sucesso! Redirecionando...
                    </AlertDescription>
                  </Alert>
                )}

                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Nome completo</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      type="text"
                      value={signupName}
                      onChange={(e) => setSignupName(e.target.value)}
                      placeholder="Seu nome"
                      className="input-currency pl-10"
                      disabled={isLoading}
                      maxLength={100}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      type="email"
                      value={signupEmail}
                      onChange={(e) => setSignupEmail(e.target.value)}
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
                      value={signupPassword}
                      onChange={(e) => setSignupPassword(e.target.value)}
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
                  <p className="text-xs text-muted-foreground">
                    A senha deve ter pelo menos 8 caracteres
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Confirmar senha</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={signupConfirmPassword}
                      onChange={(e) => setSignupConfirmPassword(e.target.value)}
                      placeholder="Digite a senha novamente"
                      className="input-currency pl-10 pr-10"
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showConfirmPassword ? (
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
                    'Criar conta'
                  )}
                </Button>

              </form>
            </TabsContent>
          </Tabs>
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-muted-foreground mt-6">
          © {new Date().getFullYear()} PreciGraf. Todos os direitos reservados.
        </p>
      </div>
    </div>
  );
};

export default Auth;
