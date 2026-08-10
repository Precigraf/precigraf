import React, { useState, useCallback, useMemo } from 'react';
import { Plus, Trash2, Calculator, Handshake } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import TooltipLabel from './TooltipLabel';

export interface OutsourcingItem {
  id: string;
  name: string;
  supplier: string;
  unitValue: number;
  quantityPerProduct: number;
}

// Custo por unidade do produto (valor unitário do serviço × qtd usada por produto)
export const calculateOutsourcingItemCost = (item: OutsourcingItem): number => {
  const safeQty = item.quantityPerProduct > 0 ? item.quantityPerProduct : 1;
  const safeValue = item.unitValue > 0 ? item.unitValue : 0;
  return safeValue * safeQty;
};

interface OutsourcingInputProps {
  items: OutsourcingItem[];
  onItemsChange: (items: OutsourcingItem[]) => void;
  lotQuantity?: number;
  disabled?: boolean;
}

const OutsourcingInput: React.FC<OutsourcingInputProps> = ({
  items,
  onItemsChange,
  lotQuantity = 0,
  disabled = false,
}) => {
  const [displayValues, setDisplayValues] = useState<Record<string, string>>({});

  const formatCurrency = useCallback((num: number): string => {
    if (!Number.isFinite(num) || isNaN(num)) return '0,00';
    return num.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }, []);

  const parseCurrency = (str: string): number => {
    const cleaned = str.replace(/[^\d]/g, '');
    if (cleaned.length > 12) return 999999999.99;
    const num = parseInt(cleaned, 10) || 0;
    const result = Math.min(num / 100, 999999999.99);
    return Math.round(result * 100) / 100;
  };

  const handleAddItem = () => {
    onItemsChange([
      ...items,
      {
        id: `outsourcing-${Date.now()}`,
        name: '',
        supplier: '',
        unitValue: 0,
        quantityPerProduct: 1,
      },
    ]);
  };

  const handleRemoveItem = (id: string) => {
    onItemsChange(items.filter((item) => item.id !== id));
    setDisplayValues((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  };

  const handleTextChange = (id: string, field: 'name' | 'supplier', value: string) => {
    onItemsChange(items.map((item) => (item.id === id ? { ...item, [field]: value.slice(0, 60) } : item)));
  };

  const handleUnitValueChange = (id: string, rawValue: string) => {
    const numericValue = parseCurrency(rawValue);
    setDisplayValues((prev) => ({ ...prev, [id]: formatCurrency(numericValue) }));
    onItemsChange(items.map((item) => (item.id === id ? { ...item, unitValue: numericValue } : item)));
  };

  const handleQuantityChange = (id: string, rawValue: string) => {
    if (rawValue === '') {
      onItemsChange(items.map((item) => (item.id === id ? { ...item, quantityPerProduct: 1 } : item)));
      return;
    }
    const parsed = parseFloat(rawValue);
    if (!isNaN(parsed) && parsed >= 0) {
      onItemsChange(
        items.map((item) => (item.id === id ? { ...item, quantityPerProduct: Math.min(parsed, 9999) } : item))
      );
    }
  };

  const getDisplayValue = (item: OutsourcingItem): string => {
    if (displayValues[item.id] !== undefined) return displayValues[item.id];
    if (item.unitValue === 0) return '';
    return formatCurrency(item.unitValue);
  };

  const totalPerUnit = useMemo(
    () => items.reduce((sum, item) => sum + calculateOutsourcingItemCost(item), 0),
    [items]
  );

  const safeLot = Math.max(0, Math.floor(lotQuantity || 0));

  return (
    <div className="col-span-full space-y-3 p-4 bg-muted/30 rounded-lg border border-border/50">
      <div className="flex items-center justify-between">
        <TooltipLabel
          label="Terceirização"
          tooltip="Serviços contratados de terceiros (laminação, corte especial, bordado, plotagem...). O valor é cobrado por unidade e repassado ao cliente sem margem de lucro."
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
          Adicionar serviço
        </Button>
      </div>

      {items.length > 0 ? (
        <div className="space-y-3">
          {items.map((item) => {
            const unitCost = calculateOutsourcingItemCost(item);
            const lotCost = unitCost * safeLot;

            return (
              <div key={item.id} className="p-3 bg-background/50 rounded-lg border border-border/30 space-y-3">
                <div className="flex items-center gap-2">
                  <div className="flex-1">
                    <label className="text-xs text-muted-foreground">Serviço terceirizado</label>
                    <Input
                      type="text"
                      value={item.name}
                      onChange={(e) => handleTextChange(item.id, 'name', e.target.value)}
                      placeholder="Ex: Laminação fosca"
                      disabled={disabled}
                      className="h-9 text-sm mt-1"
                      maxLength={60}
                    />
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveItem(item.id)}
                    disabled={disabled}
                    className="h-9 w-9 text-destructive hover:text-destructive hover:bg-destructive/10 shrink-0 mt-4"
                    aria-label="Remover serviço terceirizado"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs text-muted-foreground">Fornecedor (opcional)</label>
                    <Input
                      type="text"
                      value={item.supplier}
                      onChange={(e) => handleTextChange(item.id, 'supplier', e.target.value)}
                      placeholder="Ex: Gráfica Silva"
                      disabled={disabled}
                      className="h-9 text-sm"
                      maxLength={60}
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs text-muted-foreground">Valor por unidade</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                        R$
                      </span>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={getDisplayValue(item)}
                        onChange={(e) => handleUnitValueChange(item.id, e.target.value)}
                        placeholder="0,00"
                        disabled={disabled}
                        className="input-currency w-full pl-10 text-sm h-9"
                        aria-label={`Valor por unidade de ${item.name || 'serviço terceirizado'}`}
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs text-muted-foreground">Qtd. por produto</label>
                    <Input
                      type="number"
                      value={item.quantityPerProduct || ''}
                      onChange={(e) => handleQuantityChange(item.id, e.target.value)}
                      placeholder="1"
                      disabled={disabled}
                      className="h-9 text-sm"
                      min={0}
                      max={9999}
                      step="0.5"
                    />
                  </div>
                </div>

                {unitCost > 0 && (
                  <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-border/30">
                    <div className="flex items-center gap-1.5 text-xs">
                      <Calculator className="w-3 h-3 text-muted-foreground" />
                      <span className="text-muted-foreground">Por unidade:</span>
                      <span className="font-medium text-foreground">R$ {formatCurrency(unitCost)}</span>
                    </div>
                    {safeLot > 0 && (
                      <>
                        <div className="h-3 w-px bg-border/50" />
                        <div className="flex items-center gap-1.5 text-xs">
                          <span className="text-muted-foreground">Total no lote ({safeLot} un.):</span>
                          <span className="font-semibold text-primary">R$ {formatCurrency(lotCost)}</span>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {totalPerUnit > 0 && (
            <div className="space-y-2 pt-2 border-t border-border/30">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs">
                  <Handshake className="w-3 h-3 text-muted-foreground" />
                  <span className="text-muted-foreground">Total terceirização por unidade:</span>
                </div>
                <span className="font-semibold text-primary text-sm">R$ {formatCurrency(totalPerUnit)}</span>
              </div>
              {safeLot > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Total no lote:</span>
                  <span className="font-semibold text-primary text-sm">
                    R$ {formatCurrency(totalPerUnit * safeLot)}
                  </span>
                </div>
              )}
              <p className="text-[11px] text-muted-foreground">
                Repasse puro: este valor é somado ao preço final sem margem de lucro.
              </p>
            </div>
          )}
        </div>
      ) : (
        <p className="text-xs text-muted-foreground text-center py-2">
          Adicione serviços que você contrata de terceiros. O valor é repassado ao cliente sem lucro em cima.
        </p>
      )}
    </div>
  );
};

export default OutsourcingInput;
