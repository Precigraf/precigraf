import React from 'react';
import { PieChart } from 'lucide-react';

interface PriceBreakdownProps {
  rawMaterialsCost: number;
  operationalCost: number;
  desiredProfit: number;
  marketplaceTotalFees: number;
  finalSellingPrice: number;
  quantity: number;
}

const PriceBreakdown: React.FC<PriceBreakdownProps> = ({
  rawMaterialsCost,
  operationalCost,
  desiredProfit,
  marketplaceTotalFees,
  finalSellingPrice,
  quantity,
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

  // Proteção contra divisão por zero
  const safeQuantity = Math.max(1, Math.floor(quantity || 1));
  const safeFinalSellingPrice = Math.max(0, finalSellingPrice || 0);

  if (safeQuantity <= 0 || safeFinalSellingPrice <= 0) {
    return null;
  }

  // Componente simplificado - apenas exibe o total
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <PieChart className="w-4 h-4" />
        <span>Composição do Preço Final</span>
      </div>

      {/* Total */}
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
