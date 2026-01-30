import React from 'react';
import { LucideIcon } from 'lucide-react';
import { Input } from '@/components/ui/input';
import TooltipLabel from '@/components/TooltipLabel';
import CostItemDisplay from './CostItemDisplay';

interface UtilityCostInputProps {
  label: string;
  icon: LucideIcon;
  monthlyBill: number;
  usagePercentage: number;
  onMonthlyBillChange: (value: number) => void;
  onUsagePercentageChange: (value: number) => void;
  costPerMinute: number;
  appliedCost: number;
  productionTimeMinutes: number;
  tooltip?: string;
  disabled?: boolean;
}

const UtilityCostInput: React.FC<UtilityCostInputProps> = ({
  label,
  icon: Icon,
  monthlyBill,
  usagePercentage,
  onMonthlyBillChange,
  onUsagePercentageChange,
  costPerMinute,
  appliedCost,
  productionTimeMinutes,
  tooltip,
  disabled = false,
}) => {
  const handleMonthlyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    if (inputValue === '') {
      onMonthlyBillChange(0);
      return;
    }
    const parsed = parseFloat(inputValue);
    if (!isNaN(parsed) && parsed >= 0) {
      onMonthlyBillChange(Math.min(parsed, 99999));
    }
  };

  const handlePercentageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    if (inputValue === '') {
      onUsagePercentageChange(0);
      return;
    }
    const parsed = parseFloat(inputValue);
    if (!isNaN(parsed) && parsed >= 0) {
      onUsagePercentageChange(Math.min(parsed, 100));
    }
  };

  return (
    <div className="space-y-4 p-4 bg-secondary/30 rounded-lg border border-border/50">
      <div className="flex items-center gap-2">
        <Icon className="w-4 h-4 text-primary" />
        <span className="font-medium text-sm">{label}</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <TooltipLabel
            label="Valor mensal"
            tooltip={tooltip || `Valor mensal da conta de ${label.toLowerCase()}`}
          />
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
              R$
            </span>
            <Input
              type="number"
              value={monthlyBill || ''}
              onChange={handleMonthlyChange}
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
            label="% usado na produção"
            tooltip={`Percentual do ${label.toLowerCase()} destinado à produção`}
          />
          <div className="relative">
            <Input
              type="number"
              value={usagePercentage || ''}
              onChange={handlePercentageChange}
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

export default UtilityCostInput;
