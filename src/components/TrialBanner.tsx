import React from 'react';
import { Clock, Lock, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface TrialBannerProps {
  isTrialActive: boolean;
  isTrialExpired: boolean;
  trialRemainingHours: number;
  onUpgrade: () => void;
}

const TrialBanner: React.FC<TrialBannerProps> = ({
  isTrialActive,
  isTrialExpired,
  trialRemainingHours,
  onUpgrade,
}) => {
  // Don't show anything if neither active trial nor expired
  if (!isTrialActive && !isTrialExpired) {
    return null;
  }

  // Format remaining time
  const formatRemainingTime = (hours: number): string => {
    if (hours <= 0) return 'Expirado';
    if (hours < 1) return 'Menos de 1 hora';
    if (hours === 1) return '1 hora';
    if (hours < 24) return `${hours} horas`;
    const days = Math.floor(hours / 24);
    const remainingHours = hours % 24;
    if (days === 1) {
      return remainingHours > 0 ? `1 dia e ${remainingHours}h` : '1 dia';
    }
    return remainingHours > 0 ? `${days} dias e ${remainingHours}h` : `${days} dias`;
  };

  if (isTrialExpired) {
    return (
      <div className="w-full bg-destructive/10 border border-destructive/30 rounded-xl p-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="flex items-start gap-3 flex-1">
            <Lock className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
            <div className="text-left flex-1">
              <p className="text-base font-semibold text-destructive">Teste expirado</p>
              <p className="text-sm text-muted-foreground leading-snug">
                Seu período de teste terminou. Desbloqueie o sistema com o Plano Pro para continuar criando cálculos.
              </p>
            </div>
          </div>
          <Button
            onClick={(e) => {
              e.stopPropagation();
              onUpgrade();
            }}
            className="w-full sm:w-auto gap-2"
          >
            <Sparkles className="w-4 h-4" />
            Fazer upgrade
          </Button>
        </div>
      </div>
    );
  }

  // Trial active banner
  return (
    <div className="w-full bg-primary/10 border border-primary/30 rounded-xl p-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="flex items-start gap-3 flex-1">
          <Clock className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
          <div className="text-left flex-1">
            <p className="text-base font-semibold text-primary">Teste gratuito ativo</p>
            <p className="text-sm text-muted-foreground leading-snug">
              Expira em <span className="font-medium text-primary">{formatRemainingTime(trialRemainingHours)}</span>. Aproveite para conhecer o sistema!
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          onClick={(e) => {
            e.stopPropagation();
            onUpgrade();
          }}
          className="w-full sm:w-auto gap-2 border-primary/30 hover:bg-primary/10"
        >
          <Sparkles className="w-4 h-4" />
          Garantir acesso
        </Button>
      </div>
    </div>
  );
};

export default TrialBanner;
