// Shopee 2026 Fee Calculation Utilities

const roundCurrency = (v: number): number => Math.round(v * 100) / 100;

export interface ShopeeCommissionTier {
  minPrice: number;
  maxPrice: number;
  commissionRate: number; // decimal (0.20 = 20%)
  fixedFee: number; // R$ per item
  label: string;
}

export const SHOPEE_TIERS_2026: ShopeeCommissionTier[] = [
  { minPrice: 0, maxPrice: 79.99, commissionRate: 0.20, fixedFee: 4.00, label: 'Até R$ 79,99' },
  { minPrice: 80, maxPrice: 99.99, commissionRate: 0.14, fixedFee: 16.00, label: 'R$ 80 – R$ 99,99' },
  { minPrice: 100, maxPrice: 199.99, commissionRate: 0.14, fixedFee: 20.00, label: 'R$ 100 – R$ 199,99' },
  { minPrice: 200, maxPrice: 499.99, commissionRate: 0.14, fixedFee: 26.00, label: 'R$ 200 – R$ 499,99' },
  { minPrice: 500, maxPrice: Infinity, commissionRate: 0.14, fixedFee: 26.00, label: 'R$ 500+' },
];

export const CPF_ADDITIONAL_FEE = 3.00;

export function getCommissionTier(itemValue: number): ShopeeCommissionTier {
  for (const tier of SHOPEE_TIERS_2026) {
    if (itemValue <= tier.maxPrice) return tier;
  }
  return SHOPEE_TIERS_2026[SHOPEE_TIERS_2026.length - 1];
}

export function getPixSubsidyRate(itemValue: number): number {
  if (itemValue >= 500) return 0.08;
  if (itemValue >= 80) return 0.05;
  return 0;
}

export function calculateFreightSubsidy(itemValue: number): number {
  if (itemValue >= 200) return 40;
  if (itemValue >= 80) return 30;
  return 20;
}

export interface ShopeeFeesResult {
  unitPrice: number;
  commissionRate: number;
  commissionAmount: number;
  fixedFee: number;
  cpfAdditionalFee: number;
  pixSubsidyAmount: number;
  freightSubsidy: number;
  totalFeesPerUnit: number;
  tierLabel: string;
}

/**
 * Calculate the final unit price that embeds Shopee 2026 fees.
 * Uses iterative solving since tier/rates depend on the final price.
 * After Shopee deducts its fees, the seller receives unitBaseSellingPrice.
 */
export function calculateShopeeUnitPrice(
  unitBaseSellingPrice: number,
  isCpf: boolean,
  usePixSubsidy: boolean,
): ShopeeFeesResult {
  const empty: ShopeeFeesResult = {
    unitPrice: 0, commissionRate: 0, commissionAmount: 0,
    fixedFee: 0, cpfAdditionalFee: 0, pixSubsidyAmount: 0,
    freightSubsidy: 0, totalFeesPerUnit: 0, tierLabel: '',
  };

  if (unitBaseSellingPrice <= 0) return empty;

  const cpfFee = isCpf ? CPF_ADDITIONAL_FEE : 0;
  let estimate = unitBaseSellingPrice * 1.3;

  for (let i = 0; i < 15; i++) {
    const pixRate = usePixSubsidy ? getPixSubsidyRate(estimate) : 0;
    const effectiveValue = estimate * (1 - pixRate);

    // CPF regressive for very cheap items (< R$12)
    if (isCpf && effectiveValue < 12) {
      let fixedCommission = 3.00;
      if (effectiveValue >= 10) fixedCommission = 6.50;
      else if (effectiveValue >= 8) fixedCommission = 6.00;

      const up = roundCurrency(unitBaseSellingPrice + fixedCommission);
      return {
        unitPrice: up, commissionRate: 0, commissionAmount: fixedCommission,
        fixedFee: 0, cpfAdditionalFee: 0, pixSubsidyAmount: 0,
        freightSubsidy: calculateFreightSubsidy(up),
        totalFeesPerUnit: fixedCommission, tierLabel: 'CPF < R$ 12',
      };
    }

    const tier = getCommissionTier(effectiveValue);
    // seller_receives = unitPrice - (unitPrice*(1-pixRate)) * commRate - fixedFee - cpfFee
    // unitPrice * (1 - (1-pixRate)*commRate) = unitBaseSellingPrice + fixedFee + cpfFee
    const denominator = 1 - (1 - pixRate) * tier.commissionRate;
    if (denominator <= 0.01) {
      estimate = unitBaseSellingPrice + tier.fixedFee + cpfFee;
      break;
    }

    const newEstimate = (unitBaseSellingPrice + tier.fixedFee + cpfFee) / denominator;
    if (Math.abs(newEstimate - estimate) < 0.01) {
      estimate = newEstimate;
      break;
    }
    estimate = Math.max(0, newEstimate);
  }

  estimate = roundCurrency(estimate);
  const pixRate = usePixSubsidy ? getPixSubsidyRate(estimate) : 0;
  const pixAmount = roundCurrency(estimate * pixRate);
  const effectiveValue = estimate - pixAmount;
  const tier = getCommissionTier(effectiveValue);
  const commAmount = roundCurrency(effectiveValue * tier.commissionRate);

  return {
    unitPrice: estimate,
    commissionRate: tier.commissionRate * 100,
    commissionAmount: commAmount,
    fixedFee: tier.fixedFee,
    cpfAdditionalFee: cpfFee,
    pixSubsidyAmount: pixAmount,
    freightSubsidy: calculateFreightSubsidy(estimate),
    totalFeesPerUnit: roundCurrency(commAmount + tier.fixedFee + cpfFee),
    tierLabel: tier.label,
  };
}
