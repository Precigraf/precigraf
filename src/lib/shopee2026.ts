// Motor de cálculo de taxas Shopee 2026 (CPF/CNPJ)

export type SellerType = 'cpf' | 'cnpj';

export interface Shopee2026FeeBreakdown {
  commissionPercent: number;
  commissionValue: number;
  fixedFee: number;
  cpfTax: number;
  pixSubsidyPercent: number;
  pixSubsidyValue: number;
  totalFees: number;
  priceRange: string;
  finalPrice: number;
  profit: number;
  realMarginPercent: number;
}

const roundCurrency = (value: number): number => {
  if (!Number.isFinite(value) || isNaN(value)) return 0;
  return Math.round(value * 100) / 100;
};

interface ShopeeRangeTiers {
  commissionPercent: number;
  fixedFee: number;
  pixSubsidyPercent: number;
  priceRange: string;
}

/**
 * Retorna a faixa de taxas da Shopee 2026 com base no preço final unitário.
 */
function getShopeeRange(unitFinalPrice: number): ShopeeRangeTiers {
  if (unitFinalPrice <= 79.99) {
    return { commissionPercent: 20, fixedFee: 4, pixSubsidyPercent: 0, priceRange: 'Até R$ 79,99' };
  } else if (unitFinalPrice <= 99.99) {
    return { commissionPercent: 14, fixedFee: 16, pixSubsidyPercent: 5, priceRange: 'R$ 80,00 – R$ 99,99' };
  } else if (unitFinalPrice <= 199.99) {
    return { commissionPercent: 14, fixedFee: 20, pixSubsidyPercent: 5, priceRange: 'R$ 100,00 – R$ 199,99' };
  } else if (unitFinalPrice <= 499.99) {
    return { commissionPercent: 14, fixedFee: 26, pixSubsidyPercent: 5, priceRange: 'R$ 200,00 – R$ 499,99' };
  } else {
    return { commissionPercent: 14, fixedFee: 26, pixSubsidyPercent: 8, priceRange: 'Acima de R$ 500,00' };
  }
}

/**
 * Calcula as taxas da Shopee 2026 com base no preço final unitário (já calculado).
 * Usado para exibição de breakdown quando o preço final já foi determinado.
 */
export function calculateShopee2026Fees(
  unitFinalPrice: number,
  sellerType: SellerType
): Shopee2026FeeBreakdown {
  if (unitFinalPrice <= 0) {
    return {
      commissionPercent: 0, commissionValue: 0, fixedFee: 0, cpfTax: 0,
      pixSubsidyPercent: 0, pixSubsidyValue: 0, totalFees: 0,
      priceRange: '-', finalPrice: 0, profit: 0, realMarginPercent: 0,
    };
  }

  const range = getShopeeRange(unitFinalPrice);
  const cpfTax = sellerType === 'cpf' ? 3 : 0;
  const commissionValue = roundCurrency(unitFinalPrice * (range.commissionPercent / 100));
  const pixSubsidyValue = roundCurrency(unitFinalPrice * (range.pixSubsidyPercent / 100));
  const totalFees = roundCurrency(commissionValue + range.fixedFee + cpfTax + pixSubsidyValue);

  return {
    commissionPercent: range.commissionPercent,
    commissionValue,
    fixedFee: range.fixedFee,
    cpfTax,
    pixSubsidyPercent: range.pixSubsidyPercent,
    pixSubsidyValue,
    totalFees,
    priceRange: range.priceRange,
    finalPrice: unitFinalPrice,
    profit: 0,
    realMarginPercent: 0,
  };
}

/**
 * Calcula o PREÇO FINAL unitário usando equação inversa para resolver a circularidade.
 * 
 * Preço Final = (Custo Unitário + Taxas Fixas) / (1 - Comissão% - Subsídio Pix% - Margem%)
 * 
 * Resolve iterativamente porque a faixa de taxas depende do preço final.
 * Máximo de 10 iterações para estabilizar.
 */
export function calculateShopee2026InversePrice(
  unitProductionCost: number,
  marginPercent: number,
  sellerType: SellerType
): Shopee2026FeeBreakdown {
  if (unitProductionCost <= 0) {
    return {
      commissionPercent: 0, commissionValue: 0, fixedFee: 0, cpfTax: 0,
      pixSubsidyPercent: 0, pixSubsidyValue: 0, totalFees: 0,
      priceRange: '-', finalPrice: 0, profit: 0, realMarginPercent: 0,
    };
  }

  const cpfTax = sellerType === 'cpf' ? 3 : 0;
  const marginDecimal = Math.min(Math.max(0, marginPercent), 999) / 100;

  // Chute inicial: começar com a faixa mais baixa
  let currentRange = getShopeeRange(unitProductionCost);
  let finalPrice = 0;

  // Iteração para estabilizar a faixa
  for (let i = 0; i < 10; i++) {
    const commDecimal = currentRange.commissionPercent / 100;
    const pixDecimal = currentRange.pixSubsidyPercent / 100;
    const denominator = 1 - commDecimal - pixDecimal - marginDecimal;

    if (denominator <= 0) {
      // Margem + taxas >= 100%, cálculo impossível
      // Retornar o melhor resultado possível com aviso
      finalPrice = roundCurrency(
        (unitProductionCost + currentRange.fixedFee + cpfTax) / 0.01
      );
      break;
    }

    finalPrice = roundCurrency(
      (unitProductionCost + currentRange.fixedFee + cpfTax) / denominator
    );

    // Verificar se a faixa mudou
    const newRange = getShopeeRange(finalPrice);
    if (
      newRange.commissionPercent === currentRange.commissionPercent &&
      newRange.fixedFee === currentRange.fixedFee &&
      newRange.pixSubsidyPercent === currentRange.pixSubsidyPercent
    ) {
      break; // Estabilizou
    }
    currentRange = newRange;
  }

  // Calcular valores finais com base no preço final determinado
  const commissionValue = roundCurrency(finalPrice * (currentRange.commissionPercent / 100));
  const pixSubsidyValue = roundCurrency(finalPrice * (currentRange.pixSubsidyPercent / 100));
  const totalFees = roundCurrency(commissionValue + currentRange.fixedFee + cpfTax + pixSubsidyValue);
  const profit = roundCurrency(finalPrice * marginDecimal);
  const realMarginPercent = finalPrice > 0 ? roundCurrency((profit / finalPrice) * 100) : 0;

  return {
    commissionPercent: currentRange.commissionPercent,
    commissionValue,
    fixedFee: currentRange.fixedFee,
    cpfTax,
    pixSubsidyPercent: currentRange.pixSubsidyPercent,
    pixSubsidyValue,
    totalFees,
    priceRange: currentRange.priceRange,
    finalPrice,
    profit,
    realMarginPercent,
  };
}

/**
 * Versão para lucro fixo (R$) em vez de margem percentual.
 * 
 * Preço Final = (Custo Unitário + Lucro Fixo Unitário + Taxas Fixas) / (1 - Comissão% - Subsídio Pix%)
 */
export function calculateShopee2026InversePriceFixedProfit(
  unitProductionCost: number,
  unitFixedProfit: number,
  sellerType: SellerType
): Shopee2026FeeBreakdown {
  if (unitProductionCost <= 0 && unitFixedProfit <= 0) {
    return {
      commissionPercent: 0, commissionValue: 0, fixedFee: 0, cpfTax: 0,
      pixSubsidyPercent: 0, pixSubsidyValue: 0, totalFees: 0,
      priceRange: '-', finalPrice: 0, profit: 0, realMarginPercent: 0,
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
        (unitProductionCost + unitFixedProfit + currentRange.fixedFee + cpfTax) / 0.01
      );
      break;
    }

    finalPrice = roundCurrency(
      (unitProductionCost + unitFixedProfit + currentRange.fixedFee + cpfTax) / denominator
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
  const totalFees = roundCurrency(commissionValue + currentRange.fixedFee + cpfTax + pixSubsidyValue);
  const realMarginPercent = finalPrice > 0 ? roundCurrency((unitFixedProfit / finalPrice) * 100) : 0;

  return {
    commissionPercent: currentRange.commissionPercent,
    commissionValue,
    fixedFee: currentRange.fixedFee,
    cpfTax,
    pixSubsidyPercent: currentRange.pixSubsidyPercent,
    pixSubsidyValue,
    totalFees,
    priceRange: currentRange.priceRange,
    finalPrice,
    profit: unitFixedProfit,
    realMarginPercent,
  };
}
