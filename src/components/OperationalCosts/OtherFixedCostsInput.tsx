import React from 'react';
import { Plus, Trash2, MoreHorizontal } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import TooltipLabel from '@/components/TooltipLabel';
import { OtherFixedCostItem } from './types';
import { calculateOtherFixedCostPerMinute, calculateAppliedCost } from './calculations';

interface OtherFixedCostsInputProps {
  items: OtherFixedCostItem[];
  onItemsChange: (items: OtherFixedCostItem[]) => void;
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

const OtherFixedCostsInput: React.FC<OtherFixedCostsInputProps> = ({
  items,
  onItemsChange,
  productionTimeMinutes,
  disabled = false,
}) => {
  const handleAddItem = () => {
    const newItem: OtherFixedCostItem = {
      id: `cost-${Date.now()}`,
      name: '',
      monthlyValue: 0,
      usagePercentage: 100,
    };
    onItemsChange([...items, newItem]);
  };

  const handleRemoveItem = (id: string) => {
    onItemsChange(items.filter(item => item.id !== id));
  };

  const handleItemChange = (id: string, field: keyof OtherFixedCostItem, value: string | number) => {
    onItemsChange(items.map(item => {
      if (item.id !== id) return item;
      
      if (field === 'name') {
        return { ...item, name: String(value).slice(0, 50) };
      }
      
      const numValue = typeof value === 'string' ? parseFloat(value) || 0 : value;
      let maxValue = 99999;
      if (field === 'usagePercentage') maxValue = 100;
      
      return { ...item, [field]: Math.min(Math.max(0, numValue), maxValue) };
    }));
  };

  return (
    <div className="space-y-4 p-4 bg-secondary/30 rounded-lg border border-border/50">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MoreHorizontal className="w-4 h-4 text-primary" />
          <span className="font-medium text-sm">Outros Custos Fixos</span>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleAddItem}
          disabled={disabled || items.length >= 10}
          className="h-8 text-xs"
        >
          <Plus className="w-3 h-3 mr-1" />
          Adicionar
        </Button>
      </div>

      {items.length === 0 ? (
        <p className="text-xs text-muted-foreground text-center py-2">
          Adicione custos fixos personalizados (ex: aluguel, telefone, software)
        </p>
      ) : (
        <div className="space-y-3">
          {items.map((item) => {
            const costPerMinute = calculateOtherFixedCostPerMinute(item);
            const appliedCost = calculateAppliedCost(costPerMinute, productionTimeMinutes);
            
            return (
              <div key={item.id} className="p-3 bg-background/50 rounded-lg border border-border/30 space-y-3">
                <div className="flex items-center gap-2">
                  <Input
                    type="text"
                    value={item.name}
                    onChange={(e) => handleItemChange(item.id, 'name', e.target.value)}
                    placeholder="Nome do custo"
                    disabled={disabled}
                    className="flex-1 h-9 text-sm"
                    maxLength={50}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveItem(item.id)}
                    disabled={disabled}
                    className="h-9 w-9 text-destructive hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
                
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <span className="text-xs text-muted-foreground">Valor mensal</span>
                    <div className="relative">
                      <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                        R$
                      </span>
                      <Input
                        type="number"
                        value={item.monthlyValue || ''}
                        onChange={(e) => handleItemChange(item.id, 'monthlyValue', e.target.value)}
                        placeholder="0,00"
                        disabled={disabled}
                        className="pl-7 h-9 text-sm"
                        min={0}
                        step={0.01}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-1">
                    <span className="text-xs text-muted-foreground">% uso</span>
                    <div className="relative">
                      <Input
                        type="number"
                        value={item.usagePercentage || ''}
                        onChange={(e) => handleItemChange(item.id, 'usagePercentage', e.target.value)}
                        placeholder="100"
                        disabled={disabled}
                        className="h-9 text-sm pr-6"
                        min={0}
                        max={100}
                      />
                      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                        %
                      </span>
                    </div>
                  </div>
                </div>
                
                {costPerMinute > 0 && productionTimeMinutes > 0 && (
                  <div className="flex items-center justify-between text-xs pt-2 border-t border-border/30">
                    <span className="text-success font-medium">Custo aplicado:</span>
                    <Badge className="bg-success/10 text-success border-success/30 text-xs">
                      {formatCurrency(appliedCost)}
                    </Badge>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default OtherFixedCostsInput;
