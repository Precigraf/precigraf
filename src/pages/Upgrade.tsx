import React, { forwardRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Crown, Check, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Header from '@/components/Header';

const Upgrade = forwardRef<HTMLDivElement>((_, ref) => {
  const navigate = useNavigate();

  const features = [
    'Cálculos ilimitados',
    'Exportação para PDF e Excel',
    'Histórico completo',
    'Suporte prioritário',
    'Acesso a novos recursos',
  ];

  return (
    <div ref={ref} className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8 max-w-2xl">
        {/* Back button */}
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-6 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>

        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <Crown className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Plano Profissional</h1>
          <p className="text-muted-foreground">
            Desbloqueie todo o potencial do PreciGraf
          </p>
        </div>

        <Card className="bg-card border-border">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl flex items-center justify-center gap-2">
              <Zap className="w-6 h-6 text-primary" />
              Recursos Premium
            </CardTitle>
            <CardDescription>
              Tudo o que você precisa para precificar seus trabalhos gráficos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3 mb-6">
              {features.map((feature, index) => (
                <li key={index} className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Check className="w-3 h-3 text-primary" />
                  </div>
                  <span className="text-foreground">{feature}</span>
                </li>
              ))}
            </ul>

            <div className="text-center p-6 bg-muted/50 rounded-lg mb-6">
              <p className="text-sm text-muted-foreground mb-2">Em breve</p>
              <p className="text-3xl font-bold text-foreground">
                R$ 29,90<span className="text-lg font-normal text-muted-foreground">/mês</span>
              </p>
            </div>

            <Button 
              className="w-full gap-2" 
              size="lg"
              disabled
            >
              <Crown className="w-5 h-5" />
              Em breve disponível
            </Button>

            <p className="text-center text-xs text-muted-foreground mt-4">
              Estamos preparando a melhor experiência para você.
              Fique atento às novidades!
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
});

Upgrade.displayName = 'Upgrade';

export default Upgrade;
