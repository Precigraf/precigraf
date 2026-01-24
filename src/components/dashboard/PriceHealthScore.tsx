import React, { useMemo } from 'react';
import { Activity, TrendingUp, TrendingDown, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PriceHealthScoreProps {
  netMargin: number; // Margem líquida em %
  netProfit: number;
  totalFees: number; // Taxas de marketplace
  productionCost: number;
  finalSellingPrice: number;
  hasCouponApplied?: boolean;
  couponDiscountPercent?: number;
}

type HealthLevel = 'excellent' | 'good' | 'warning' | 'critical';

const PriceHealthScore: React.FC<PriceHealthScoreProps> = ({
  netMargin,
  netProfit,
  totalFees,
  productionCost,
  finalSellingPrice,
  hasCouponApplied = false,
  couponDiscountPercent = 0,
}) => {
  const analysis = useMemo(() => {
    // Calcular score baseado em múltiplos fatores
    let score = 100;
    let level: HealthLevel = 'excellent';
    const issues: string[] = [];
    const positives: string[] = [];

    // Fator 1: Margem líquida
    if (netMargin < 0) {
      score -= 50;
      issues.push('Operação com prejuízo');
    } else if (netMargin < 10) {
      score -= 35;
      issues.push('Margem muito baixa (< 10%)');
    } else if (netMargin < 20) {
      score -= 20;
      issues.push('Margem abaixo do ideal (< 20%)');
    } else if (netMargin < 30) {
      score -= 10;
      issues.push('Margem razoável, considere aumentar');
    } else {
      positives.push('Margem saudável');
    }

    // Fator 2: Impacto das taxas
    const feeImpact = finalSellingPrice > 0 ? (totalFees / finalSellingPrice) * 100 : 0;
    if (feeImpact > 30) {
      score -= 25;
      issues.push('Taxas consumindo mais de 30% do preço');
    } else if (feeImpact > 20) {
      score -= 15;
      issues.push('Taxas elevadas (> 20%)');
    } else if (feeImpact > 10) {
      score -= 5;
    } else if (feeImpact > 0) {
      positives.push('Taxas sob controle');
    }

    // Fator 3: Lucro vs Custo
    const profitRatio = productionCost > 0 ? netProfit / productionCost : 0;
    if (profitRatio < 0) {
      score -= 20;
    } else if (profitRatio < 0.1) {
      score -= 10;
      issues.push('Lucro muito baixo em relação ao custo');
    } else if (profitRatio >= 0.3) {
      positives.push('Boa relação lucro/custo');
    }

    // Fator 4: Cupom aplicado
    if (hasCouponApplied) {
      if (couponDiscountPercent > 30) {
        score -= 15;
        issues.push('Desconto agressivo pode comprometer lucro');
      } else if (couponDiscountPercent > 20) {
        score -= 8;
        issues.push('Desconto promocional moderado');
      } else if (couponDiscountPercent > 0) {
        score -= 3;
      }
    }

    // Normalizar score
    score = Math.max(0, Math.min(100, score));

    // Determinar nível
    if (score >= 80) {
      level = 'excellent';
    } else if (score >= 60) {
      level = 'good';
    } else if (score >= 40) {
      level = 'warning';
    } else {
      level = 'critical';
    }

    return { score, level, issues, positives };
  }, [netMargin, netProfit, totalFees, productionCost, finalSellingPrice, hasCouponApplied, couponDiscountPercent]);

  const getColorClasses = (level: HealthLevel) => {
    switch (level) {
      case 'excellent':
        return {
          bg: 'bg-success/10',
          border: 'border-success/30',
          text: 'text-success',
          icon: CheckCircle,
          label: 'Excelente',
        };
      case 'good':
        return {
          bg: 'bg-primary/10',
          border: 'border-primary/30',
          text: 'text-primary',
          icon: TrendingUp,
          label: 'Bom',
        };
      case 'warning':
        return {
          bg: 'bg-warning/10',
          border: 'border-warning/30',
          text: 'text-warning',
          icon: AlertTriangle,
          label: 'Atenção',
        };
      case 'critical':
        return {
          bg: 'bg-destructive/10',
          border: 'border-destructive/30',
          text: 'text-destructive',
          icon: XCircle,
          label: 'Crítico',
        };
    }
  };

  const colors = getColorClasses(analysis.level);
  const IconComponent = colors.icon;

  // Calcular ângulo para o gauge
  const gaugeAngle = (analysis.score / 100) * 180;

  return (
    <div className={cn('rounded-xl border p-4', colors.bg, colors.border)}>
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center', colors.bg)}>
          <Activity className={cn('w-4 h-4', colors.text)} />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-foreground">Score de Saúde do Preço</h3>
          <p className="text-xs text-muted-foreground">Avaliação geral da precificação</p>
        </div>
      </div>

      {/* Score Visual */}
      <div className="flex items-center justify-center mb-4">
        <div className="relative w-32 h-16 overflow-hidden">
          {/* Gauge background */}
          <div className="absolute inset-0 rounded-t-full bg-secondary/30" />
          
          {/* Gauge fill */}
          <div
            className={cn('absolute bottom-0 left-1/2 w-1 h-14 origin-bottom transition-transform duration-500', colors.bg)}
            style={{ transform: `translateX(-50%) rotate(${gaugeAngle - 90}deg)` }}
          >
            <div className={cn('w-3 h-3 rounded-full -ml-1 -mt-1', colors.text.replace('text-', 'bg-'))} />
          </div>

          {/* Score display */}
          <div className="absolute inset-x-0 bottom-0 text-center">
            <span className={cn('text-2xl font-bold', colors.text)}>{analysis.score}</span>
            <span className="text-xs text-muted-foreground">/100</span>
          </div>
        </div>
      </div>

      {/* Status Badge */}
      <div className="flex items-center justify-center gap-2 mb-3">
        <IconComponent className={cn('w-4 h-4', colors.text)} />
        <span className={cn('text-sm font-semibold', colors.text)}>{colors.label}</span>
      </div>

      {/* Issues & Positives */}
      {(analysis.issues.length > 0 || analysis.positives.length > 0) && (
        <div className="space-y-2 text-xs">
          {analysis.issues.map((issue, i) => (
            <div key={`issue-${i}`} className="flex items-start gap-1.5 text-muted-foreground">
              <TrendingDown className="w-3 h-3 mt-0.5 text-warning flex-shrink-0" />
              <span>{issue}</span>
            </div>
          ))}
          {analysis.positives.map((positive, i) => (
            <div key={`positive-${i}`} className="flex items-start gap-1.5 text-muted-foreground">
              <TrendingUp className="w-3 h-3 mt-0.5 text-success flex-shrink-0" />
              <span>{positive}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PriceHealthScore;
