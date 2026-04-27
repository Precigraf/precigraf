import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Sparkles, Check, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';

const benefits = [
  'Cálculos ilimitados de precificação',
  'Orçamentos, pedidos e gestão completa',
  'Exportação em PDF e Excel',
  'Marketplace e simulador de quantidades',
  'Relatórios financeiros',
];

const TrialExpiredScreen: React.FC = () => {
  const navigate = useNavigate();
  const { signOut } = useAuth();

  const handleLogout = async () => {
    await signOut();
    navigate('/auth');
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="max-w-lg w-full p-8 text-center space-y-6">
        <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto">
          <Lock className="w-8 h-8 text-destructive" />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-foreground">
            Seu período de teste terminou
          </h1>
          <p className="text-muted-foreground">
            Os 2 dias gratuitos do PreciGraf chegaram ao fim. Para continuar usando o sistema, faça upgrade para o Plano Pro.
          </p>
        </div>

        <div className="bg-muted/40 rounded-xl p-5 text-left space-y-3">
          <p className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            Com o Plano Pro você desbloqueia:
          </p>
          <ul className="space-y-2">
            {benefits.map((b) => (
              <li key={b} className="flex items-start gap-2 text-sm text-muted-foreground">
                <Check className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                <span>{b}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="flex flex-col gap-2">
          <Button onClick={() => navigate('/upgrade')} className="w-full gap-2" size="lg">
            <Sparkles className="w-4 h-4" />
            Fazer upgrade agora
          </Button>
          <Button variant="ghost" onClick={handleLogout} className="w-full gap-2">
            <LogOut className="w-4 h-4" />
            Sair da conta
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default TrialExpiredScreen;
