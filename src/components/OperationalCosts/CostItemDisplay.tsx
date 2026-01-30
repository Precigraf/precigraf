import React from 'react';
import { Badge } from '@/components/ui/badge';

interface CostItemDisplayProps {
  costPerMinute: number;
  appliedCost: number;
  productionTimeMinutes: number;
}

const formatCurrency = (value: number): string => {
  if (!Number.isFinite(value) || isNaN(value)) return 'R$ 0,00';
  return value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

const formatCostPerMinute = (value: number): string => {
  if (!Number.isFinite(value) || isNaN(value) || value === 0) return 'R$ 0,00/min';
  return `${value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 4,
    maximumFractionDigits: 4,
  })}/min`;
};

const CostItemDisplay: React.FC<CostItemDisplayProps> = ({
  costPerMinute,
  appliedCost,
  productionTimeMinutes,
}) => {
  const hasValues = costPerMinute > 0 && productionTimeMinutes > 0;
  
  if (!hasValues) return null;

  return (
    <div className="flex flex-col gap-1 mt-2 pt-2 border-t border-border/50">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">Custo/minuto:</span>
        <Badge variant="outline" className="font-mono text-xs">
          {formatCostPerMinute(costPerMinute)}
        </Badge>
      </div>
      <div className="flex items-center justify-between text-xs">
        <span className="text-success font-medium">Custo aplicado neste cálculo:</span>
        <Badge className="bg-success/10 text-success border-success/30 font-semibold">
          {formatCurrency(appliedCost)}
        </Badge>
      </div>
    </div>
  );
};

export default CostItemDisplay;
