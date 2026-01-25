import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Calculator, Package } from 'lucide-react';
import TooltipLabel from './TooltipLabel';
import { Input } from '@/components/ui/input';

interface RawMaterialInputProps {
  label: string;
  packageValue: number;
  packageQuantity: number;
  quantityUsed: number;
  onPackageValueChange: (value: number) => void;
  onPackageQuantityChange: (value: number) => void;
  onQuantityUsedChange: (value: number) => void;
  tooltip?: string;
}

const RawMaterialInput: React.FC<RawMaterialInputProps> = ({
  label,
  packageValue,
  packageQuantity,
  quantityUsed,
  onPackageValueChange,
  onPackageQuantityChange,
  onQuantityUsedChange,
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
    if (packageValue === 0) {
      setDisplayValue('');
    } else {
      setDisplayValue(formatCurrency(packageValue));
    }
  }, [packageValue, formatCurrency]);

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
    onPackageValueChange(numericValue);
  };

  const handlePackageQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === '') {
      onPackageQuantityChange(0);
      return;
    }
    const parsed = parseInt(value, 10);
    if (!isNaN(parsed) && parsed >= 0) {
      onPackageQuantityChange(Math.min(parsed, 999999));
    }
  };

  const handleQuantityUsedChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === '') {
      onQuantityUsedChange(1); // Default to 1 if empty
      return;
    }
    const parsed = parseFloat(value);
    if (!isNaN(parsed) && parsed >= 0) {
      onQuantityUsedChange(Math.min(parsed, 9999));
    }
  };

  // Calculate unit value and final cost
  const calculations = useMemo(() => {
    const safePackageQuantity = packageQuantity > 0 ? packageQuantity : 1;
    const safeQuantityUsed = quantityUsed > 0 ? quantityUsed : 1;
    
    const unitValue = packageValue / safePackageQuantity;
    const finalCost = unitValue * safeQuantityUsed;
    
    return {
      unitValue: Math.round(unitValue * 100) / 100,
      finalCost: Math.round(finalCost * 100) / 100,
    };
  }, [packageValue, packageQuantity, quantityUsed]);

  const hasValues = packageValue > 0 || packageQuantity > 0;

  return (
    <div className="col-span-full space-y-3 p-4 bg-muted/30 rounded-lg border border-border/50">
      {/* Header with label */}
      <div className="flex items-center justify-between">
        {tooltip ? (
          <TooltipLabel label={label} tooltip={tooltip} />
        ) : (
          <label className="text-sm font-medium text-secondary-foreground flex items-center gap-1.5">
            <Package className="w-3.5 h-3.5 text-primary" />
            {label}
          </label>
        )}
      </div>

      {/* Input fields in a responsive grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Package Value */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-muted-foreground">Valor do pacote</label>
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
              aria-label={`Valor do pacote de ${label}`}
            />
          </div>
        </div>

        {/* Package Quantity */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-muted-foreground">Qtd. no pacote</label>
          <Input
            type="number"
            value={packageQuantity || ''}
            onChange={handlePackageQuantityChange}
            placeholder="0"
            className="h-9 text-sm"
            min={0}
            max={999999}
            aria-label={`Quantidade no pacote de ${label}`}
          />
        </div>

        {/* Quantity Used */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-muted-foreground">Qtd. utilizada</label>
          <Input
            type="number"
            value={quantityUsed || ''}
            onChange={handleQuantityUsedChange}
            placeholder="1"
            className="h-9 text-sm"
            min={0}
            max={9999}
            step="0.5"
            aria-label={`Quantidade utilizada de ${label}`}
          />
        </div>
      </div>

      {/* Calculation results */}
      {hasValues && (
        <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-border/30">
          <div className="flex items-center gap-1.5 text-xs">
            <Calculator className="w-3 h-3 text-muted-foreground" />
            <span className="text-muted-foreground">Unitário:</span>
            <span className="font-medium text-foreground">
              R$ {formatCurrency(calculations.unitValue)}
            </span>
          </div>
          <div className="h-3 w-px bg-border/50" />
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-muted-foreground">Custo no produto:</span>
            <span className="font-semibold text-primary">
              R$ {formatCurrency(calculations.finalCost)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default RawMaterialInput;
