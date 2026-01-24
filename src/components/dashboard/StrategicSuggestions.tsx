import React, { useMemo } from 'react';
import { Lightbulb, TrendingUp, Percent, Shield, Tag, ArrowRight, Sparkles, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface StrategicSuggestionsProps {
  netMargin: number;
  netProfit: number;
  totalFees: number;
  productionCost: number;
  finalSellingPrice: number;
  currentMarginPercent: number;
  hasCouponApplied?: boolean;
  couponDiscountPercent?: number;
  isPro: boolean;
  onApplyMargin?: (margin: number) => void;
  onShowUpgrade?: () => void;
}

interface Suggestion {
  id: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: {
    label: string;
    value?: number;
    type: 'margin' | 'info';
  };
  priority: 'high' | 'medium' | 'low';
}

const StrategicSuggestions: React.FC<StrategicSuggestionsProps> = ({
  netMargin,
  netProfit,
  totalFees,
  productionCost,
  finalSellingPrice,
  currentMarginPercent,
  hasCouponApplied = false,
  couponDiscountPercent = 0,
  isPro,
  onApplyMargin,
  onShowUpgrade,
}) => {
  const suggestions = useMemo(() => {
    const result: Suggestion[] = [];
    const feeImpact = finalSellingPrice > 0 ? (totalFees / finalSellingPrice) * 100 : 0;

    // Sugestão crítica: prejuízo
    if (netProfit < 0) {
      const minMarginNeeded = productionCost > 0 
        ? Math.ceil(((totalFees - netProfit) / productionCost) * 100) + 5
        : 30;
      
      result.push({
        id: 'loss-recovery',
        icon: <Shield className="w-4 h-4 text-destructive" />,
        title: 'Recuperar da situação de prejuízo',
        description: `Aumente sua margem para pelo menos ${minMarginNeeded}% para cobrir custos e taxas.`,
        action: {
          label: `Aplicar ${minMarginNeeded}%`,
          value: minMarginNeeded,
          type: 'margin',
        },
        priority: 'high',
      });
    }

    // Sugestão: margem baixa
    if (netMargin >= 0 && netMargin < 20 && netProfit >= 0) {
      const suggestedMargin = Math.max(currentMarginPercent + 10, 25);
      result.push({
        id: 'low-margin',
        icon: <TrendingUp className="w-4 h-4 text-warning" />,
        title: 'Aumentar margem de segurança',
        description: `Sua margem atual de ${netMargin.toFixed(1)}% está baixa. Considere aumentar para ter mais proteção.`,
        action: {
          label: `Aumentar para ${suggestedMargin}%`,
          value: suggestedMargin,
          type: 'margin',
        },
        priority: 'high',
      });
    }

    // Sugestão: taxas altas
    if (feeImpact > 20) {
      const adjustedMargin = currentMarginPercent + Math.ceil(feeImpact / 2);
      result.push({
        id: 'high-fees',
        icon: <Percent className="w-4 h-4 text-warning" />,
        title: 'Compensar taxas de marketplace',
        description: `Taxas representam ${feeImpact.toFixed(1)}% do preço. Ajuste a margem para compensar.`,
        action: {
          label: `Ajustar para ${adjustedMargin}%`,
          value: adjustedMargin,
          type: 'margin',
        },
        priority: 'medium',
      });
    }

    // Sugestão: cupom muito alto
    if (hasCouponApplied && couponDiscountPercent > 25) {
      result.push({
        id: 'high-coupon',
        icon: <Tag className="w-4 h-4 text-warning" />,
        title: 'Reduzir desconto promocional',
        description: `Desconto de ${couponDiscountPercent}% pode estar comprometendo seu lucro. Considere limitar a 15-20%.`,
        priority: 'medium',
      });
    }

    // Sugestão positiva: margem saudável
    if (netMargin >= 30 && netProfit > 0 && !hasCouponApplied) {
      result.push({
        id: 'healthy-margin',
        icon: <Sparkles className="w-4 h-4 text-success" />,
        title: 'Considerar promoção estratégica',
        description: 'Com margem saudável, você pode oferecer cupons de até 15% sem comprometer o lucro.',
        priority: 'low',
      });
    }

    // Sugestão: otimização geral
    if (netMargin >= 20 && netMargin < 35 && feeImpact < 15) {
      result.push({
        id: 'optimization',
        icon: <Lightbulb className="w-4 h-4 text-primary" />,
        title: 'Oportunidade de otimização',
        description: 'Avalie se custos operacionais podem ser reduzidos para aumentar a margem líquida.',
        priority: 'low',
      });
    }

    return result.sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
  }, [netMargin, netProfit, totalFees, productionCost, finalSellingPrice, currentMarginPercent, hasCouponApplied, couponDiscountPercent]);

  const handleAction = (suggestion: Suggestion) => {
    if (!isPro) {
      onShowUpgrade?.();
      return;
    }
    if (suggestion.action?.type === 'margin' && suggestion.action.value && onApplyMargin) {
      onApplyMargin(suggestion.action.value);
    }
  };

  // Versão bloqueada para FREE
  if (!isPro) {
    return (
      <div className="relative bg-secondary/30 border border-border rounded-xl p-4 overflow-hidden">
        <div className="absolute inset-0 bg-background/60 backdrop-blur-[1px] z-10 flex flex-col items-center justify-center gap-2">
          <Lock className="w-5 h-5 text-muted-foreground" />
          <Badge variant="outline" className="text-xs bg-background/80">
            <Sparkles className="w-3 h-3 mr-1" />
            Disponível no plano PRO
          </Badge>
          <Button size="sm" onClick={onShowUpgrade} className="mt-2 text-xs">
            Fazer upgrade
          </Button>
        </div>

        <div className="opacity-40 pointer-events-none select-none">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Lightbulb className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground">Sugestões Estratégicas</h3>
              <p className="text-xs text-muted-foreground">Recomendações automáticas</p>
            </div>
          </div>
          <div className="space-y-2">
            {[1, 2].map((i) => (
              <div key={i} className="h-16 bg-secondary/50 rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (suggestions.length === 0) {
    return (
      <div className="bg-success/5 border border-success/20 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 rounded-lg bg-success/10 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-success" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">Sugestões Estratégicas</h3>
            <p className="text-xs text-muted-foreground">Recomendações automáticas</p>
          </div>
        </div>
        <p className="text-sm text-success">
          Sua precificação está otimizada! Nenhuma sugestão no momento.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-secondary/30 border border-border rounded-xl p-4">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
          <Lightbulb className="w-4 h-4 text-primary" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-foreground">Sugestões Estratégicas</h3>
          <p className="text-xs text-muted-foreground">{suggestions.length} recomendação(ões)</p>
        </div>
      </div>

      <div className="space-y-3">
        {suggestions.slice(0, 3).map((suggestion) => (
          <div
            key={suggestion.id}
            className={cn(
              'p-3 rounded-lg border',
              suggestion.priority === 'high' && 'bg-destructive/5 border-destructive/20',
              suggestion.priority === 'medium' && 'bg-warning/5 border-warning/20',
              suggestion.priority === 'low' && 'bg-primary/5 border-primary/20'
            )}
          >
            <div className="flex items-start gap-2">
              <div className="mt-0.5">{suggestion.icon}</div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-medium text-foreground">{suggestion.title}</h4>
                <p className="text-xs text-muted-foreground mt-0.5">{suggestion.description}</p>
                {suggestion.action && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="mt-2 h-7 text-xs"
                    onClick={() => handleAction(suggestion)}
                  >
                    {suggestion.action.label}
                    <ArrowRight className="w-3 h-3 ml-1" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default StrategicSuggestions;
