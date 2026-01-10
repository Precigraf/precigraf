import React from 'react';
import { Layers, Factory, TrendingUp, Store, PieChart } from 'lucide-react';

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
    return value.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });
  };

  const calculatePercentage = (value: number): string => {
    if (finalSellingPrice <= 0) return '0%';
    const percentage = (value / finalSellingPrice) * 100;
    return `${percentage.toFixed(1)}%`;
  };

  const items = [
    {
      label: 'Matéria-prima',
      value: rawMaterialsCost,
      icon: Layers,
      color: 'text-blue-400',
      bgColor: 'bg-blue-400/10',
      borderColor: 'border-blue-400/30',
    },
    {
      label: 'Custos Operacionais',
      value: operationalCost,
      icon: Factory,
      color: 'text-orange-400',
      bgColor: 'bg-orange-400/10',
      borderColor: 'border-orange-400/30',
    },
    {
      label: 'Lucro Desejado',
      value: desiredProfit,
      icon: TrendingUp,
      color: 'text-success',
      bgColor: 'bg-success/10',
      borderColor: 'border-success/30',
    },
    ...(marketplaceTotalFees > 0
      ? [
          {
            label: 'Taxas Marketplace',
            value: marketplaceTotalFees,
            icon: Store,
            color: 'text-warning',
            bgColor: 'bg-warning/10',
            borderColor: 'border-warning/30',
          },
        ]
      : []),
  ];

  if (quantity <= 0 || finalSellingPrice <= 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <PieChart className="w-4 h-4" />
        <span>Composição do Preço Final</span>
      </div>

      <div className="space-y-2">
        {items.map((item) => {
          const percentage = calculatePercentage(item.value);
          const widthPercentage = finalSellingPrice > 0 
            ? Math.min((item.value / finalSellingPrice) * 100, 100) 
            : 0;
          
          return (
            <div key={item.label} className={`rounded-lg p-3 ${item.bgColor} border ${item.borderColor}`}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <item.icon className={`w-4 h-4 ${item.color}`} />
                  <span className={`text-sm font-medium ${item.color}`}>{item.label}</span>
                </div>
                <div className="text-right">
                  <span className={`text-sm font-semibold ${item.color}`}>
                    {formatCurrency(item.value)}
                  </span>
                  <span className="text-xs text-muted-foreground ml-2">
                    ({percentage})
                  </span>
                </div>
              </div>
              {/* Barra de progresso visual */}
              <div className="h-1.5 bg-background/50 rounded-full overflow-hidden">
                <div 
                  className={`h-full ${item.color.replace('text-', 'bg-')} rounded-full transition-all duration-500`}
                  style={{ width: `${widthPercentage}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Total */}
      <div className="bg-foreground/5 border border-foreground/10 rounded-lg p-3 mt-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-foreground">Preço Final Total</span>
          <span className="text-lg font-bold text-foreground">{formatCurrency(finalSellingPrice)}</span>
        </div>
        <div className="text-xs text-muted-foreground mt-1">
          {formatCurrency(finalSellingPrice / quantity)}/unidade × {quantity} unidades
        </div>
      </div>
    </div>
  );
};

export default PriceBreakdown;
