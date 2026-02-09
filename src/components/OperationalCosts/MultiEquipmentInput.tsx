import React from 'react';
import { Settings, Plus, Trash2, Calculator } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import TooltipLabel from '@/components/TooltipLabel';
import CostItemDisplay from './CostItemDisplay';
import { EquipmentItem } from './types';
import { calculateEquipmentItemCostPerMinute, calculateAppliedCost } from './calculations';

interface MultiEquipmentInputProps {
  items: EquipmentItem[];
  onItemsChange: (items: EquipmentItem[]) => void;
  productionTimeMinutes: number;
  disabled?: boolean;
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

const MultiEquipmentInput: React.FC<MultiEquipmentInputProps> = ({
  items,
  onItemsChange,
  productionTimeMinutes,
  disabled = false,
}) => {
  const handleAddItem = () => {
    const newItem: EquipmentItem = {
      id: `equip-${Date.now()}`,
      name: '',
      equipmentValue: 0,
      usefulLifeYears: 5,
      usagePercentage: 100,
    };
    onItemsChange([...items, newItem]);
  };

  const handleRemoveItem = (id: string) => {
    onItemsChange(items.filter(item => item.id !== id));
  };

  const handleFieldChange = (id: string, field: keyof EquipmentItem, rawValue: string) => {
    onItemsChange(items.map(item => {
      if (item.id !== id) return item;
      if (field === 'name') return { ...item, name: rawValue.slice(0, 60) };
      const parsed = parseFloat(rawValue);
      if (rawValue === '') return { ...item, [field]: 0 };
      if (isNaN(parsed) || parsed < 0) return item;
      let maxValue = 9999999;
      if (field === 'usefulLifeYears') maxValue = 50;
      if (field === 'usagePercentage') maxValue = 100;
      return { ...item, [field]: Math.min(parsed, maxValue) };
    }));
  };

  // Total applied cost
  const totalApplied = items.reduce((sum, item) => {
    const cpm = calculateEquipmentItemCostPerMinute(item);
    return sum + calculateAppliedCost(cpm, productionTimeMinutes);
  }, 0);

  return (
    <div className="space-y-4 p-4 bg-secondary/30 rounded-lg border border-border/50">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Settings className="w-4 h-4 text-primary" />
          <span className="font-medium text-sm">Equipamentos</span>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleAddItem}
          disabled={disabled || items.length >= 10}
          className="h-8 text-xs gap-1.5"
        >
          <Plus className="w-3.5 h-3.5" />
          Adicionar equipamento
        </Button>
      </div>

      {items.length === 0 ? (
        <p className="text-xs text-muted-foreground text-center py-2">
          Adicione equipamentos para calcular a depreciação automaticamente.
        </p>
      ) : (
        <div className="space-y-3">
          {items.map((item) => {
            const costPerMinute = calculateEquipmentItemCostPerMinute(item);
            const appliedCost = calculateAppliedCost(costPerMinute, productionTimeMinutes);

            return (
              <div key={item.id} className="p-3 bg-background/50 rounded-lg border border-border/30 space-y-3">
                {/* Name + Remove */}
                <div className="flex items-center gap-2">
                  <div className="flex-1">
                    <label className="text-xs text-muted-foreground">Descrição do equipamento</label>
                    <Input
                      type="text"
                      value={item.name}
                      onChange={(e) => handleFieldChange(item.id, 'name', e.target.value)}
                      placeholder="Ex: Impressora Epson L4260"
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
                    aria-label="Remover equipamento"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>

                {/* Fields */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1.5">
                    <TooltipLabel
                      label="Valor do equipamento"
                      tooltip="Valor total pago pelo equipamento/máquina"
                    />
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                        R$
                      </span>
                      <Input
                        type="number"
                        value={item.equipmentValue || ''}
                        onChange={(e) => handleFieldChange(item.id, 'equipmentValue', e.target.value)}
                        placeholder="0,00"
                        disabled={disabled}
                        className="pl-9 input-currency h-9 text-sm"
                        min={0}
                        step={0.01}
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <TooltipLabel
                      label="Vida útil (anos)"
                      tooltip="Tempo estimado de uso do equipamento. Padrão: 5 anos"
                    />
                    <Input
                      type="number"
                      value={item.usefulLifeYears || ''}
                      onChange={(e) => handleFieldChange(item.id, 'usefulLifeYears', e.target.value)}
                      placeholder="5"
                      disabled={disabled}
                      className="input-currency h-9 text-sm"
                      min={1}
                      max={50}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <TooltipLabel
                      label="% uso na produção"
                      tooltip="Percentual do tempo que o equipamento é usado nesta produção"
                    />
                    <div className="relative">
                      <Input
                        type="number"
                        value={item.usagePercentage || ''}
                        onChange={(e) => handleFieldChange(item.id, 'usagePercentage', e.target.value)}
                        placeholder="100"
                        disabled={disabled}
                        className="input-currency pr-8 h-9 text-sm"
                        min={0}
                        max={100}
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                        %
                      </span>
                    </div>
                  </div>
                </div>

                <CostItemDisplay
                  costPerMinute={costPerMinute}
                  appliedCost={appliedCost}
                  productionTimeMinutes={productionTimeMinutes}
                />
              </div>
            );
          })}

          {/* Total */}
          {totalApplied > 0 && (
            <div className="flex items-center justify-between pt-2 border-t border-border/30">
              <div className="flex items-center gap-1.5 text-xs">
                <Calculator className="w-3 h-3 text-muted-foreground" />
                <span className="text-muted-foreground">Total depreciação:</span>
              </div>
              <span className="font-semibold text-primary text-sm">
                {formatCurrency(totalApplied)}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MultiEquipmentInput;
