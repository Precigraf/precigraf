import React, { useState } from 'react';
import { TrendingDown, Info, Lightbulb, Check } from 'lucide-react';
import { MarketplaceType, MARKETPLACE_CONFIG } from './MarketplaceSection';
import { Button } from '@/components/ui/button';

interface MarketplaceImpactProps {
  marketplace: MarketplaceType;
  unitPrice: number;
  unitProfit: number;
  marketplaceTotalFees: number;
  quantity: number;
  onApplySuggestedMargin?: (margin: number) => void;
}

const MarketplaceImpact: React.FC<MarketplaceImpactProps> = ({
  marketplace,
  unitPrice,
  unitProfit,
  marketplaceTotalFees,
  quantity,
  onApplySuggestedMargin,
}) => {
  const [applied, setApplied] = useState(false);

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

  // Proteção contra valores inválidos
  const safeQuantity = Math.max(1, Math.floor(quantity || 1));
  const safeMarketplaceTotalFees = Math.max(0, marketplaceTotalFees || 0);
  const safeUnitProfit = Math.max(0, unitProfit || 0);

  if (marketplace === 'none' || safeQuantity <= 0) {
    return null;
  }

  const config = MARKETPLACE_CONFIG[marketplace];
  const unitFees = Math.round((safeMarketplaceTotalFees / safeQuantity) * 100) / 100;
  const netUnitProfit = Math.round((safeUnitProfit - unitFees) * 100) / 100;
  const profitImpactPercentage = safeUnitProfit > 0 
    ? Math.round((unitFees / safeUnitProfit) * 1000) / 10 
    : 0;

  // Calcular margem sugerida quando taxas consomem muito lucro
  const feesExceedingProfit = profitImpactPercentage > 50;
  const suggestedMargin = feesExceedingProfit 
    ? Math.ceil(profitImpactPercentage + 30) // Margem mínima sugerida
    : null;

  const handleApplyMargin = () => {
    if (suggestedMargin && onApplySuggestedMargin) {
      onApplySuggestedMargin(suggestedMargin);
      setApplied(true);
      setTimeout(() => setApplied(false), 2000);
    }
  };

  return (
    <div className="bg-warning/5 border border-warning/20 rounded-lg p-4 space-y-3">
      <div className="flex items-center gap-2">
        <TrendingDown className="w-4 h-4 text-warning" />
        <span className="text-sm font-medium text-warning">Impacto do Marketplace</span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="text-center p-2 bg-background/50 rounded-lg">
          <div className="text-xs text-muted-foreground mb-1">Taxa por unidade</div>
          <div className="text-sm font-semibold text-warning">
            -{formatCurrency(unitFees)}
          </div>
        </div>
        <div className="text-center p-2 bg-background/50 rounded-lg">
          <div className="text-xs text-muted-foreground mb-1">Lucro líquido/un</div>
          <div className={`text-sm font-semibold ${netUnitProfit >= 0 ? 'text-success' : 'text-destructive'}`}>
            {formatCurrency(netUnitProfit)}
          </div>
        </div>
      </div>

      <div className="flex items-start gap-2 text-xs text-muted-foreground">
        <Info className="w-3 h-3 mt-0.5 flex-shrink-0" />
        <span>
          As taxas do {config.label} consomem <strong className="text-warning">{profitImpactPercentage}%</strong> do seu lucro por unidade.
        </span>
      </div>

      {/* Sugestão de margem quando taxas estão altas */}
      {suggestedMargin && (
        <div className="w-full bg-primary/10 border border-primary/30 rounded-xl p-4 mt-2 flex flex-col gap-4">
          {/* Bloco de texto - container próprio */}
          <div className="flex items-start gap-3">
            <Lightbulb className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
            <div className="flex-1 text-left">
              <p className="text-base font-semibold text-primary mb-1">Sugestão de margem</p>
              <p className="text-sm text-muted-foreground leading-relaxed">
                As taxas do marketplace estão reduzindo significativamente seu lucro. 
                Sugerimos uma margem mínima de <strong className="text-primary">{suggestedMargin}%</strong> para manter lucratividade.
              </p>
            </div>
          </div>
          
          {/* Área de ação - container exclusivo para o botão */}
          {onApplySuggestedMargin && (
            <div className="w-full">
              <Button
                variant="outline"
                size="sm"
                onClick={handleApplyMargin}
                className={`w-full h-11 text-sm rounded-lg flex items-center justify-center ${applied ? 'border-success/30 text-success hover:bg-success/10' : 'border-primary/30 text-primary hover:bg-primary/10'}`}
                disabled={applied}
              >
                {applied ? (
                  <>
                    <Check className="w-4 h-4 mr-2 flex-shrink-0 text-success" />
                    <span>Margem aplicada!</span>
                  </>
                ) : (
                  <>
                    <Lightbulb className="w-4 h-4 mr-2 flex-shrink-0" />
                    <span>Aplicar margem de {suggestedMargin}%</span>
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MarketplaceImpact;
