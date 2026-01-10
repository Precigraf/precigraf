import React, { useState, useEffect, useCallback } from 'react';
import TooltipLabel from './TooltipLabel';

interface CurrencyInputProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  placeholder?: string;
  helperText?: string;
  fullWidth?: boolean;
  tooltip?: string;
}

const CurrencyInput: React.FC<CurrencyInputProps> = ({
  label,
  value,
  onChange,
  placeholder = "0,00",
  helperText,
  fullWidth = false,
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
    if (value === 0) {
      setDisplayValue('');
    } else {
      setDisplayValue(formatCurrency(value));
    }
  }, [value, formatCurrency]);

  const parseCurrency = (str: string): number => {
    const cleaned = str.replace(/[^\d]/g, '');
    // Proteção contra valores muito grandes que causam overflow
    if (cleaned.length > 12) {
      return 999999999.99;
    }
    const num = parseInt(cleaned, 10) || 0;
    // Limitar a um valor máximo razoável (R$ 999.999.999,99)
    const result = Math.min(num / 100, 999999999.99);
    return Math.round(result * 100) / 100;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;
    const numericValue = parseCurrency(rawValue);
    setDisplayValue(formatCurrency(numericValue));
    onChange(numericValue);
  };

  return (
    <div className={`flex flex-col gap-2 ${fullWidth ? 'col-span-full' : ''}`}>
      {tooltip ? (
        <TooltipLabel label={label} tooltip={tooltip} />
      ) : (
        <label className="text-sm font-medium text-secondary-foreground">
          {label}
        </label>
      )}
      <div className="relative">
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">
          R$
        </span>
        <input
          type="text"
          inputMode="numeric"
          value={displayValue}
          onChange={handleChange}
          placeholder={placeholder}
          className="input-currency w-full pl-12"
          aria-label={label}
        />
      </div>
      {helperText && (
        <span className="text-xs text-muted-foreground">{helperText}</span>
      )}
    </div>
  );
};

export default CurrencyInput;
