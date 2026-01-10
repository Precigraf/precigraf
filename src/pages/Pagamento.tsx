import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Calculator, Clock, LogOut, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';

const Pagamento: React.FC = () => {
  const navigate = useNavigate();
  const { user, userData, signOut } = useAuth();

  const handleLogout = async () => {
    await signOut();
    navigate('/auth');
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      {/* Background gradient effect */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-warning/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-warning/5 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md relative z-10">
        <div className="glass-card p-8 text-center animate-slide-up">
          {/* Logo */}
          <div className="flex flex-col items-center mb-6">
            <div className="w-16 h-16 rounded-2xl bg-warning/20 flex items-center justify-center mb-4">
              <Clock className="w-8 h-8 text-warning" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">Acesso Pendente</h1>
          </div>

          {/* User info */}
          {userData && (
            <div className="bg-secondary/50 rounded-lg p-4 mb-6">
              <p className="text-sm text-muted-foreground mb-1">Conta:</p>
              <p className="font-medium text-foreground">{userData.name || userData.email}</p>
              <p className="text-sm text-muted-foreground">{userData.email}</p>
            </div>
          )}

          {/* Message */}
          <div className="space-y-4 mb-8">
            <p className="text-muted-foreground">
              Sua conta foi criada com sucesso, mas o acesso ao sistema ainda não foi liberado.
            </p>
            <p className="text-muted-foreground">
              O acesso será liberado automaticamente após a confirmação do pagamento.
            </p>
          </div>

          {/* Contact */}
          <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-center gap-2 text-primary">
              <Mail className="w-4 h-4" />
              <span className="text-sm">
                Dúvidas? Entre em contato com o suporte.
              </span>
            </div>
          </div>

          {/* Logout button */}
          <Button
            variant="outline"
            onClick={handleLogout}
            className="w-full gap-2"
          >
            <LogOut className="w-4 h-4" />
            Sair
          </Button>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-center gap-2 mt-6">
          <Calculator className="w-4 h-4 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            PreciGraf - Calculadora de Preços
          </p>
        </div>
      </div>
    </div>
  );
};

export default Pagamento;
