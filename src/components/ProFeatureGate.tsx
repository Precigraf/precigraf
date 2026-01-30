import React from 'react';
import { Lock, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface ProFeatureGateProps {
  isPro: boolean;
  onUpgrade: () => void;
  children: React.ReactNode;
  featureName?: string;
  message?: string;
}

const ProFeatureGate: React.FC<ProFeatureGateProps> = ({
  isPro,
  onUpgrade,
  children,
  featureName = 'Recurso',
  message = 'Disponível apenas no Plano Pro',
}) => {
  if (isPro) {
    return <>{children}</>;
  }

  return (
    <div 
      className="relative overflow-hidden rounded-xl"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onUpgrade();
      }}
    >
      {/* Overlay de bloqueio */}
      <div className="absolute inset-0 bg-background/70 backdrop-blur-[2px] z-10 flex flex-col items-center justify-center gap-2 cursor-pointer">
        <Lock className="w-5 h-5 text-muted-foreground" />
        <Badge variant="outline" className="text-xs bg-background/80">
          <Sparkles className="w-3 h-3 mr-1" />
          {message}
        </Badge>
        <Button
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            onUpgrade();
          }}
          className="mt-2 text-xs pointer-events-auto opacity-100"
        >
          Fazer upgrade
        </Button>
      </div>

      {/* Conteúdo bloqueado (visível mas desativado) */}
      <div className="opacity-70 pointer-events-none select-none filter grayscale">
        {children}
      </div>
    </div>
  );
};

export default ProFeatureGate;
