// Tipos para o sistema avançado de custos operacionais com rateio por tempo

export interface EquipmentDepreciationData {
  equipmentValue: number;
  usefulLifeYears: number; // padrão: 5
  usagePercentage: number; // 0-100
}

export interface EquipmentItem {
  id: string;
  name: string;
  equipmentValue: number;
  usefulLifeYears: number;
  usagePercentage: number;
}

export interface ElectricityCostData {
  monthlyBill: number;
  usagePercentage: number; // 0-100
}

export interface InternetCostData {
  monthlyBill: number;
  usagePercentage: number; // 0-100
}

export interface LaborCostData {
  monthlyWithdrawal: number; // quanto deseja retirar por mês
}

export interface OtherFixedCostItem {
  id: string;
  name: string;
  monthlyValue: number;
  usagePercentage: number; // 0-100
}

export interface OperationalCostsData {
  productionTimeMinutes: number;
  equipment: EquipmentDepreciationData; // kept for backwards compat
  equipments: EquipmentItem[];
  electricity: ElectricityCostData;
  internet: InternetCostData;
  labor: LaborCostData;
  otherFixedCosts: OtherFixedCostItem[];
}

export interface CalculatedOperationalCost {
  costPerMinute: number;
  appliedCost: number;
}

export interface AllCalculatedCosts {
  equipment: CalculatedOperationalCost;
  equipments: CalculatedOperationalCost[];
  electricity: CalculatedOperationalCost;
  internet: CalculatedOperationalCost;
  labor: CalculatedOperationalCost;
  otherFixedCosts: CalculatedOperationalCost[];
  totalCostPerMinute: number;
  totalAppliedCost: number;
}

// Constantes de conversão de tempo
export const HOURS_PER_DAY = 24;
export const DAYS_PER_MONTH = 30;
export const HOURS_PER_MONTH = HOURS_PER_DAY * DAYS_PER_MONTH; // 720
export const MINUTES_PER_HOUR = 60;
export const MINUTES_PER_DAY = HOURS_PER_DAY * MINUTES_PER_HOUR; // 1440
export const MINUTES_PER_MONTH = HOURS_PER_MONTH * MINUTES_PER_HOUR; // 43200
export const WORKING_HOURS_PER_MONTH = 220; // CLT padrão
export const WORKING_MINUTES_PER_MONTH = WORKING_HOURS_PER_MONTH * MINUTES_PER_HOUR; // 13200

// Valores padrão
export const DEFAULT_EQUIPMENT_DATA: EquipmentDepreciationData = {
  equipmentValue: 0,
  usefulLifeYears: 5,
  usagePercentage: 100,
};

export const DEFAULT_ELECTRICITY_DATA: ElectricityCostData = {
  monthlyBill: 0,
  usagePercentage: 100,
};

export const DEFAULT_INTERNET_DATA: InternetCostData = {
  monthlyBill: 0,
  usagePercentage: 100,
};

export const DEFAULT_LABOR_DATA: LaborCostData = {
  monthlyWithdrawal: 0,
};

export const DEFAULT_OPERATIONAL_COSTS_DATA: OperationalCostsData = {
  productionTimeMinutes: 0,
  equipment: DEFAULT_EQUIPMENT_DATA,
  equipments: [],
  electricity: DEFAULT_ELECTRICITY_DATA,
  internet: DEFAULT_INTERNET_DATA,
  labor: DEFAULT_LABOR_DATA,
  otherFixedCosts: [],
};
