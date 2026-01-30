import React, { useState, useEffect } from 'react';
import { Play, X, ChevronRight, Lightbulb, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useNavigate } from 'react-router-dom';

interface OnboardingTourProps {
  onLoadExample: () => void;
  isFreePlan?: boolean;
}

const ONBOARDING_KEY = 'precigraf_onboarding_seen';

const OnboardingTour: React.FC<OnboardingTourProps> = ({ onLoadExample, isFreePlan = true }) => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    const hasSeenOnboarding = localStorage.getItem(ONBOARDING_KEY);
    if (!hasSeenOnboarding) {
      setIsOpen(true);
    }
  }, []);

  const handleClose = () => {
    localStorage.setItem(ONBOARDING_KEY, 'true');
    setIsOpen(false);
    setStep(0);
  };

  const handleLoadExample = () => {
    localStorage.setItem(ONBOARDING_KEY, 'true');
    setIsOpen(false);
    onLoadExample();
  };

  const steps = [
    {
      title: 'Bem-vindo ao PreciGraf! 👋',
      description: 'A calculadora inteligente de preços para gráficas e artesãos. Calcule custos, margens e preços de venda de forma rápida e precisa.',
      icon: '🎯',
    },
    {
      title: 'Como funciona?',
      description: 'Preencha os custos de matéria-prima por unidade, os custos operacionais do lote, defina sua margem de lucro e veja o preço final automaticamente.',
      icon: '📊',
    },
    {
      title: 'Dica: Margens Inteligentes',
      description: 'Use o botão "Sugerir margem" para receber recomendações baseadas no tipo de produto e quantidade. Quanto maior o lote, menor a margem sugerida.',
      icon: '💡',
    },
    {
      title: 'Pronto para começar?',
      description: 'Clique em "Ver exemplo preenchido" para carregar dados de demonstração e entender como a calculadora funciona.',
      icon: '🚀',
    },
  ];

  const currentStep = steps[step];

  return (
    <>
      {/* Botão de exemplo */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(true)}
        className="gap-2 border-primary/30 text-primary hover:bg-primary/10"
      >
        <Play className="w-4 h-4" />
        Exemplo
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-md bg-card border-border [&>button]:hidden">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div className="text-4xl mb-2">{currentStep.icon}</div>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleClose}
                className="h-8 w-8 text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            <DialogTitle className="text-xl">{currentStep.title}</DialogTitle>
            <DialogDescription className="text-base">
              {currentStep.description}
            </DialogDescription>
          </DialogHeader>

          {/* Progress dots */}
          <div className="flex items-center justify-center gap-2 py-4">
            {steps.map((_, index) => (
              <button
                key={index}
                onClick={() => setStep(index)}
                className={`w-2 h-2 rounded-full transition-all ${
                  index === step ? 'bg-primary w-6' : 'bg-muted-foreground/30'
                }`}
              />
            ))}
          </div>

          <div className="flex gap-3">
            {step < steps.length - 1 ? (
              <>
                <Button
                  variant="ghost"
                  onClick={handleClose}
                  className="flex-1"
                >
                  Pular
                </Button>
                <Button
                  onClick={() => setStep(step + 1)}
                  className="flex-1 gap-2"
                >
                  Próximo
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="outline"
                  onClick={handleClose}
                  className="flex-1"
                >
                  Começar do zero
                </Button>
                <Button
                  onClick={handleLoadExample}
                  className="flex-1 gap-2 bg-primary hover:bg-primary/90"
                >
                  <Lightbulb className="w-4 h-4" />
                  Ver exemplo
                </Button>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default OnboardingTour;
