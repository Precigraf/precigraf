import { SellerType } from '@/components/MarketplaceSection';

export interface ShopeeTier {
  label: string;
  minPrice: number;
  maxPrice: number;
  commissionPercent: number;
  fixedFee: number;
  pixSubsidyPercent: number;
}

// Tabela de faixas Shopee 2026 (CNPJ base)
const SHOPEE_TIERS: ShopeeTier[] = [
  { label: 'Até R$ 79,99', minPrice: 0, maxPrice: 79.99, commissionPercent: 20, fixedFee: 4, pixSubsidyPercent: 0 },
  { label: 'R$ 80,00 a R$ 99,99', minPrice: 80, maxPrice: 99.99, commissionPercent: 14, fixedFee: 16, pixSubsidyPercent: 5 },
  { label: 'R$ 100,00 a R$ 199,99', minPrice: 100, maxPrice: 199.99, commissionPercent: 14, fixedFee: 20, pixSubsidyPercent: 5 },
  { label: 'R$ 200,00 a R$ 499,99', minPrice: 200, maxPrice: 499.99, commissionPercent: 14, fixedFee: 26, pixSubsidyPercent: 5 },
  { label: 'Acima de R$ 500,00', minPrice: 500, maxPrice: Infinity, commissionPercent: 14, fixedFee: 26, pixSubsidyPercent: 8 },
];

const CPF_EXTRA_FEE = 3;

export function getShopeeTier(unitPrice: number): ShopeeTier {
  for (const tier of SHOPEE_TIERS) {
    if (unitPrice <= tier.maxPrice) return tier;
  }
  return SHOPEE_TIERS[SHOPEE_TIERS.length - 1];
}

export interface ShopeeCalcResult {
  unitPrice: number;
  tier: ShopeeTier;
  commissionAmount: number;
  fixedFeeAmount: number;
  cpfFeeAmount: number;
  totalFeesPerUnit: number;
  totalFeesForLot: number;
}

/**
 * Iterative solver: finds the unit price where after Shopee takes its cut,
 * the seller receives at least the base price (cost + profit).
 * 
 * Fixed fee is per ORDER (not per item), so it's divided by quantity.
 */
export function solveShopeeUnitPrice(
  unitBasePrice: number,
  quantity: number,
  sellerType: SellerType,
): ShopeeCalcResult {
  const safeQty = Math.max(1, Math.floor(quantity));
  const cpfFee = sellerType === 'cpf' ? CPF_EXTRA_FEE : 0;

  // Fixed fees per order (not per unit): fixedFee + cpfFee
  // These are divided by quantity to get per-unit cost
  // Commission is a percentage of the final unit price

  // Start with a guess
  let unitPrice = unitBasePrice;

  // Iterate to find stable price (max 20 iterations)
  for (let i = 0; i < 20; i++) {
    const tier = getShopeeTier(unitPrice);
    const commissionFraction = tier.commissionPercent / 100;
    const fixedFeePerUnit = (tier.fixedFee + cpfFee) / safeQty;

    // Formula: unitPrice = (unitBasePrice + fixedFeePerUnit) / (1 - commissionFraction)
    const newUnitPrice = Math.round(((unitBasePrice + fixedFeePerUnit) / (1 - commissionFraction)) * 100) / 100;

    // Check if tier changed
    const newTier = getShopeeTier(newUnitPrice);
    if (newTier === tier && Math.abs(newUnitPrice - unitPrice) < 0.01) {
      unitPrice = newUnitPrice;
      break;
    }
    unitPrice = newUnitPrice;
  }

  const tier = getShopeeTier(unitPrice);
  const commissionAmount = Math.round(unitPrice * (tier.commissionPercent / 100) * 100) / 100;
  const fixedFeePerUnit = Math.round((tier.fixedFee / safeQty) * 100) / 100;
  const cpfFeePerUnit = Math.round((cpfFee / safeQty) * 100) / 100;
  const totalFeesPerUnit = Math.round((commissionAmount + fixedFeePerUnit + cpfFeePerUnit) * 100) / 100;

  return {
    unitPrice: Math.round(unitPrice * 100) / 100,
    tier,
    commissionAmount,
    fixedFeeAmount: fixedFeePerUnit,
    cpfFeeAmount: cpfFeePerUnit,
    totalFeesPerUnit,
    totalFeesForLot: Math.round(totalFeesPerUnit * safeQty * 100) / 100,
  };
}

export function getTierLabel(tier: ShopeeTier, sellerType: SellerType): string {
  return `Faixa ${tier.label} — Shopee 2026 ${sellerType.toUpperCase()}`;
}
