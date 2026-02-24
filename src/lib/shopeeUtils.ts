/**
 * Shopee Fee Calculator — 2026 rules
 * Iterative solver: the fee tier depends on the final selling price,
 * so we iterate until the tier stabilises.
 */

export interface ShopeeFeeRule {
  min: number;
  max: number | null;
  percent: number;
  fixed: number;
}

export const SHOPEE_FEE_RULES: ShopeeFeeRule[] = [
  { min: 0,   max: 79.99,  percent: 0.20, fixed: 4  },
  { min: 80,  max: 99.99,  percent: 0.14, fixed: 16 },
  { min: 100, max: 199.99, percent: 0.14, fixed: 20 },
  { min: 200, max: 499.99, percent: 0.14, fixed: 26 },
  { min: 500, max: null,   percent: 0.14, fixed: 26 },
];

const CPF_EXTRA_FEE = 3;

function getTier(price: number): ShopeeFeeRule {
  for (const rule of SHOPEE_FEE_RULES) {
    if (rule.max === null) return rule;
    if (price >= rule.min && price <= rule.max) return rule;
  }
  return SHOPEE_FEE_RULES[SHOPEE_FEE_RULES.length - 1];
}

export type SellerTypeShopee = 'cpf' | 'cnpj';

export interface ShopeeCalcResult {
  /** Preço final de venda na Shopee (por unidade) */
  price_shopee: number;
  /** Percentual de comissão aplicado */
  fee_percent: number;
  /** Valor da comissão percentual */
  fee_percent_value: number;
  /** Taxa fixa da faixa */
  fee_fixed: number;
  /** Taxa CPF extra (0 se CNPJ) */
  fee_cpf_extra: number;
  /** Total de taxas */
  total_fee: number;
  /** Valor líquido do vendedor */
  seller_net: number;
  /** Faixa de preço utilizada */
  tier: ShopeeFeeRule;
}

/**
 * Calcula o preço final Shopee por unidade usando solver iterativo.
 * @param baseCost  Custo de produção + lucro desejado **por unidade**
 * @param sellerType  'cpf' | 'cnpj'
 */
export function calculateShopeePrice(
  baseCost: number,
  sellerType: SellerTypeShopee,
): ShopeeCalcResult {
  if (baseCost <= 0) {
    return {
      price_shopee: 0,
      fee_percent: 0,
      fee_percent_value: 0,
      fee_fixed: 0,
      fee_cpf_extra: 0,
      total_fee: 0,
      seller_net: 0,
      tier: SHOPEE_FEE_RULES[0],
    };
  }

  const cpfExtra = sellerType === 'cpf' ? CPF_EXTRA_FEE : 0;

  // Start with a rough estimate to pick initial tier
  let tier = getTier(baseCost);
  let price = 0;
  const MAX_ITER = 20;

  for (let i = 0; i < MAX_ITER; i++) {
    const fixedTotal = tier.fixed + cpfExtra;
    // PV = (base + fixedTotal) / (1 - percent)
    price = (baseCost + fixedTotal) / (1 - tier.percent);
    price = Math.round(price * 100) / 100;

    const newTier = getTier(price);
    if (newTier.min === tier.min && newTier.max === tier.max) {
      break; // Stable
    }
    tier = newTier;
  }

  const feePercentValue = Math.round(price * tier.percent * 100) / 100;
  const totalFee = Math.round((feePercentValue + tier.fixed + cpfExtra) * 100) / 100;
  const sellerNet = Math.round((price - totalFee) * 100) / 100;

  return {
    price_shopee: price,
    fee_percent: tier.percent,
    fee_percent_value: feePercentValue,
    fee_fixed: tier.fixed,
    fee_cpf_extra: cpfExtra,
    total_fee: totalFee,
    seller_net: sellerNet,
    tier,
  };
}
