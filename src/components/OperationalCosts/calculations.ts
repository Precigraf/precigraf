// Cálculos para o sistema avançado de custos operacionais com rateio por tempo

import {
  EquipmentDepreciationData,
  EquipmentItem,
  ElectricityCostData,
  InternetCostData,
  LaborCostData,
  OtherFixedCostItem,
  OperationalCostsData,
  CalculatedOperationalCost,
  AllCalculatedCosts,
  MINUTES_PER_MONTH,
  WORKING_MINUTES_PER_MONTH,
} from './types';

// Função auxiliar para arredondar para 6 casas decimais (precisão para custo/minuto)
const roundPrecise = (value: number): number => {
  if (!Number.isFinite(value) || isNaN(value)) return 0;
  return Math.round(value * 1000000) / 1000000;
};

// Função auxiliar para arredondar valores monetários (2 casas decimais)
const roundCurrency = (value: number): number => {
  if (!Number.isFinite(value) || isNaN(value)) return 0;
  return Math.round(value * 100) / 100;
};

/**
 * Calcula custo por minuto de depreciação de equipamento
 */
export const calculateEquipmentCostPerMinute = (data: EquipmentDepreciationData): number => {
  if (data.equipmentValue <= 0 || data.usefulLifeYears <= 0) return 0;
  
  const annualDepreciation = data.equipmentValue / data.usefulLifeYears;
  const monthlyDepreciation = annualDepreciation / 12;
  const dailyDepreciation = monthlyDepreciation / 30;
  const hourlyDepreciation = dailyDepreciation / 24;
  const minuteDepreciation = hourlyDepreciation / 60;
  
  const usageMultiplier = data.usagePercentage / 100;
  
  return roundPrecise(minuteDepreciation * usageMultiplier);
};

/**
 * Calcula custo por minuto de um item de equipamento (com nome)
 */
export const calculateEquipmentItemCostPerMinute = (item: EquipmentItem): number => {
  return calculateEquipmentCostPerMinute({
    equipmentValue: item.equipmentValue,
    usefulLifeYears: item.usefulLifeYears,
    usagePercentage: item.usagePercentage,
  });
};

/**
 * Calcula custo por minuto de energia elétrica
 */
export const calculateElectricityCostPerMinute = (data: ElectricityCostData): number => {
  if (data.monthlyBill <= 0) return 0;
  
  const costPerMinute = data.monthlyBill / MINUTES_PER_MONTH;
  const usageMultiplier = data.usagePercentage / 100;
  
  return roundPrecise(costPerMinute * usageMultiplier);
};

/**
 * Calcula custo por minuto de internet
 */
export const calculateInternetCostPerMinute = (data: InternetCostData): number => {
  if (data.monthlyBill <= 0) return 0;
  
  const costPerMinute = data.monthlyBill / MINUTES_PER_MONTH;
  const usageMultiplier = data.usagePercentage / 100;
  
  return roundPrecise(costPerMinute * usageMultiplier);
};

/**
 * Calcula custo por minuto de mão de obra
 */
export const calculateLaborCostPerMinute = (data: LaborCostData): number => {
  if (data.monthlyWithdrawal <= 0) return 0;
  
  const costPerMinute = data.monthlyWithdrawal / WORKING_MINUTES_PER_MONTH;
  
  return roundPrecise(costPerMinute);
};

/**
 * Calcula custo por minuto de um item de custo fixo personalizado
 */
export const calculateOtherFixedCostPerMinute = (item: OtherFixedCostItem): number => {
  if (item.monthlyValue <= 0) return 0;
  
  const costPerMinute = item.monthlyValue / MINUTES_PER_MONTH;
  const usageMultiplier = item.usagePercentage / 100;
  
  return roundPrecise(costPerMinute * usageMultiplier);
};

/**
 * Calcula o custo aplicado baseado no custo por minuto e tempo de produção
 */
export const calculateAppliedCost = (costPerMinute: number, productionTimeMinutes: number): number => {
  if (costPerMinute <= 0 || productionTimeMinutes <= 0) return 0;
  return roundCurrency(costPerMinute * productionTimeMinutes);
};

/**
 * Calcula todos os custos operacionais
 */
export const calculateAllOperationalCosts = (data: OperationalCostsData): AllCalculatedCosts => {
  const productionTime = Math.max(0, data.productionTimeMinutes);
  
  // Equipamento legado (single)
  const equipmentCostPerMinute = calculateEquipmentCostPerMinute(data.equipment);
  const equipmentAppliedCost = calculateAppliedCost(equipmentCostPerMinute, productionTime);
  
  // Múltiplos equipamentos
  const equipments = (data.equipments || []).map(item => {
    const costPerMinute = calculateEquipmentItemCostPerMinute(item);
    const appliedCost = calculateAppliedCost(costPerMinute, productionTime);
    return { costPerMinute, appliedCost };
  });
  
  // Energia
  const electricityCostPerMinute = calculateElectricityCostPerMinute(data.electricity);
  const electricityAppliedCost = calculateAppliedCost(electricityCostPerMinute, productionTime);
  
  // Internet
  const internetCostPerMinute = calculateInternetCostPerMinute(data.internet);
  const internetAppliedCost = calculateAppliedCost(internetCostPerMinute, productionTime);
  
  // Mão de obra
  const laborCostPerMinute = calculateLaborCostPerMinute(data.labor);
  const laborAppliedCost = calculateAppliedCost(laborCostPerMinute, productionTime);
  
  // Outros custos fixos
  const otherFixedCosts = data.otherFixedCosts.map(item => {
    const costPerMinute = calculateOtherFixedCostPerMinute(item);
    const appliedCost = calculateAppliedCost(costPerMinute, productionTime);
    return { costPerMinute, appliedCost };
  });
  
  // Totais - incluir equipamentos múltiplos
  const equipmentsTotalCostPerMinute = equipments.reduce((sum, e) => sum + e.costPerMinute, 0);
  const equipmentsTotalAppliedCost = equipments.reduce((sum, e) => sum + e.appliedCost, 0);
  
  const totalCostPerMinute = roundPrecise(
    equipmentCostPerMinute +
    equipmentsTotalCostPerMinute +
    electricityCostPerMinute +
    internetCostPerMinute +
    laborCostPerMinute +
    otherFixedCosts.reduce((sum, cost) => sum + cost.costPerMinute, 0)
  );
  
  const totalAppliedCost = roundCurrency(
    equipmentAppliedCost +
    equipmentsTotalAppliedCost +
    electricityAppliedCost +
    internetAppliedCost +
    laborAppliedCost +
    otherFixedCosts.reduce((sum, cost) => sum + cost.appliedCost, 0)
  );
  
  return {
    equipment: { costPerMinute: equipmentCostPerMinute, appliedCost: equipmentAppliedCost },
    equipments,
    electricity: { costPerMinute: electricityCostPerMinute, appliedCost: electricityAppliedCost },
    internet: { costPerMinute: internetCostPerMinute, appliedCost: internetAppliedCost },
    labor: { costPerMinute: laborCostPerMinute, appliedCost: laborAppliedCost },
    otherFixedCosts,
    totalCostPerMinute,
    totalAppliedCost,
  };
};
