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
}

const roundCurrency = (value: number): number => {
  if (!Number.isFinite(value) || isNaN(value)) return 0;
  return Math.round(value * 100) / 100;
};

/**
 * Calcula as taxas da Shopee 2026 com base no preço unitário e tipo de vendedor.
 * As faixas de preço e taxas são imutáveis e automáticas.
 */
export function calculateShopee2026Fees(
  unitPrice: number,
  sellerType: SellerType
): Shopee2026FeeBreakdown {
  if (unitPrice <= 0) {
    return {
      commissionPercent: 0,
      commissionValue: 0,
      fixedFee: 0,
      cpfTax: 0,
      pixSubsidyPercent: 0,
      pixSubsidyValue: 0,
      totalFees: 0,
      priceRange: '-',
    };
  }

  let commissionPercent: number;
  let fixedFee: number;
  let pixSubsidyPercent: number;
  let priceRange: string;

  if (unitPrice <= 79.99) {
    commissionPercent = 20;
    fixedFee = 4;
    pixSubsidyPercent = 0;
    priceRange = 'Até R$ 79,99';
  } else if (unitPrice <= 99.99) {
    commissionPercent = 14;
    fixedFee = 16;
    pixSubsidyPercent = 5;
    priceRange = 'R$ 80,00 – R$ 99,99';
  } else if (unitPrice <= 199.99) {
    commissionPercent = 14;
    fixedFee = 20;
    pixSubsidyPercent = 5;
    priceRange = 'R$ 100,00 – R$ 199,99';
  } else if (unitPrice <= 499.99) {
    commissionPercent = 14;
    fixedFee = 26;
    pixSubsidyPercent = 5;
    priceRange = 'R$ 200,00 – R$ 499,99';
  } else {
    commissionPercent = 14;
    fixedFee = 26;
    pixSubsidyPercent = 8;
    priceRange = 'Acima de R$ 500,00';
  }

  const cpfTax = sellerType === 'cpf' ? 3 : 0;
  const commissionValue = roundCurrency(unitPrice * (commissionPercent / 100));
  const pixSubsidyValue = roundCurrency(unitPrice * (pixSubsidyPercent / 100));
  const totalFees = roundCurrency(commissionValue + fixedFee + cpfTax + pixSubsidyValue);

  return {
    commissionPercent,
    commissionValue,
    fixedFee,
    cpfTax,
    pixSubsidyPercent,
    pixSubsidyValue,
    totalFees,
    priceRange,
  };
}
