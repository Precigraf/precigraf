import React, { useState, useMemo } from 'react';
import { Ticket, Scale, TrendingDown, Tag, Percent, AlertTriangle, XCircle, Lock, Sparkles } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';

interface CouponComparisonProps {
  finalSellingPrice: number;
  unitPrice: number;
  quantity: number;
  totalCost: number;
  profit: number;
  isPro: boolean;
  onShowUpgrade?: () => void;
}

const CouponComparison: React.FC<CouponComparisonProps> = ({
  finalSellingPrice,
  unitPrice,
  quantity,
  totalCost,
  profit,
  isPro,
  onShowUpgrade,
}) => {
  const [discountPercentage, setDiscountPercentage] = useState(10);

  const formatCurrency = (value: number) => {
    if (!Number.isFinite(value) || isNaN(value)) {
      return 'R$ 0,00';
    }
    const rounded = Math.round(value * 100) / 100;
    return rounded.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const calculations = useMemo(() => {
    const discountValue = Math.round((finalSellingPrice * discountPercentage) / 100 * 100) / 100;
    const priceWithCoupon = Math.round((finalSellingPrice - discountValue) * 100) / 100;
    const unitPriceWithCoupon = quantity > 0 ? Math.round((priceWithCoupon / quantity) * 100) / 100 : 0;
    
    const profitWithoutCoupon = profit;
    const profitWithCoupon = Math.round((priceWithCoupon - totalCost) * 100) / 100;
    const profitDifference = Math.round((profitWithoutCoupon - profitWithCoupon) * 100) / 100;
    
    // Margens
    const marginWithoutCoupon = finalSellingPrice > 0 ? (profitWithoutCoupon / finalSellingPrice) * 100 : 0;
    const marginWithCoupon = priceWithCoupon > 0 ? (profitWithCoupon / priceWithCoupon) * 100 : 0;
    
    // Alertas
    const isCritical = profitWithCoupon <= 0;
    const isWarning = !isCritical && marginWithCoupon < 30;

    return {
      discountValue,
      priceWithCoupon,
      unitPriceWithCoupon,
      profitWithoutCoupon,
      profitWithCoupon,
      profitDifference,
      marginWithoutCoupon,
      marginWithCoupon,
      isCritical,
      isWarning,
    };
  }, [finalSellingPrice, discountPercentage, quantity, profit, totalCost]);

  // Versão bloqueada
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
              <Scale className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground">Comparação de Cupom</h3>
              <p className="text-xs text-muted-foreground">Sem cupom vs Com cupom</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="h-24 bg-secondary/50 rounded-lg" />
            <div className="h-24 bg-secondary/50 rounded-lg" />
          </div>
        </div>
      </div>
    );
  }

  if (finalSellingPrice <= 0) {
    return (
      <div className="bg-secondary/30 border border-border rounded-xl p-4">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Scale className="w-4 h-4 text-primary" />
          </div>
          <h3 className="text-sm font-semibold text-foreground">Comparação de Cupom</h3>
        </div>
        <p className="text-xs text-muted-foreground">
          Preencha os dados do cálculo para comparar cenários.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-primary/5 via-background to-primary/5 border border-primary/20 rounded-xl p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Scale className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">Comparação de Cupom</h3>
            <p className="text-xs text-muted-foreground">Simule o impacto de descontos</p>
          </div>
        </div>
        <Badge variant="outline" className="text-xs bg-primary/10 border-primary/30 text-primary">
          <Sparkles className="w-3 h-3 mr-1" />
          PRO
        </Badge>
      </div>

      {/* Slider */}
      <div className="space-y-3 mb-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground flex items-center gap-1">
            <Percent className="w-3.5 h-3.5" />
            Desconto
          </span>
          <span className="font-bold text-primary text-lg">{discountPercentage}%</span>
        </div>
        
        <Slider
          value={[discountPercentage]}
          onValueChange={(value) => setDiscountPercentage(value[0])}
          max={50}
          min={1}
          step={1}
          className="py-2"
        />
        
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>1%</span>
          <span>50%</span>
        </div>
      </div>

      {/* Alertas */}
      {calculations.isCritical && (
        <Alert variant="destructive" className="mb-4 border-destructive/50 bg-destructive/10">
          <XCircle className="h-4 w-4" />
          <AlertDescription className="text-sm">
            <strong>Prejuízo!</strong> Este desconto elimina todo o lucro.
          </AlertDescription>
        </Alert>
      )}

      {calculations.isWarning && (
        <Alert className="mb-4 border-warning/50 bg-warning/10">
          <AlertTriangle className="h-4 w-4 text-warning" />
          <AlertDescription className="text-sm text-warning-foreground">
            <strong>Atenção:</strong> Margem abaixo de 30%.
          </AlertDescription>
        </Alert>
      )}

      {/* Comparação */}
      <div className="bg-background/80 rounded-lg overflow-hidden">
        <div className="grid grid-cols-2">
          {/* Sem Cupom */}
          <div className="p-4 border-r border-border/50">
            <div className="flex items-center gap-1.5 mb-3">
              <div className="w-2 h-2 rounded-full bg-muted-foreground" />
              <span className="text-xs font-semibold text-muted-foreground uppercase">Sem Cupom</span>
            </div>
            
            <div className="space-y-3">
              <div>
                <p className="text-xs text-muted-foreground">Preço Final</p>
                <p className="text-lg font-bold text-foreground">{formatCurrency(finalSellingPrice)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Lucro</p>
                <p className="text-base font-bold text-success">{formatCurrency(calculations.profitWithoutCoupon)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Margem</p>
                <p className="text-sm font-medium text-foreground">{calculations.marginWithoutCoupon.toFixed(1)}%</p>
              </div>
            </div>
          </div>

          {/* Com Cupom */}
          <div className="p-4">
            <div className="flex items-center gap-1.5 mb-3">
              <div className="w-2 h-2 rounded-full bg-primary" />
              <span className="text-xs font-semibold text-primary uppercase">Com Cupom</span>
            </div>
            
            <div className="space-y-3">
              <div>
                <p className="text-xs text-muted-foreground">Preço Final</p>
                <p className="text-lg font-bold text-primary">{formatCurrency(calculations.priceWithCoupon)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Lucro</p>
                <p className={cn(
                  'text-base font-bold',
                  calculations.isCritical && 'text-destructive',
                  calculations.isWarning && !calculations.isCritical && 'text-warning',
                  !calculations.isCritical && !calculations.isWarning && 'text-success'
                )}>
                  {formatCurrency(calculations.profitWithCoupon)}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Margem</p>
                <p className={cn(
                  'text-sm font-medium',
                  calculations.marginWithCoupon < 20 && 'text-destructive',
                  calculations.marginWithCoupon >= 20 && calculations.marginWithCoupon < 30 && 'text-warning',
                  calculations.marginWithCoupon >= 30 && 'text-foreground'
                )}>
                  {calculations.marginWithCoupon.toFixed(1)}%
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Resumo */}
        <div className="p-3 border-t border-border/50 bg-secondary/20 space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground flex items-center gap-1">
              <Tag className="w-3.5 h-3.5 text-destructive" />
              Valor do desconto
            </span>
            <span className="font-semibold text-destructive">-{formatCurrency(calculations.discountValue)}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground flex items-center gap-1">
              <TrendingDown className="w-3.5 h-3.5 text-warning" />
              Redução no lucro
            </span>
            <span className="font-semibold text-warning">-{formatCurrency(calculations.profitDifference)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CouponComparison;
