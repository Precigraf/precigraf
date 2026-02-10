import React from 'react';
import { PieChart } from 'lucide-react';

interface PriceBreakdownProps {
  rawMaterialsCost: number;
  operationalCost: number;
  desiredProfit: number;
  marketplaceTotalFees: number;
  finalSellingPrice: number;
  quantity: number;
  profitMargin?: number;
  isFixedProfit?: boolean;
}

const PriceBreakdown: React.FC<PriceBreakdownProps> = ({
  rawMaterialsCost,
  operationalCost,
  desiredProfit,
  marketplaceTotalFees,
  finalSellingPrice,
  quantity,
  profitMargin = 0,
  isFixedProfit = false,
}) => {
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

  const safeQuantity = Math.max(1, Math.floor(quantity || 1));
  const safeFinalSellingPrice = Math.max(0, finalSellingPrice || 0);

  if (safeQuantity <= 0 || safeFinalSellingPrice <= 0) {
    return null;
  }

  const calcPercent = (value: number) =>
    safeFinalSellingPrice > 0 ? Math.round((value / safeFinalSellingPrice) * 1000) / 10 : 0;

  const items = [
    { label: 'Matéria-prima', value: rawMaterialsCost, color: 'text-blue-500' },
    { label: 'Custos operacionais', value: operationalCost, color: 'text-orange-500' },
    {
      label: isFixedProfit ? 'Lucro (fixo)' : `Lucro (${profitMargin}%)`,
      value: desiredProfit,
      color: 'text-success',
    },
    ...(marketplaceTotalFees > 0
      ? [{ label: 'Taxas Marketplace', value: marketplaceTotalFees, color: 'text-warning' }]
      : []),
  ];

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <PieChart className="w-4 h-4" />
        <span>Composição do Preço Final</span>
      </div>

      <div className="space-y-2 text-sm">
        {items.map((item) => (
          <div key={item.label} className="flex justify-between items-center py-1">
            <span className="text-secondary-foreground">{item.label}</span>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">
                {calcPercent(item.value)}%
              </span>
              <span className={`font-medium ${item.color}`}>
                {formatCurrency(item.value)}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-foreground/5 border border-foreground/10 rounded-lg p-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-foreground">Preço Final Total</span>
          <span className="text-lg font-bold text-foreground">{formatCurrency(safeFinalSellingPrice)}</span>
        </div>
        <div className="text-xs text-muted-foreground mt-1">
          {formatCurrency(safeFinalSellingPrice / safeQuantity)}/unidade × {safeQuantity} unidades
        </div>
      </div>
    </div>
  );
};

export default PriceBreakdown;
