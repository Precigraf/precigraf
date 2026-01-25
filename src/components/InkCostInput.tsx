import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Calculator, Droplet } from 'lucide-react';
import TooltipLabel from './TooltipLabel';
import { Input } from '@/components/ui/input';

export interface InkCostData {
  totalValue: number;
  bottleCount: number;
  mlPerBottle: number;
  mlPerPrint: number;
  printQuantity: number;
}

interface InkCostInputProps {
  data: InkCostData;
  onDataChange: (data: InkCostData) => void;
  tooltip?: string;
}

const InkCostInput: React.FC<InkCostInputProps> = ({
  data,
  onDataChange,
  tooltip,
}) => {
  const [displayValue, setDisplayValue] = useState('');

  const formatCurrency = useCallback((num: number): string => {
    if (!Number.isFinite(num) || isNaN(num)) {
      return '0,00';
    }
    return num.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }, []);

  useEffect(() => {
    if (data.totalValue === 0) {
      setDisplayValue('');
    } else {
      setDisplayValue(formatCurrency(data.totalValue));
    }
  }, [data.totalValue, formatCurrency]);

  const parseCurrency = (str: string): number => {
    const cleaned = str.replace(/[^\d]/g, '');
    if (cleaned.length > 12) {
      return 999999999.99;
    }
    const num = parseInt(cleaned, 10) || 0;
    const result = Math.min(num / 100, 999999999.99);
    return Math.round(result * 100) / 100;
  };

  const handleValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;
    const numericValue = parseCurrency(rawValue);
    setDisplayValue(formatCurrency(numericValue));
    onDataChange({ ...data, totalValue: numericValue });
  };

  const handleBottleCountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === '') {
      onDataChange({ ...data, bottleCount: 0 });
      return;
    }
    const parsed = parseInt(value, 10);
    if (!isNaN(parsed) && parsed >= 0) {
      onDataChange({ ...data, bottleCount: Math.min(parsed, 9999) });
    }
  };

  const handleMlPerBottleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === '') {
      onDataChange({ ...data, mlPerBottle: 0 });
      return;
    }
    const parsed = parseFloat(value);
    if (!isNaN(parsed) && parsed >= 0) {
      onDataChange({ ...data, mlPerBottle: Math.min(parsed, 99999) });
    }
  };

  const handleMlPerPrintChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === '') {
      onDataChange({ ...data, mlPerPrint: 0 });
      return;
    }
    const parsed = parseFloat(value);
    if (!isNaN(parsed) && parsed >= 0) {
      onDataChange({ ...data, mlPerPrint: Math.min(parsed, 999) });
    }
  };

  const handlePrintQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === '') {
      onDataChange({ ...data, printQuantity: 0 });
      return;
    }
    const parsed = parseInt(value, 10);
    if (!isNaN(parsed) && parsed >= 0) {
      onDataChange({ ...data, printQuantity: Math.min(parsed, 999999) });
    }
  };

  // Calculate all derived values
  const calculations = useMemo(() => {
    const safeBottleCount = data.bottleCount > 0 ? data.bottleCount : 1;
    const safeMlPerBottle = data.mlPerBottle > 0 ? data.mlPerBottle : 1;
    const safeMlPerPrint = data.mlPerPrint >= 0 ? data.mlPerPrint : 0;
    const safePrintQuantity = data.printQuantity >= 0 ? data.printQuantity : 0;

    // Total ML = bottles × ml per bottle
    const totalMl = safeBottleCount * safeMlPerBottle;
    
    // Value per ML = total value / total ML
    const valuePerMl = data.totalValue / totalMl;
    
    // Total consumption = ml per print × print quantity
    const totalConsumption = safeMlPerPrint * safePrintQuantity;
    
    // Final cost = consumption × value per ml
    const finalCost = totalConsumption * valuePerMl;

    return {
      totalMl: Math.round(totalMl * 100) / 100,
      valuePerMl: Math.round(valuePerMl * 1000) / 1000, // 3 decimal places for ml
      totalConsumption: Math.round(totalConsumption * 100) / 100,
      finalCost: Math.round(finalCost * 100) / 100,
    };
  }, [data]);

  const hasValues = data.totalValue > 0 || data.bottleCount > 0 || data.mlPerBottle > 0;

  return (
    <div className="col-span-full space-y-3 p-4 bg-muted/30 rounded-lg border border-border/50">
      {/* Header with label */}
      <div className="flex items-center justify-between">
        {tooltip ? (
          <TooltipLabel label="Tinta" tooltip={tooltip} />
        ) : (
          <label className="text-sm font-medium text-secondary-foreground flex items-center gap-1.5">
            <Droplet className="w-3.5 h-3.5 text-primary" />
            Tinta
          </label>
        )}
      </div>

      {/* Input fields - First row: Package info */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Total Value */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-muted-foreground">Valor total pago</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
              R$
            </span>
            <input
              type="text"
              inputMode="numeric"
              value={displayValue}
              onChange={handleValueChange}
              placeholder="0,00"
              className="input-currency w-full pl-10 text-sm h-9"
              aria-label="Valor total pago na tinta"
            />
          </div>
        </div>

        {/* Bottle Count */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-muted-foreground">Qtd. de frascos</label>
          <Input
            type="number"
            value={data.bottleCount || ''}
            onChange={handleBottleCountChange}
            placeholder="0"
            className="h-9 text-sm"
            min={0}
            max={9999}
            aria-label="Quantidade de frascos"
          />
        </div>

        {/* ML per Bottle */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-muted-foreground">ML por frasco</label>
          <div className="relative">
            <Input
              type="number"
              value={data.mlPerBottle || ''}
              onChange={handleMlPerBottleChange}
              placeholder="0"
              className="h-9 text-sm pr-10"
              min={0}
              max={99999}
              step="0.1"
              aria-label="Mililitros por frasco"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">
              ml
            </span>
          </div>
        </div>
      </div>

      {/* Second row: Consumption info */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* ML per Print */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-muted-foreground">ML por impressão</label>
          <div className="relative">
            <Input
              type="number"
              value={data.mlPerPrint || ''}
              onChange={handleMlPerPrintChange}
              placeholder="0"
              className="h-9 text-sm pr-10"
              min={0}
              max={999}
              step="0.1"
              aria-label="Mililitros por impressão"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">
              ml
            </span>
          </div>
        </div>

        {/* Print Quantity */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-muted-foreground">Qtd. de impressões</label>
          <Input
            type="number"
            value={data.printQuantity || ''}
            onChange={handlePrintQuantityChange}
            placeholder="0"
            className="h-9 text-sm"
            min={0}
            max={999999}
            aria-label="Quantidade de impressões"
          />
        </div>
      </div>

      {/* Calculation results */}
      {hasValues && (
        <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-border/30">
          <div className="flex items-center gap-1.5 text-xs">
            <Calculator className="w-3 h-3 text-muted-foreground" />
            <span className="text-muted-foreground">Total:</span>
            <span className="font-medium text-foreground">
              {calculations.totalMl} ml
            </span>
          </div>
          <div className="h-3 w-px bg-border/50" />
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-muted-foreground">Valor/ml:</span>
            <span className="font-medium text-foreground">
              R$ {formatCurrency(calculations.valuePerMl)}
            </span>
          </div>
          {data.mlPerPrint > 0 && data.printQuantity > 0 && (
            <>
              <div className="h-3 w-px bg-border/50" />
              <div className="flex items-center gap-1.5 text-xs">
                <span className="text-muted-foreground">Consumo:</span>
                <span className="font-medium text-foreground">
                  {calculations.totalConsumption} ml
                </span>
              </div>
              <div className="h-3 w-px bg-border/50" />
              <div className="flex items-center gap-1.5 text-xs">
                <span className="text-muted-foreground">Custo da tinta:</span>
                <span className="font-semibold text-primary">
                  R$ {formatCurrency(calculations.finalCost)}
                </span>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default InkCostInput;
