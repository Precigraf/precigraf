import React, { useMemo } from 'react';
import { Factory, Zap, Wifi } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import FormSection from '@/components/FormSection';
import ProductionTimeInput from './ProductionTimeInput';
import MultiEquipmentInput from './MultiEquipmentInput';
import UtilityCostInput from './UtilityCostInput';
import LaborCostInput from './LaborCostInput';
import OtherFixedCostsInput from './OtherFixedCostsInput';
import { OperationalCostsData, AllCalculatedCosts } from './types';
import { 
  calculateAllOperationalCosts, 
  calculateElectricityCostPerMinute, 
  calculateInternetCostPerMinute,
  calculateAppliedCost
} from './calculations';

interface AdvancedOperationalCostsProps {
  data: OperationalCostsData;
  onDataChange: (data: OperationalCostsData) => void;
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

const AdvancedOperationalCosts: React.FC<AdvancedOperationalCostsProps> = ({
  data,
  onDataChange,
  disabled = false,
}) => {
  const calculatedCosts = useMemo(() => calculateAllOperationalCosts(data), [data]);

  const handleProductionTimeChange = (value: number) => {
    onDataChange({ ...data, productionTimeMinutes: value });
  };

  // Calcular custos de energia e internet
  const electricityCostPerMinute = useMemo(() => 
    calculateElectricityCostPerMinute(data.electricity), [data.electricity]);
  const electricityAppliedCost = useMemo(() => 
    calculateAppliedCost(electricityCostPerMinute, data.productionTimeMinutes), 
    [electricityCostPerMinute, data.productionTimeMinutes]);

  const internetCostPerMinute = useMemo(() => 
    calculateInternetCostPerMinute(data.internet), [data.internet]);
  const internetAppliedCost = useMemo(() => 
    calculateAppliedCost(internetCostPerMinute, data.productionTimeMinutes), 
    [internetCostPerMinute, data.productionTimeMinutes]);

  return (
    <FormSection
      title="Custos Operacionais Avançados"
      icon={<Factory className="w-5 h-5 text-primary" />}
      subtitle="Sistema de rateio por tempo de produção"
    >
      {/* Tempo de Produção - Campo Global */}
      <div className="col-span-full">
        <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
          <ProductionTimeInput
            value={data.productionTimeMinutes}
            onChange={handleProductionTimeChange}
            disabled={disabled}
          />
        </div>
      </div>

      {/* Resumo Total */}
      {data.productionTimeMinutes > 0 && calculatedCosts.totalAppliedCost > 0 && (
        <div className="col-span-full">
          <div className="p-4 bg-success/10 border border-success/30 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-sm font-medium text-success">
                  Custo Operacional Total
                </span>
                <span className="text-xs text-muted-foreground">
                  Para {data.productionTimeMinutes} minutos de produção
                </span>
              </div>
              <Badge className="bg-success text-success-foreground text-lg font-bold px-4 py-2">
                {formatCurrency(calculatedCosts.totalAppliedCost)}
              </Badge>
            </div>
          </div>
        </div>
      )}

      {/* 1. Depreciação de Equipamentos (múltiplos) */}
      <div className="col-span-full">
        <MultiEquipmentInput
          items={data.equipments || []}
          onItemsChange={(equipments) => onDataChange({ ...data, equipments })}
          productionTimeMinutes={data.productionTimeMinutes}
          disabled={disabled}
        />
      </div>

      {/* 2. Energia Elétrica */}
      <div className="col-span-full">
        <UtilityCostInput
          label="Energia Elétrica"
          icon={Zap}
          monthlyBill={data.electricity.monthlyBill}
          usagePercentage={data.electricity.usagePercentage}
          onMonthlyBillChange={(value) => onDataChange({
            ...data,
            electricity: { ...data.electricity, monthlyBill: value }
          })}
          onUsagePercentageChange={(value) => onDataChange({
            ...data,
            electricity: { ...data.electricity, usagePercentage: value }
          })}
          costPerMinute={electricityCostPerMinute}
          appliedCost={electricityAppliedCost}
          productionTimeMinutes={data.productionTimeMinutes}
          tooltip="Valor da conta de energia elétrica mensal"
          disabled={disabled}
        />
      </div>

      {/* 3. Internet */}
      <div className="col-span-full">
        <UtilityCostInput
          label="Internet"
          icon={Wifi}
          monthlyBill={data.internet.monthlyBill}
          usagePercentage={data.internet.usagePercentage}
          onMonthlyBillChange={(value) => onDataChange({
            ...data,
            internet: { ...data.internet, monthlyBill: value }
          })}
          onUsagePercentageChange={(value) => onDataChange({
            ...data,
            internet: { ...data.internet, usagePercentage: value }
          })}
          costPerMinute={internetCostPerMinute}
          appliedCost={internetAppliedCost}
          productionTimeMinutes={data.productionTimeMinutes}
          tooltip="Valor da conta de internet mensal"
          disabled={disabled}
        />
      </div>

      {/* 4. Mão de Obra */}
      <div className="col-span-full">
        <LaborCostInput
          data={data.labor}
          onDataChange={(labor) => onDataChange({ ...data, labor })}
          productionTimeMinutes={data.productionTimeMinutes}
          disabled={disabled}
        />
      </div>

      {/* 5. Outros Custos Fixos */}
      <div className="col-span-full">
        <OtherFixedCostsInput
          items={data.otherFixedCosts}
          onItemsChange={(otherFixedCosts) => onDataChange({ ...data, otherFixedCosts })}
          productionTimeMinutes={data.productionTimeMinutes}
          disabled={disabled}
        />
      </div>
    </FormSection>
  );
};

export default AdvancedOperationalCosts;
