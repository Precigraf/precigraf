// Motor de cálculo de taxas Shopee 2026 (CPF/CNPJ)
// Taxa fixa e taxa CPF são POR PEDIDO (não por item)

export type SellerType = 'cpf' | 'cnpj';

export interface Shopee2026FeeBreakdown {
  rangeId: string;              // ID da faixa detectada (derivado, nunca armazenado)
  commissionPercent: number;
  commissionValue: number;      // por unidade
  fixedFee: number;             // POR PEDIDO (valor total, não por unidade)
  cpfTax: number;               // POR PEDIDO (valor total, não por unidade)
  pixSubsidyPercent: number;
  pixSubsidyValue: number;      // por unidade
  totalFees: number;            // total do pedido (todas as taxas)
  totalFeesPerUnit: number;     // taxas por unidade (para exibição)
  priceRange: string;
  finalPrice: number;           // preço final por unidade
  profit: number;               // lucro por unidade
  realMarginPercent: number;
  quantity: number;             // quantidade usada no cálculo
}

const roundCurrency = (value: number): number => {
  if (!Number.isFinite(value) || isNaN(value)) return 0;
  return Math.round(value * 100) / 100;
};

export type ShopeeRangeId = 'ATE_79' | '80_99' | '100_199' | '200_499' | '500_PLUS';

interface ShopeeRangeTiers {
  id: ShopeeRangeId;
  commissionPercent: number;
  fixedFee: number;
  pixSubsidyPercent: number;
  priceRange: string;
}

/**
 * FUNÇÃO PURA — Detecta a faixa de taxas da Shopee 2026 EXCLUSIVAMENTE
 * a partir do PREÇO FINAL DE VENDA unitário.
 * 
 * NUNCA armazenar o resultado. Sempre chamar novamente quando o preço mudar.
 * Esta função é DETERMINÍSTICA: mesmo input → mesmo output, sempre.
 */
export function detectarFaixa(precoFinalVenda: number): ShopeeRangeId {
  if (precoFinalVenda <= 79.99) return 'ATE_79';
  if (precoFinalVenda <= 99.99) return '80_99';
  if (precoFinalVenda <= 199.99) return '100_199';
  if (precoFinalVenda <= 499.99) return '200_499';
  return '500_PLUS';
}

const SHOPEE_RANGE_TIERS: Record<ShopeeRangeId, Omit<ShopeeRangeTiers, 'id'>> = {
  'ATE_79':    { commissionPercent: 20, fixedFee: 4,  pixSubsidyPercent: 0, priceRange: 'Até R$ 79,99' },
  '80_99':     { commissionPercent: 14, fixedFee: 16, pixSubsidyPercent: 5, priceRange: 'R$ 80,00 – R$ 99,99' },
  '100_199':   { commissionPercent: 14, fixedFee: 20, pixSubsidyPercent: 5, priceRange: 'R$ 100,00 – R$ 199,99' },
  '200_499':   { commissionPercent: 14, fixedFee: 26, pixSubsidyPercent: 5, priceRange: 'R$ 200,00 – R$ 499,99' },
  '500_PLUS':  { commissionPercent: 14, fixedFee: 26, pixSubsidyPercent: 8, priceRange: 'Acima de R$ 500,00' },
};

/**
 * Retorna a faixa de taxas da Shopee 2026 com base no preço final unitário.
 * Sempre recalcula — NUNCA usa cache.
 */
function getShopeeRange(unitFinalPrice: number): ShopeeRangeTiers {
  const id = detectarFaixa(unitFinalPrice);
  return { id, ...SHOPEE_RANGE_TIERS[id] };
}

/**
 * Calcula as taxas da Shopee 2026 com base no preço final unitário já calculado.
 * Usado para exibição de breakdown.
 * Taxa fixa e CPF são POR PEDIDO.
 */
export function calculateShopee2026Fees(
  unitFinalPrice: number,
  sellerType: SellerType,
  quantity: number = 1
): Shopee2026FeeBreakdown {
  const safeQty = Math.max(1, Math.floor(quantity));

  if (unitFinalPrice <= 0) {
    return {
      rangeId: '-', commissionPercent: 0, commissionValue: 0, fixedFee: 0, cpfTax: 0,
      pixSubsidyPercent: 0, pixSubsidyValue: 0, totalFees: 0, totalFeesPerUnit: 0,
      priceRange: '-', finalPrice: 0, profit: 0, realMarginPercent: 0, quantity: safeQty,
    };
  }

  const range = getShopeeRange(unitFinalPrice);
  const cpfTax = sellerType === 'cpf' ? 3 : 0; // por pedido
  const commissionValue = roundCurrency(unitFinalPrice * (range.commissionPercent / 100)); // por unidade
  const pixSubsidyValue = roundCurrency(unitFinalPrice * (range.pixSubsidyPercent / 100)); // por unidade

  // Total do pedido: (comissão + pix) * qty + fixedFee + cpfTax
  const totalFees = roundCurrency(
    (commissionValue + pixSubsidyValue) * safeQty + range.fixedFee + cpfTax
  );
  const totalFeesPerUnit = roundCurrency(totalFees / safeQty);

  return {
    rangeId: range.id,
    commissionPercent: range.commissionPercent,
    commissionValue,
    fixedFee: range.fixedFee,
    cpfTax,
    pixSubsidyPercent: range.pixSubsidyPercent,
    pixSubsidyValue,
    totalFees,
    totalFeesPerUnit,
    priceRange: range.priceRange,
    finalPrice: unitFinalPrice,
    profit: 0,
    realMarginPercent: 0,
    quantity: safeQty,
  };
}

/**
 * Calcula o PREÇO FINAL unitário usando equação inversa.
 * 
 * Taxa fixa e CPF são POR PEDIDO, então são divididos pela quantidade.
 * 
 * Preço Final = (Custo Unitário + (Taxa Fixa + Taxa CPF) / Qty) / (1 - Comissão% - Subsídio Pix% - Margem%)
 * 
 * Resolve iterativamente porque a faixa de taxas depende do preço final.
 */
export function calculateShopee2026InversePrice(
  unitProductionCost: number,
  marginPercent: number,
  sellerType: SellerType,
  quantity: number = 1
): Shopee2026FeeBreakdown {
  const safeQty = Math.max(1, Math.floor(quantity));

  if (unitProductionCost <= 0) {
    return {
      rangeId: '-', commissionPercent: 0, commissionValue: 0, fixedFee: 0, cpfTax: 0,
      pixSubsidyPercent: 0, pixSubsidyValue: 0, totalFees: 0, totalFeesPerUnit: 0,
      priceRange: '-', finalPrice: 0, profit: 0, realMarginPercent: 0, quantity: safeQty,
    };
  }

  const cpfTax = sellerType === 'cpf' ? 3 : 0; // por pedido
  const marginDecimal = Math.min(Math.max(0, marginPercent), 999) / 100;

  // Taxas fixas por pedido, amortizadas por unidade
  const fixedCostsPerUnit = (0 + cpfTax) / safeQty; // fixedFee será adicionado pela faixa

  let currentRange = getShopeeRange(unitProductionCost);
  let finalPrice = 0;

  for (let i = 0; i < 10; i++) {
    const commDecimal = currentRange.commissionPercent / 100;
    const pixDecimal = currentRange.pixSubsidyPercent / 100;
    const denominator = 1 - commDecimal - pixDecimal - marginDecimal;

    if (denominator <= 0) {
      finalPrice = roundCurrency(
        (unitProductionCost + (currentRange.fixedFee + cpfTax) / safeQty) / 0.01
      );
      break;
    }

    finalPrice = roundCurrency(
      (unitProductionCost + (currentRange.fixedFee + cpfTax) / safeQty) / denominator
    );

    const newRange = getShopeeRange(finalPrice);
    if (
      newRange.commissionPercent === currentRange.commissionPercent &&
      newRange.fixedFee === currentRange.fixedFee &&
      newRange.pixSubsidyPercent === currentRange.pixSubsidyPercent
    ) {
      break;
    }
    currentRange = newRange;
  }

  const commissionValue = roundCurrency(finalPrice * (currentRange.commissionPercent / 100));
  const pixSubsidyValue = roundCurrency(finalPrice * (currentRange.pixSubsidyPercent / 100));
  
  // Total do pedido
  const totalFees = roundCurrency(
    (commissionValue + pixSubsidyValue) * safeQty + currentRange.fixedFee + cpfTax
  );
  const totalFeesPerUnit = roundCurrency(totalFees / safeQty);
  
  const profit = roundCurrency(finalPrice * marginDecimal);
  const realMarginPercent = finalPrice > 0 ? roundCurrency((profit / finalPrice) * 100) : 0;

  return {
    rangeId: currentRange.id,
    commissionPercent: currentRange.commissionPercent,
    commissionValue,
    fixedFee: currentRange.fixedFee,
    cpfTax,
    pixSubsidyPercent: currentRange.pixSubsidyPercent,
    pixSubsidyValue,
    totalFees,
    totalFeesPerUnit,
    priceRange: currentRange.priceRange,
    finalPrice,
    profit,
    realMarginPercent,
    quantity: safeQty,
  };
}

/**
 * Versão para lucro fixo (R$) em vez de margem percentual.
 * Taxa fixa e CPF são POR PEDIDO.
 */
export function calculateShopee2026InversePriceFixedProfit(
  unitProductionCost: number,
  unitFixedProfit: number,
  sellerType: SellerType,
  quantity: number = 1
): Shopee2026FeeBreakdown {
  const safeQty = Math.max(1, Math.floor(quantity));

  if (unitProductionCost <= 0 && unitFixedProfit <= 0) {
    return {
      rangeId: '-', commissionPercent: 0, commissionValue: 0, fixedFee: 0, cpfTax: 0,
      pixSubsidyPercent: 0, pixSubsidyValue: 0, totalFees: 0, totalFeesPerUnit: 0,
      priceRange: '-', finalPrice: 0, profit: 0, realMarginPercent: 0, quantity: safeQty,
    };
  }

  const cpfTax = sellerType === 'cpf' ? 3 : 0;
  let currentRange = getShopeeRange(unitProductionCost + unitFixedProfit);
  let finalPrice = 0;

  for (let i = 0; i < 10; i++) {
    const commDecimal = currentRange.commissionPercent / 100;
    const pixDecimal = currentRange.pixSubsidyPercent / 100;
    const denominator = 1 - commDecimal - pixDecimal;

    if (denominator <= 0) {
      finalPrice = roundCurrency(
        (unitProductionCost + unitFixedProfit + (currentRange.fixedFee + cpfTax) / safeQty) / 0.01
      );
      break;
    }

    finalPrice = roundCurrency(
      (unitProductionCost + unitFixedProfit + (currentRange.fixedFee + cpfTax) / safeQty) / denominator
    );

    const newRange = getShopeeRange(finalPrice);
    if (
      newRange.commissionPercent === currentRange.commissionPercent &&
      newRange.fixedFee === currentRange.fixedFee &&
      newRange.pixSubsidyPercent === currentRange.pixSubsidyPercent
    ) {
      break;
    }
    currentRange = newRange;
  }

  const commissionValue = roundCurrency(finalPrice * (currentRange.commissionPercent / 100));
  const pixSubsidyValue = roundCurrency(finalPrice * (currentRange.pixSubsidyPercent / 100));
  const totalFees = roundCurrency(
    (commissionValue + pixSubsidyValue) * safeQty + currentRange.fixedFee + cpfTax
  );
  const totalFeesPerUnit = roundCurrency(totalFees / safeQty);
  const realMarginPercent = finalPrice > 0 ? roundCurrency((unitFixedProfit / finalPrice) * 100) : 0;

  return {
    rangeId: currentRange.id,
    commissionPercent: currentRange.commissionPercent,
    commissionValue,
    fixedFee: currentRange.fixedFee,
    cpfTax,
    pixSubsidyPercent: currentRange.pixSubsidyPercent,
    pixSubsidyValue,
    totalFees,
    totalFeesPerUnit,
    priceRange: currentRange.priceRange,
    finalPrice,
    profit: unitFixedProfit,
    realMarginPercent,
    quantity: safeQty,
  };
}
