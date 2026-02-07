import React, { useState, useCallback, useMemo } from 'react';
import { Plus, Trash2, Package, Calculator } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import TooltipLabel from './TooltipLabel';

export interface OtherMaterialItem {
  id: string;
  name: string;
  value: number;
}

interface OtherMaterialsInputProps {
  items: OtherMaterialItem[];
  onItemsChange: (items: OtherMaterialItem[]) => void;
  disabled?: boolean;
}

const OtherMaterialsInput: React.FC<OtherMaterialsInputProps> = ({
  items,
  onItemsChange,
  disabled = false,
}) => {
  const [displayValues, setDisplayValues] = useState<Record<string, string>>({});

  const formatCurrency = useCallback((num: number): string => {
    if (!Number.isFinite(num) || isNaN(num)) {
      return '0,00';
    }
    return num.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }, []);

  const parseCurrency = (str: string): number => {
    const cleaned = str.replace(/[^\d]/g, '');
    if (cleaned.length > 12) {
      return 999999999.99;
    }
    const num = parseInt(cleaned, 10) || 0;
    const result = Math.min(num / 100, 999999999.99);
    return Math.round(result * 100) / 100;
  };

  const handleAddItem = () => {
    const newItem: OtherMaterialItem = {
      id: `material-${Date.now()}`,
      name: '',
      value: 0,
    };
    onItemsChange([...items, newItem]);
  };

  const handleRemoveItem = (id: string) => {
    onItemsChange(items.filter(item => item.id !== id));
    // Limpar display value
    setDisplayValues(prev => {
      const newValues = { ...prev };
      delete newValues[id];
      return newValues;
    });
  };

  const handleNameChange = (id: string, name: string) => {
    onItemsChange(items.map(item => 
      item.id === id ? { ...item, name: name.slice(0, 50) } : item
    ));
  };

  const handleValueChange = (id: string, rawValue: string) => {
    const numericValue = parseCurrency(rawValue);
    setDisplayValues(prev => ({
      ...prev,
      [id]: formatCurrency(numericValue),
    }));
    onItemsChange(items.map(item => 
      item.id === id ? { ...item, value: numericValue } : item
    ));
  };

  const getDisplayValue = (item: OtherMaterialItem): string => {
    if (displayValues[item.id] !== undefined) {
      return displayValues[item.id];
    }
    if (item.value === 0) {
      return '';
    }
    return formatCurrency(item.value);
  };

  // Calcular total dos insumos
  const totalCost = useMemo(() => {
    return items.reduce((sum, item) => sum + (item.value || 0), 0);
  }, [items]);

  const hasItems = items.length > 0;

  return (
    <div className="col-span-full space-y-3 p-4 bg-muted/30 rounded-lg border border-border/50">
      {/* Header */}
      <div className="flex items-center justify-between">
        <TooltipLabel 
          label="Outros Insumos" 
          tooltip="Adicione insumos personalizados como cola, fita, acabamentos especiais, etc."
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleAddItem}
          disabled={disabled || items.length >= 10}
          className="h-8 text-xs gap-1.5"
        >
          <Plus className="w-3.5 h-3.5" />
          Adicionar insumo
        </Button>
      </div>

      {/* Lista de Insumos */}
      {hasItems ? (
        <div className="space-y-3">
          {items.map((item) => (
            <div 
              key={item.id} 
              className="p-3 bg-background/50 rounded-lg border border-border/30 space-y-3"
            >
              <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto_auto] gap-3 items-end">
                {/* Nome do insumo */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-muted-foreground">Nome do insumo</label>
                  <Input
                    type="text"
                    value={item.name}
                    onChange={(e) => handleNameChange(item.id, e.target.value)}
                    placeholder="Ex: Cola especial"
                    disabled={disabled}
                    className="h-9 text-sm"
                    maxLength={50}
                  />
                </div>

                {/* Valor */}
                <div className="flex flex-col gap-1.5 min-w-[140px]">
                  <label className="text-xs text-muted-foreground">Valor</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                      R$
                    </span>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={getDisplayValue(item)}
                      onChange={(e) => handleValueChange(item.id, e.target.value)}
                      placeholder="0,00"
                      disabled={disabled}
                      className="input-currency w-full pl-10 text-sm h-9"
                      aria-label={`Valor de ${item.name || 'insumo'}`}
                    />
                  </div>
                </div>

                {/* Botão Remover */}
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => handleRemoveItem(item.id)}
                  disabled={disabled}
                  className="h-9 w-9 text-destructive hover:text-destructive hover:bg-destructive/10 shrink-0"
                  aria-label="Remover insumo"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}

          {/* Total */}
          {totalCost > 0 && (
            <div className="flex items-center justify-between pt-2 border-t border-border/30">
              <div className="flex items-center gap-1.5 text-xs">
                <Calculator className="w-3 h-3 text-muted-foreground" />
                <span className="text-muted-foreground">Total outros insumos:</span>
              </div>
              <span className="font-semibold text-primary text-sm">
                R$ {formatCurrency(totalCost)}
              </span>
            </div>
          )}
        </div>
      ) : (
        <p className="text-xs text-muted-foreground text-center py-2">
          Adicione insumos personalizados como cola, fita, acabamentos especiais, etc.
        </p>
      )}
    </div>
  );
};

export default OtherMaterialsInput;
