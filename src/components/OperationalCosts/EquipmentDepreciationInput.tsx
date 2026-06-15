import React from 'react';
import { Settings } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import TooltipLabel from '@/components/TooltipLabel';
import CostItemDisplay from './CostItemDisplay';
import { EquipmentDepreciationData, UsefulLifeUnit } from './types';
import { calculateEquipmentCostPerMinute, calculateAppliedCost } from './calculations';

interface EquipmentDepreciationInputProps {
  data: EquipmentDepreciationData;
  onDataChange: (data: EquipmentDepreciationData) => void;
  productionTimeMinutes: number;
  disabled?: boolean;
}

const EquipmentDepreciationInput: React.FC<EquipmentDepreciationInputProps> = ({
  data,
  onDataChange,
  productionTimeMinutes,
  disabled = false,
}) => {
  const unit: UsefulLifeUnit = data.usefulLifeUnit ?? 'years';

  const handleValueChange = (field: keyof EquipmentDepreciationData) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    if (inputValue === '') {
      onDataChange({ ...data, [field]: 0 });
      return;
    }
    const parsed = parseFloat(inputValue);
    if (!isNaN(parsed) && parsed >= 0) {
      let maxValue = 9999999;
      if (field === 'usefulLifeYears') maxValue = unit === 'months' ? 600 : 50;
      if (field === 'usagePercentage') maxValue = 100;
      onDataChange({ ...data, [field]: Math.min(parsed, maxValue) });
    }
  };

  const handleUnitChange = (next: UsefulLifeUnit) => {
    onDataChange({ ...data, usefulLifeUnit: next });
  };

  const costPerMinute = calculateEquipmentCostPerMinute(data);
  const appliedCost = calculateAppliedCost(costPerMinute, productionTimeMinutes);

  return (
    <div className="space-y-4 p-4 bg-secondary/30 rounded-lg border border-border/50">
      <div className="flex items-center gap-2">
        <Settings className="w-4 h-4 text-primary" />
        <span className="font-medium text-sm">Depreciação de Equipamento</span>
      </div>

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
              value={data.equipmentValue || ''}
              onChange={handleValueChange('equipmentValue')}
              placeholder="0,00"
              disabled={disabled}
              className="pl-9 input-currency"
              min={0}
              step={0.01}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <TooltipLabel
            label="Vida útil"
            tooltip="Tempo estimado de uso do equipamento. Escolha entre anos ou meses."
          />
          <div className="flex gap-2">
            <Input
              type="number"
              value={data.usefulLifeYears || ''}
              onChange={handleValueChange('usefulLifeYears')}
              placeholder={unit === 'months' ? '60' : '5'}
              disabled={disabled}
              className="input-currency flex-1"
              min={1}
              max={unit === 'months' ? 600 : 50}
            />
            <Select value={unit} onValueChange={(v) => handleUnitChange(v as UsefulLifeUnit)} disabled={disabled}>
              <SelectTrigger className="w-[110px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="years">Anos</SelectItem>
                <SelectItem value="months">Meses</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-1.5">
          <TooltipLabel
            label="% uso na produção"
            tooltip="Percentual do tempo que o equipamento é usado nesta produção"
          />
          <div className="relative">
            <Input
              type="number"
              value={data.usagePercentage || ''}
              onChange={handleValueChange('usagePercentage')}
              placeholder="100"
              disabled={disabled}
              className="input-currency pr-8"
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
};

export default EquipmentDepreciationInput;
