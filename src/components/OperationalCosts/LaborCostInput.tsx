import React from 'react';
import { User } from 'lucide-react';
import { Input } from '@/components/ui/input';
import TooltipLabel from '@/components/TooltipLabel';
import CostItemDisplay from './CostItemDisplay';
import { LaborCostData, WORKING_HOURS_PER_MONTH } from './types';
import { calculateLaborCostPerMinute, calculateAppliedCost } from './calculations';

interface LaborCostInputProps {
  data: LaborCostData;
  onDataChange: (data: LaborCostData) => void;
  productionTimeMinutes: number;
  disabled?: boolean;
}

const formatCurrency = (value: number): string => {
  if (!Number.isFinite(value) || isNaN(value) || value === 0) return 'R$ 0,00';
  return value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

const LaborCostInput: React.FC<LaborCostInputProps> = ({
  data,
  onDataChange,
  productionTimeMinutes,
  disabled = false,
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    if (inputValue === '') {
      onDataChange({ monthlyWithdrawal: 0 });
      return;
    }
    const parsed = parseFloat(inputValue);
    if (!isNaN(parsed) && parsed >= 0) {
      onDataChange({ monthlyWithdrawal: Math.min(parsed, 999999) });
    }
  };

  const costPerMinute = calculateLaborCostPerMinute(data);
  const appliedCost = calculateAppliedCost(costPerMinute, productionTimeMinutes);

  // Calcular valor hora para exibição
  const hourlyRate = data.monthlyWithdrawal > 0 ? data.monthlyWithdrawal / WORKING_HOURS_PER_MONTH : 0;

  return (
    <div className="space-y-4 p-4 bg-secondary/30 rounded-lg border border-border/50">
      <div className="flex items-center gap-2">
        <User className="w-4 h-4 text-primary" />
        <span className="font-medium text-sm">Mão de Obra</span>
      </div>

      <div className="space-y-1.5">
        <TooltipLabel
          label="Quanto deseja retirar por mês?"
          tooltip="Valor que você deseja retirar mensalmente pelo seu trabalho. Baseado em 220 horas/mês (CLT)."
        />
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
            R$
          </span>
          <Input
            type="number"
            value={data.monthlyWithdrawal || ''}
            onChange={handleChange}
            placeholder="0,00"
            disabled={disabled}
            className="pl-9 input-currency"
            min={0}
            step={0.01}
          />
        </div>
        {data.monthlyWithdrawal > 0 && (
          <p className="text-xs text-muted-foreground">
            ≈ {formatCurrency(hourlyRate)}/hora (220h/mês)
          </p>
        )}
      </div>

      <CostItemDisplay
        costPerMinute={costPerMinute}
        appliedCost={appliedCost}
        productionTimeMinutes={productionTimeMinutes}
      />
    </div>
  );
};

export default LaborCostInput;
