import React, { useState, useMemo } from 'react';
import { Ticket, Lock, Sparkles, Tag, ArrowRight, Percent, AlertTriangle, TrendingDown, Scale } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useNavigate } from 'react-router-dom';

interface CouponStrategyProps {
  finalSellingPrice: number;
  unitPrice: number;
  quantity: number;
  totalCost: number;
  profit: number;
  isPro: boolean;
  onShowUpgrade?: () => void;
}

type AlertType = 'none' | 'warning' | 'critical';

const CouponStrategy: React.FC<CouponStrategyProps> = ({
  finalSellingPrice,
  unitPrice,
  quantity,
  totalCost,
  profit,
  isPro,
  onShowUpgrade,
}) => {
  const navigate = useNavigate();
  const [discountPercentage, setDiscountPercentage] = useState(10);
  const [isExpanded, setIsExpanded] = useState(false);

  const formatCurrency = (value: number) => {
    if (!Number.isFinite(value) || isNaN(value)) {
      return 'R$ 0,00';
    }
    const rounded = Math.round(value * 100) / 100;
    return rounded.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });
  };

  // Cálculos com e sem cupom
  const calculations = useMemo(() => {
    const discountValue = Math.round((finalSellingPrice * discountPercentage) / 100 * 100) / 100;
    const priceWithCoupon = Math.round((finalSellingPrice - discountValue) * 100) / 100;
    const unitPriceWithCoupon = quantity > 0 ? Math.round((priceWithCoupon / quantity) * 100) / 100 : 0;
    
    // Lucro sem cupom (já vem da prop)
    const profitWithoutCoupon = profit;
    
    // Lucro com cupom = Preço com cupom - Custo total
    const profitWithCoupon = Math.round((priceWithCoupon - totalCost) * 100) / 100;
    
    // Diferença no lucro
    const profitDifference = Math.round((profitWithoutCoupon - profitWithCoupon) * 100) / 100;
    
    // Margem ideal (consideramos 30% como mínimo saudável)
    const idealMinProfitMargin = 0.3;
    const profitMarginWithCoupon = priceWithCoupon > 0 ? profitWithCoupon / priceWithCoupon : 0;
    
    // Tipo de alerta
    let alertType: AlertType = 'none';
    if (profitWithCoupon <= 0) {
      alertType = 'critical';
    } else if (profitMarginWithCoupon < idealMinProfitMargin) {
      alertType = 'warning';
    }

    return {
      discountValue,
      priceWithCoupon,
      unitPriceWithCoupon,
      profitWithoutCoupon,
      profitWithCoupon,
      profitDifference,
      profitMarginWithCoupon,
      alertType,
    };
  }, [finalSellingPrice, discountPercentage, quantity, profit, totalCost]);

  const handleUpgradeClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onShowUpgrade) {
      onShowUpgrade();
    } else {
      navigate('/upgrade');
    }
  };

  const handleToggleExpand = () => {
    if (!isPro) {
      handleUpgradeClick({} as React.MouseEvent);
      return;
    }
    setIsExpanded(!isExpanded);
  };

  // Versão bloqueada para usuários FREE
  if (!isPro) {
    return (
      <div className="relative bg-secondary/30 border border-border rounded-xl p-4 overflow-hidden">
        {/* Overlay de bloqueio */}
        <div className="absolute inset-0 bg-background/60 backdrop-blur-[1px] z-10 flex flex-col items-center justify-center gap-2">
          <Lock className="w-5 h-5 text-muted-foreground" />
          <Badge variant="outline" className="text-xs bg-background/80">
            <Sparkles className="w-3 h-3 mr-1" />
            Disponível no plano PRO
          </Badge>
          <Button
            size="sm"
            onClick={handleUpgradeClick}
            className="mt-2 text-xs"
          >
            Fazer upgrade
          </Button>
        </div>

        {/* Conteúdo borrado */}
        <div className="opacity-40 pointer-events-none select-none">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Ticket className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground">Estratégia de Cupom</h3>
              <p className="text-xs text-muted-foreground">Simule descontos promocionais</p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Desconto</span>
              <span className="font-medium">10%</span>
            </div>
            <div className="h-2 bg-secondary rounded-full" />
            
            {/* Preview bloqueado das novas funcionalidades */}
            <div className="mt-3 p-2 bg-secondary/50 rounded-lg">
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Scale className="w-3 h-3" />
                <span>Comparação e Alertas de Lucro</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Versão completa para usuários PRO
  return (
    <div className="bg-gradient-to-br from-primary/5 via-background to-primary/5 border border-primary/20 rounded-xl p-4">
      {/* Header */}
      <button
        onClick={handleToggleExpand}
        className="w-full flex items-center justify-between mb-3 cursor-pointer hover:opacity-80 transition-opacity"
      >
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Ticket className="w-4 h-4 text-primary" />
          </div>
          <div className="text-left">
            <h3 className="text-sm font-semibold text-foreground">Estratégia de Cupom</h3>
            <p className="text-xs text-muted-foreground">Simule descontos promocionais</p>
          </div>
        </div>
        <Badge variant="outline" className="text-xs bg-primary/10 border-primary/30 text-primary">
          <Sparkles className="w-3 h-3 mr-1" />
          PRO
        </Badge>
      </button>

      {/* Conteúdo expandido */}
      {isExpanded && finalSellingPrice > 0 && (
        <div className="space-y-4 pt-2 border-t border-border/50">
          {/* Slider de desconto */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground flex items-center gap-1">
                <Percent className="w-3.5 h-3.5" />
                Percentual de desconto
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

          {/* ========================================
              ALERTA DE DESCONTO QUE ZERA O LUCRO
              ======================================== */}
          {calculations.alertType === 'critical' && (
            <Alert variant="destructive" className="border-destructive/50 bg-destructive/10">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="text-sm">
                <strong>Atenção!</strong> Este desconto está <strong>zerando seu lucro</strong> ou gerando prejuízo. 
                Considere reduzir o percentual de desconto para manter a saúde financeira da venda.
              </AlertDescription>
            </Alert>
          )}

          {calculations.alertType === 'warning' && (
            <Alert className="border-warning/50 bg-warning/10">
              <TrendingDown className="h-4 w-4 text-warning" />
              <AlertDescription className="text-sm text-warning-foreground">
                <strong>Aviso:</strong> Este desconto reduz sua margem de lucro para abaixo de 30%. 
                A venda pode ser financeiramente arriscada. Avalie com cuidado antes de aplicar.
              </AlertDescription>
            </Alert>
          )}

          {/* ========================================
              COMPARAÇÃO: SEM CUPOM vs COM CUPOM
              ======================================== */}
          <div className="bg-background/80 rounded-lg overflow-hidden">
            {/* Título da comparação */}
            <div className="flex items-center gap-2 p-3 bg-secondary/30 border-b border-border/50">
              <Scale className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-foreground">Comparação de Cenários</span>
            </div>

            <div className="p-4">
              {/* Grid de comparação lado a lado */}
              <div className="grid grid-cols-2 gap-4">
                {/* Coluna SEM Cupom */}
                <div className="space-y-3">
                  <div className="flex items-center gap-1.5 pb-2 border-b border-border/50">
                    <div className="w-2 h-2 rounded-full bg-muted-foreground" />
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Sem Cupom</span>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground">Preço Final</p>
                      <p className="text-base font-bold text-foreground">{formatCurrency(finalSellingPrice)}</p>
                    </div>
                    
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground">Lucro</p>
                      <p className="text-base font-bold text-success">{formatCurrency(calculations.profitWithoutCoupon)}</p>
                    </div>
                  </div>
                </div>

                {/* Coluna COM Cupom */}
                <div className="space-y-3">
                  <div className="flex items-center gap-1.5 pb-2 border-b border-primary/30">
                    <div className="w-2 h-2 rounded-full bg-primary" />
                    <span className="text-xs font-semibold text-primary uppercase tracking-wide">Com Cupom</span>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground">Preço Final</p>
                      <p className="text-base font-bold text-primary">{formatCurrency(calculations.priceWithCoupon)}</p>
                    </div>
                    
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground">Lucro</p>
                      <p className={`text-base font-bold ${calculations.profitWithCoupon <= 0 ? 'text-destructive' : calculations.alertType === 'warning' ? 'text-warning' : 'text-success'}`}>
                        {formatCurrency(calculations.profitWithCoupon)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Resumo do impacto */}
              <div className="mt-4 pt-3 border-t border-dashed border-border space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <Tag className="w-3.5 h-3.5 text-destructive" />
                    Desconto total aplicado
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

                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Preço unitário com cupom</span>
                  <span className="font-medium text-primary">{formatCurrency(calculations.unitPriceWithCoupon)}/un</span>
                </div>
              </div>
            </div>
          </div>

          {/* Nota informativa */}
          <div className="flex items-start gap-2 text-xs text-muted-foreground bg-secondary/30 rounded-lg p-3">
            <ArrowRight className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
            <p>
              Esta é uma simulação estratégica. O desconto não altera os custos internos do cálculo, apenas demonstra o impacto promocional no preço de venda.
            </p>
          </div>
        </div>
      )}

      {/* Preview quando colapsado */}
      {!isExpanded && finalSellingPrice > 0 && (
        <button
          onClick={handleToggleExpand}
          className="w-full text-left text-xs text-muted-foreground hover:text-foreground transition-colors pt-2 border-t border-border/50"
        >
          Clique para simular descontos de até 50% →
        </button>
      )}

      {/* Mensagem se não há preço */}
      {finalSellingPrice <= 0 && (
        <p className="text-xs text-muted-foreground pt-2 border-t border-border/50">
          Preencha os dados do cálculo para simular cupons de desconto.
        </p>
      )}
    </div>
  );
};

export default CouponStrategy;
