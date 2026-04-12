import React, { useState } from 'react';
import { Lightbulb, Check } from 'lucide-react';
import {
  MarketplaceType,
  ShopeeAccountType,
  calcShopeeCost,
  MARKETPLACE_CONFIG,
} from './MarketplaceSection';
import { Button } from '@/components/ui/button';

interface MarketplaceImpactProps {
  marketplace: MarketplaceType;
  shopeeAccountType: ShopeeAccountType;
  unitPrice: number;
  unitProfit: number;
  marketplaceTotalFees: number;
  quantity: number;
  netProfit: number;
  onApplySuggestedMargin?: (margin: number) => void;
}

const MarketplaceImpact: React.FC<MarketplaceImpactProps> = ({
  marketplace,
  shopeeAccountType,
  unitPrice,
  unitProfit,
  marketplaceTotalFees,
  quantity,
  netProfit,
  onApplySuggestedMargin,
}) => {
  const [applied, setApplied] = useState(false);

  const fmt = (v: number) => {
    if (!Number.isFinite(v) || isNaN(v)) return 'R$ 0,00';
    return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const safeQty = Math.max(1, Math.floor(quantity || 1));
  if (marketplace === 'none' || safeQty <= 0) return null;

  // Use pre-calculated fees from parent — don't re-run solver
  const unitFees = Math.max(0, marketplaceTotalFees) / safeQty;

  const safeUnitProfit   = Math.max(0, unitProfit || 0);
  const profitImpactPct  = safeUnitProfit > 0
    ? Math.round((unitFees / safeUnitProfit) * 1000) / 10
    : 0;

  const feesExceedingProfit = profitImpactPct > 50;
  const suggestedMargin     = feesExceedingProfit ? Math.ceil(profitImpactPct + 30) : null;

  const handleApplyMargin = () => {
    if (suggestedMargin && onApplySuggestedMargin) {
      onApplySuggestedMargin(suggestedMargin);
      setApplied(true);
      setTimeout(() => setApplied(false), 2000);
    }
  };

  if (!suggestedMargin) return null;

  return (
    <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 space-y-4">
      <div className="flex items-start gap-3">
        <Lightbulb className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
        <div className="flex-1">
          <p className="text-sm font-semibold text-primary">Sugestão de margem</p>
          <p className="text-sm text-muted-foreground leading-relaxed mt-1">
            As taxas do marketplace estão consumindo{' '}
            <strong className="text-primary">{profitImpactPct}%</strong> do lucro por unidade.
            Sugerimos uma margem mínima de{' '}
            <strong className="text-primary">{suggestedMargin}%</strong> para manter lucratividade.
          </p>
        </div>
      </div>

      {onApplySuggestedMargin && (
        <Button
          variant="outline"
          size="sm"
          onClick={handleApplyMargin}
          disabled={applied}
          className={`w-full h-11 text-sm rounded-lg ${
            applied
              ? 'border-green-500/30 text-green-600 dark:text-green-400'
              : 'border-primary/30 text-primary hover:bg-primary/10'
          }`}
        >
          {applied ? (
            <><Check className="w-4 h-4 mr-2" />Margem aplicada!</>
          ) : (
            <><Lightbulb className="w-4 h-4 mr-2" />Aplicar margem de {suggestedMargin}%</>
          )}
        </Button>
      )}
    </div>
  );
};

export default MarketplaceImpact;
