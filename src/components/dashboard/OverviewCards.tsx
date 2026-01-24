import React from 'react';
import { DollarSign, TrendingUp, Percent, Tag, Lock, Sparkles } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface OverviewCardsProps {
  healthScore: number;
  healthLevel: 'excellent' | 'good' | 'warning' | 'critical';
  unitProfit: number;
  currentMargin: number;
  finalPrice: number;
  quantity: number;
  isPro: boolean;
}

const OverviewCards: React.FC<OverviewCardsProps> = ({
  healthScore,
  healthLevel,
  unitProfit,
  currentMargin,
  finalPrice,
  quantity,
  isPro,
}) => {
  const formatCurrency = (value: number) => {
    if (!Number.isFinite(value) || isNaN(value)) {
      return 'R$ 0,00';
    }
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const getHealthColor = (level: string) => {
    switch (level) {
      case 'excellent': return 'text-success';
      case 'good': return 'text-primary';
      case 'warning': return 'text-warning';
      case 'critical': return 'text-destructive';
      default: return 'text-muted-foreground';
    }
  };

  const getHealthLabel = (level: string) => {
    switch (level) {
      case 'excellent': return 'Excelente';
      case 'good': return 'Bom';
      case 'warning': return 'Atenção';
      case 'critical': return 'Crítico';
      default: return '-';
    }
  };

  const cards = [
    {
      id: 'health',
      icon: <TrendingUp className="w-4 h-4" />,
      label: 'Score de Saúde',
      value: `${healthScore}/100`,
      subValue: getHealthLabel(healthLevel),
      color: getHealthColor(healthLevel),
      proOnly: true,
    },
    {
      id: 'unit-profit',
      icon: <DollarSign className="w-4 h-4" />,
      label: 'Lucro por Unidade',
      value: formatCurrency(unitProfit),
      subValue: quantity > 0 ? `${quantity} unidades` : '-',
      color: unitProfit > 0 ? 'text-success' : unitProfit < 0 ? 'text-destructive' : 'text-muted-foreground',
      proOnly: false,
    },
    {
      id: 'margin',
      icon: <Percent className="w-4 h-4" />,
      label: 'Margem Atual',
      value: `${currentMargin.toFixed(1)}%`,
      subValue: currentMargin >= 30 ? 'Saudável' : currentMargin >= 20 ? 'Moderada' : 'Baixa',
      color: currentMargin >= 30 ? 'text-success' : currentMargin >= 20 ? 'text-warning' : 'text-destructive',
      proOnly: false,
    },
    {
      id: 'price',
      icon: <Tag className="w-4 h-4" />,
      label: 'Preço Final',
      value: formatCurrency(finalPrice),
      subValue: quantity > 0 ? `${formatCurrency(finalPrice / quantity)}/un` : '-',
      color: 'text-primary',
      proOnly: false,
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {cards.map((card) => {
        const isLocked = card.proOnly && !isPro;
        
        return (
          <Card 
            key={card.id} 
            className={cn(
              'relative overflow-hidden',
              isLocked && 'opacity-70'
            )}
          >
            {isLocked && (
              <div className="absolute inset-0 bg-background/60 backdrop-blur-[1px] z-10 flex items-center justify-center">
                <Badge variant="outline" className="text-[10px] bg-background/80">
                  <Lock className="w-2.5 h-2.5 mr-0.5" />
                  PRO
                </Badge>
              </div>
            )}
            
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className={cn('w-6 h-6 rounded-md flex items-center justify-center bg-secondary', card.color)}>
                  {card.icon}
                </div>
                <span className="text-xs text-muted-foreground">{card.label}</span>
                {card.proOnly && isPro && (
                  <Sparkles className="w-3 h-3 text-primary ml-auto" />
                )}
              </div>
              <p className={cn('text-xl font-bold', isLocked ? 'text-muted-foreground' : card.color)}>
                {isLocked ? '---' : card.value}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {isLocked ? 'Faça upgrade' : card.subValue}
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default OverviewCards;
