import React, { useState, useCallback, useMemo } from 'react';
import { Plus, Trash2, Package, Calculator } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import TooltipLabel from './TooltipLabel';

export interface OtherMaterialItem {
  id: string;
  name: string;
  packageValue: number;
  packageQuantity: number;
  quantityUsed: number;
}

// Helper to calculate cost for a single item
export const calculateOtherMaterialItemCost = (item: OtherMaterialItem): number => {
  const safePackageQty = item.packageQuantity > 0 ? item.packageQuantity : 1;
  const safeQtyUsed = item.quantityUsed > 0 ? item.quantityUsed : 1;
  const unitValue = item.packageValue / safePackageQty;
  return Math.round(unitValue * safeQtyUsed * 100) / 100;
};

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
    const newItem: OtherMaterialItem = {
      id: `material-${Date.now()}`,
      name: '',
      packageValue: 0,
      packageQuantity: 0,
      quantityUsed: 1,
    };
    onItemsChange([...items, newItem]);
  };

  const handleRemoveItem = (id: string) => {
    onItemsChange(items.filter(item => item.id !== id));
    setDisplayValues(prev => {
      const newValues = { ...prev };
      delete newValues[id];
      return newValues;
    });
  };

  const handleNameChange = (id: string, name: string) => {
    onItemsChange(items.map(item =>
      item.id === id ? { ...item, name: name.slice(0, 60) } : item
    ));
  };

  const handlePackageValueChange = (id: string, rawValue: string) => {
    const numericValue = parseCurrency(rawValue);
    setDisplayValues(prev => ({ ...prev, [id]: formatCurrency(numericValue) }));
    onItemsChange(items.map(item =>
      item.id === id ? { ...item, packageValue: numericValue } : item
    ));
  };

  const handleIntFieldChange = (id: string, field: 'packageQuantity' | 'quantityUsed', rawValue: string) => {
    if (rawValue === '') {
      onItemsChange(items.map(item =>
        item.id === id ? { ...item, [field]: field === 'quantityUsed' ? 1 : 0 } : item
      ));
      return;
    }
    const parsed = parseFloat(rawValue);
    if (!isNaN(parsed) && parsed >= 0) {
      const maxVal = field === 'packageQuantity' ? 999999 : 9999;
      onItemsChange(items.map(item =>
        item.id === id ? { ...item, [field]: Math.min(parsed, maxVal) } : item
      ));
    }
  };

  const getDisplayValue = (item: OtherMaterialItem): string => {
    if (displayValues[item.id] !== undefined) return displayValues[item.id];
    if (item.packageValue === 0) return '';
    return formatCurrency(item.packageValue);
  };

  const totalCost = useMemo(() => {
    return items.reduce((sum, item) => sum + calculateOtherMaterialItemCost(item), 0);
  }, [items]);

  return (
    <div className="col-span-full space-y-3 p-4 bg-muted/30 rounded-lg border border-border/50">
      <div className="flex items-center justify-between">
        <TooltipLabel
          label="Outros Insumos"
          tooltip="Adicione insumos personalizados com cálculo por pacote, igual ao papel."
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

      {items.length > 0 ? (
        <div className="space-y-3">
          {items.map((item) => {
            const itemCost = calculateOtherMaterialItemCost(item);
            const unitValue = item.packageQuantity > 0
              ? Math.round((item.packageValue / item.packageQuantity) * 100) / 100
              : 0;
            const hasValues = item.packageValue > 0 || item.packageQuantity > 0;

            return (
              <div key={item.id} className="p-3 bg-background/50 rounded-lg border border-border/30 space-y-3">
                {/* Name + Remove */}
                <div className="flex items-center gap-2">
                  <div className="flex-1">
                    <label className="text-xs text-muted-foreground">Nome do insumo</label>
                    <Input
                      type="text"
                      value={item.name}
                      onChange={(e) => handleNameChange(item.id, e.target.value)}
                      placeholder="Ex: Bobina plástica 25x35mm"
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
                    aria-label="Remover insumo"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>

                {/* Package fields */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs text-muted-foreground">Valor do pacote</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                        R$
                      </span>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={getDisplayValue(item)}
                        onChange={(e) => handlePackageValueChange(item.id, e.target.value)}
                        placeholder="0,00"
                        disabled={disabled}
                        className="input-currency w-full pl-10 text-sm h-9"
                        aria-label={`Valor do pacote de ${item.name || 'insumo'}`}
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs text-muted-foreground">Qtd. no pacote</label>
                    <Input
                      type="number"
                      value={item.packageQuantity || ''}
                      onChange={(e) => handleIntFieldChange(item.id, 'packageQuantity', e.target.value)}
                      placeholder="0"
                      disabled={disabled}
                      className="h-9 text-sm"
                      min={0}
                      max={999999}
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs text-muted-foreground">Qtd. utilizada</label>
                    <Input
                      type="number"
                      value={item.quantityUsed || ''}
                      onChange={(e) => handleIntFieldChange(item.id, 'quantityUsed', e.target.value)}
                      placeholder="1"
                      disabled={disabled}
                      className="h-9 text-sm"
                      min={0}
                      max={9999}
                      step="0.5"
                    />
                  </div>
                </div>

                {/* Calculation result */}
                {hasValues && (
                  <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-border/30">
                    <div className="flex items-center gap-1.5 text-xs">
                      <Calculator className="w-3 h-3 text-muted-foreground" />
                      <span className="text-muted-foreground">Unitário:</span>
                      <span className="font-medium text-foreground">
                        R$ {formatCurrency(unitValue)}
                      </span>
                    </div>
                    <div className="h-3 w-px bg-border/50" />
                    <div className="flex items-center gap-1.5 text-xs">
                      <span className="text-muted-foreground">Custo no produto:</span>
                      <span className="font-semibold text-primary">
                        R$ {formatCurrency(itemCost)}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}

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
          Adicione insumos personalizados como cola, fita, bobinas, acabamentos, etc.
        </p>
      )}
    </div>
  );
};

export default OtherMaterialsInput;
