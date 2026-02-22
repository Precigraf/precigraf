// Shopee 2026 Fee Calculation Utilities
// Aligned with the reference Python implementation

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

/**
 * Returns commission details: { commissionRate, fixedFee, cpfAdditionalFee }
 * For CPF sellers with items < R$12, returns a flat regressive fee as fixedFee with 0% rate.
 */
export function getCommissionDetails(
  itemValue: number,
  isCpf: boolean,
): { commissionRate: number; fixedFee: number; cpfAdditionalFee: number; tierLabel: string } {
  // CPF regressive for items < R$12
  if (isCpf && itemValue < 12) {
    let flatFee = 3.00;
    if (itemValue >= 10) flatFee = 6.50;
    else if (itemValue >= 8) flatFee = 6.00;
    return { commissionRate: 0, fixedFee: flatFee, cpfAdditionalFee: 0, tierLabel: 'CPF < R$ 12' };
  }

  // Standard tiers for CNPJ and CPF (items >= R$12)
  const tier = getCommissionTier(itemValue);
  const cpfAdditionalFee = (isCpf && itemValue >= 12) ? CPF_ADDITIONAL_FEE : 0;

  return {
    commissionRate: tier.commissionRate,
    fixedFee: tier.fixedFee,
    cpfAdditionalFee,
    tierLabel: tier.label,
  };
}

export function getCommissionTier(itemValue: number): ShopeeCommissionTier {
  for (const tier of SHOPEE_TIERS_2026) {
    if (itemValue <= tier.maxPrice) return tier;
  }
  return SHOPEE_TIERS_2026[SHOPEE_TIERS_2026.length - 1];
}

/**
 * Calculates the total Shopee commission in R$ for a given item value.
 * When Pix subsidy is used, the commission is calculated on (itemValue - pixSubsidy).
 */
export function calculateShopeeCommission(
  itemValue: number,
  isCpf: boolean,
  usePixSubsidy: boolean,
): number {
  let effectiveValue = itemValue;
  if (usePixSubsidy) {
    effectiveValue = itemValue - calculatePixSubsidyAmount(itemValue);
  }

  const { commissionRate, fixedFee, cpfAdditionalFee } = getCommissionDetails(effectiveValue, isCpf);

  if (commissionRate === 0) {
    // Flat regressive fee (CPF < R$12) — fixedFee already contains the total
    return fixedFee;
  }

  return roundCurrency(effectiveValue * commissionRate + fixedFee + cpfAdditionalFee);
}

export function getPixSubsidyRate(itemValue: number): number {
  if (itemValue >= 500) return 0.08;
  if (itemValue >= 80) return 0.05;
  return 0;
}

export function calculatePixSubsidyAmount(itemValue: number): number {
  return roundCurrency(itemValue * getPixSubsidyRate(itemValue));
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
 * Uses the iterative algebraic solver from the reference Python implementation:
 *
 * For percentage-based tiers:
 *   PV = (unitBaseSellingPrice + fixedFee + cpfFee) / (1 - effectiveCommissionRate)
 *   where effectiveCommissionRate = commissionRate * (1 - pixSubsidyRate) when using Pix
 *
 * For CPF flat-fee tiers (< R$12):
 *   PV = unitBaseSellingPrice + flatFee
 *
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

  // Initial guess
  let estimate = unitBaseSellingPrice * 1.3;

  for (let i = 0; i < 20; i++) {
    const pixRate = usePixSubsidy ? getPixSubsidyRate(estimate) : 0;
    const pixAmount = estimate * pixRate;
    const effectiveValue = estimate - pixAmount;

    const details = getCommissionDetails(effectiveValue, isCpf);

    let requiredPrice: number;

    if (details.commissionRate === 0) {
      // CPF flat-fee regressive (< R$12): PV = base + flatFee
      requiredPrice = unitBaseSellingPrice + details.fixedFee;
    } else {
      // Algebraic: PV = (base + fixedFee + cpfFee) / (1 - commRate * (1 - pixRate))
      const effectiveCommRate = details.commissionRate * (1 - pixRate);
      const denominator = 1 - effectiveCommRate;
      if (denominator <= 0.01) {
        requiredPrice = unitBaseSellingPrice + details.fixedFee + details.cpfAdditionalFee;
      } else {
        requiredPrice = (unitBaseSellingPrice + details.fixedFee + details.cpfAdditionalFee) / denominator;
      }
    }

    if (Math.abs(requiredPrice - estimate) < 0.01) {
      estimate = requiredPrice;
      break;
    }
    estimate = Math.max(0, requiredPrice);
  }

  estimate = roundCurrency(estimate);

  // Final breakdown
  const pixRate = usePixSubsidy ? getPixSubsidyRate(estimate) : 0;
  const pixAmount = roundCurrency(estimate * pixRate);
  const effectiveValue = estimate - pixAmount;
  const details = getCommissionDetails(effectiveValue, isCpf);

  let commAmount: number;
  if (details.commissionRate === 0) {
    commAmount = details.fixedFee; // flat regressive
  } else {
    commAmount = roundCurrency(effectiveValue * details.commissionRate);
  }

  const totalFees = details.commissionRate === 0
    ? details.fixedFee
    : roundCurrency(commAmount + details.fixedFee + details.cpfAdditionalFee);

  return {
    unitPrice: estimate,
    commissionRate: details.commissionRate * 100,
    commissionAmount: commAmount,
    fixedFee: details.fixedFee,
    cpfAdditionalFee: details.cpfAdditionalFee,
    pixSubsidyAmount: pixAmount,
    freightSubsidy: calculateFreightSubsidy(estimate),
    totalFeesPerUnit: totalFees,
    tierLabel: details.tierLabel,
  };
}
