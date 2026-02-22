// Shopee 2026 Fee Calculation Utilities
// Taxa fixa é POR PEDIDO (não por item). Comissão % é POR UNIDADE.

const roundCurrency = (v: number): number => Math.round(v * 100) / 100;

export interface ShopeeCommissionTier {
  minPrice: number;
  maxPrice: number;
  commissionRate: number; // decimal (0.20 = 20%)
  fixedFee: number; // R$ por PEDIDO (não por item)
  pixRate: number; // 0, 0.05, or 0.08
  label: string;
}

export const SHOPEE_TIERS_2026: ShopeeCommissionTier[] = [
  { minPrice: 0, maxPrice: 79.99, commissionRate: 0.20, fixedFee: 4.00, pixRate: 0, label: 'Até R$ 79,99' },
  { minPrice: 80, maxPrice: 99.99, commissionRate: 0.14, fixedFee: 16.00, pixRate: 0.05, label: 'R$ 80 – R$ 99,99' },
  { minPrice: 100, maxPrice: 199.99, commissionRate: 0.14, fixedFee: 20.00, pixRate: 0.05, label: 'R$ 100 – R$ 199,99' },
  { minPrice: 200, maxPrice: 499.99, commissionRate: 0.14, fixedFee: 26.00, pixRate: 0.05, label: 'R$ 200 – R$ 499,99' },
  { minPrice: 500, maxPrice: Infinity, commissionRate: 0.14, fixedFee: 26.00, pixRate: 0.08, label: 'R$ 500+' },
];

/** Taxa adicional fixa para vendedores CPF — aplicada em TODAS as faixas, por pedido */
export const CPF_ADDITIONAL_FEE = 3.00;

/**
 * Retorna a faixa de comissão com base no preço unitário final.
 */
export function getCommissionTier(unitPrice: number): ShopeeCommissionTier {
  for (const tier of SHOPEE_TIERS_2026) {
    if (unitPrice <= tier.maxPrice) return tier;
  }
  return SHOPEE_TIERS_2026[SHOPEE_TIERS_2026.length - 1];
}

/**
 * Retorna a taxa de subsídio Pix com base no preço unitário.
 */
export function getPixSubsidyRate(unitPrice: number): number {
  const tier = getCommissionTier(unitPrice);
  return tier.pixRate;
}

export function calculatePixSubsidyAmount(unitPrice: number): number {
  return roundCurrency(unitPrice * getPixSubsidyRate(unitPrice));
}

export function calculateFreightSubsidy(unitPrice: number): number {
  if (unitPrice >= 200) return 40;
  if (unitPrice >= 80) return 30;
  return 20;
}

export interface ShopeeFeesResult {
  /** Preço unitário final de venda (com comissão % embutida, SEM taxa fixa) */
  unitPrice: number;
  /** Faixa de comissão identificada */
  tier: ShopeeCommissionTier;
  /** Taxa de comissão % aplicada */
  commissionRate: number;
  /** Valor da comissão por unidade em R$ */
  commissionPerUnit: number;
  /** Taxa fixa por PEDIDO (R$ 4/16/20/26) */
  fixedFeePerOrder: number;
  /** Taxa CPF por PEDIDO (R$ 3 ou R$ 0) */
  cpfFeePerOrder: number;
  /** Total de taxas fixas por pedido (fixedFee + cpfFee) */
  totalFixedFeesPerOrder: number;
  /** Valor do subsídio Pix por unidade */
  pixSubsidyPerUnit: number;
  /** Subsídio de frete */
  freightSubsidy: number;
  /** Label da faixa */
  tierLabel: string;
}

/**
 * Calcula o preço unitário final que embute a comissão Shopee 2026.
 * 
 * REGRAS:
 * - Comissão (%) incide sobre o preço final unitário → embutida no preço
 * - Pix (%) reduz a base de cálculo da comissão
 * - Taxa fixa (R$ 4/16/20/26) é POR PEDIDO → NÃO embutida no preço unitário
 * - Taxa CPF (R$ 3) é POR PEDIDO → NÃO embutida no preço unitário
 * 
 * Fórmula (com Pix):
 *   unitPrice = unitBasePrice / (1 - commRate * (1 - pixRate))
 * 
 * Fórmula (sem Pix):
 *   unitPrice = unitBasePrice / (1 - commRate)
 */
export function calculateShopeeUnitPrice(
  unitBaseSellingPrice: number,
  isCpf: boolean,
  usePixSubsidy: boolean,
): ShopeeFeesResult {
  const empty: ShopeeFeesResult = {
    unitPrice: 0, tier: SHOPEE_TIERS_2026[0], commissionRate: 0,
    commissionPerUnit: 0, fixedFeePerOrder: 0, cpfFeePerOrder: 0,
    totalFixedFeesPerOrder: 0, pixSubsidyPerUnit: 0,
    freightSubsidy: 0, tierLabel: '',
  };

  if (unitBaseSellingPrice <= 0) return empty;

  // Iterative solver: find unitPrice where seller receives unitBaseSellingPrice after commission %
  let estimate = unitBaseSellingPrice * 1.3;

  for (let i = 0; i < 20; i++) {
    const tier = getCommissionTier(estimate);
    const pixRate = usePixSubsidy ? tier.pixRate : 0;

    // Commission is calculated on (unitPrice * (1 - pixRate)) when using Pix subsidy
    // seller_receives = unitPrice - unitPrice * (1 - pixRate) * commRate
    // seller_receives = unitPrice * (1 - commRate * (1 - pixRate))
    // unitPrice = seller_receives / (1 - commRate * (1 - pixRate))
    const effectiveCommRate = tier.commissionRate * (1 - pixRate);
    const denominator = 1 - effectiveCommRate;

    const requiredPrice = denominator > 0.01
      ? unitBaseSellingPrice / denominator
      : unitBaseSellingPrice;

    if (Math.abs(requiredPrice - estimate) < 0.01) {
      estimate = requiredPrice;
      break;
    }
    estimate = Math.max(0, requiredPrice);
  }

  estimate = roundCurrency(estimate);

  // Final breakdown
  const tier = getCommissionTier(estimate);
  const pixRate = usePixSubsidy ? tier.pixRate : 0;
  const pixAmount = roundCurrency(estimate * pixRate);
  const commissionBase = estimate - pixAmount; // base after Pix subsidy
  const commissionPerUnit = roundCurrency(commissionBase * tier.commissionRate);
  const cpfFee = isCpf ? CPF_ADDITIONAL_FEE : 0;

  return {
    unitPrice: estimate,
    tier,
    commissionRate: tier.commissionRate * 100,
    commissionPerUnit,
    fixedFeePerOrder: tier.fixedFee,
    cpfFeePerOrder: cpfFee,
    totalFixedFeesPerOrder: roundCurrency(tier.fixedFee + cpfFee),
    pixSubsidyPerUnit: pixAmount,
    freightSubsidy: calculateFreightSubsidy(estimate),
    tierLabel: tier.label,
  };
}

/**
 * Calcula o total de taxas Shopee para um pedido com N unidades.
 * 
 * Total = (comissão_por_unidade × quantidade) + taxa_fixa_pedido + taxa_cpf_pedido
 */
export function calculateShopeeOrderFees(
  shopeeResult: ShopeeFeesResult,
  quantity: number,
): { totalCommission: number; totalFixedFees: number; totalFees: number } {
  const safeQty = Math.max(1, Math.floor(quantity));
  const totalCommission = roundCurrency(shopeeResult.commissionPerUnit * safeQty);
  const totalFixedFees = shopeeResult.totalFixedFeesPerOrder; // NOT multiplied by quantity
  const totalFees = roundCurrency(totalCommission + totalFixedFees);
  return { totalCommission, totalFixedFees, totalFees };
}
