import React from 'react';
import { TrendingDown, DollarSign, Info } from 'lucide-react';
import { MarketplaceType, MARKETPLACE_CONFIG } from './MarketplaceSection';

interface MarketplaceImpactProps {
  marketplace: MarketplaceType;
  unitPrice: number;
  unitProfit: number;
  marketplaceTotalFees: number;
  quantity: number;
}

const MarketplaceImpact: React.FC<MarketplaceImpactProps> = ({
  marketplace,
  unitPrice,
  unitProfit,
  marketplaceTotalFees,
  quantity,
}) => {
  const formatCurrency = (value: number) => {
    if (!Number.isFinite(value) || isNaN(value)) {
      return 'R$ 0,00';
    }
    return value.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });
  };

  if (marketplace === 'none' || marketplace === 'direct_sale' || quantity <= 0) {
    return null;
  }

  const config = MARKETPLACE_CONFIG[marketplace];
  const unitFees = quantity > 0 ? marketplaceTotalFees / quantity : 0;
  const netUnitProfit = unitProfit - unitFees;
  const profitImpactPercentage = unitProfit > 0 ? ((unitFees / unitProfit) * 100).toFixed(1) : '0';

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
    </div>
  );
};

export default MarketplaceImpact;
