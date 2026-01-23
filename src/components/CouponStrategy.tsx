import React, { useState } from 'react';
import { Ticket, Lock, Sparkles, Tag, ArrowRight, Percent } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';

interface CouponStrategyProps {
  finalSellingPrice: number;
  unitPrice: number;
  quantity: number;
  isPro: boolean;
  onShowUpgrade?: () => void;
}

const CouponStrategy: React.FC<CouponStrategyProps> = ({
  finalSellingPrice,
  unitPrice,
  quantity,
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

  // Calcular valores com desconto
  const discountValue = Math.round((finalSellingPrice * discountPercentage) / 100 * 100) / 100;
  const priceWithCoupon = Math.round((finalSellingPrice - discountValue) * 100) / 100;
  const unitPriceWithCoupon = quantity > 0 ? Math.round((priceWithCoupon / quantity) * 100) / 100 : 0;

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

          {/* Comparação de preços */}
          <div className="bg-background/80 rounded-lg p-4 space-y-3">
            {/* Preço original */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Preço original</span>
              <span className="text-sm font-medium text-foreground line-through opacity-60">
                {formatCurrency(finalSellingPrice)}
              </span>
            </div>

            {/* Valor do desconto */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground flex items-center gap-1">
                <Tag className="w-3.5 h-3.5 text-destructive" />
                Desconto aplicado
              </span>
              <span className="text-sm font-medium text-destructive">
                -{formatCurrency(discountValue)}
              </span>
            </div>

            {/* Separador */}
            <div className="border-t border-dashed border-border" />

            {/* Preço com cupom */}
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-foreground flex items-center gap-1">
                <Ticket className="w-4 h-4 text-success" />
                Preço com cupom
              </span>
              <span className="text-xl font-bold text-success">
                {formatCurrency(priceWithCoupon)}
              </span>
            </div>

            {/* Preço unitário com cupom */}
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Preço unitário com cupom</span>
              <span className="font-medium text-success">
                {formatCurrency(unitPriceWithCoupon)}/un
              </span>
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
