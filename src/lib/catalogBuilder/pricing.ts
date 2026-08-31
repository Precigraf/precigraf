import { CatalogPriceRow, CatalogPricing } from './types';

export interface ComputedPriceRow {
  row: CatalogPriceRow;
  /** Nº de unidades detectado (campo `units` ou lido do texto da quantidade). */
  units: number | null;
  /** Preço normal por unidade (null quando não é possível derivar). */
  unitPrice: number | null;
  /** Preço atual por unidade. */
  unitCurrent: number | null;
  /** Valor total normal (sem promoção). */
  totalNormal: number | null;
  /** Valor total atual (com promoção quando existir). */
  totalCurrent: number | null;
  /** Economia em reais (nunca negativa). */
  savings: number;
  hasPromo: boolean;
  /** True quando é possível exibir a hierarquia baseada em valor total. */
  hasTotals: boolean;
}

const round2 = (n: number) => Math.round(n * 100) / 100;

/** Extrai o número de unidades de textos como "100 unidades", "1.000 un." ou "1000". */
export function parseUnits(quantity: string): number | null {
  const match = String(quantity ?? '').match(/[\d.,]+/);
  if (!match) return null;
  const raw = match[0].replace(/\.(?=\d{3}\b)/g, '').replace(',', '.');
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? n : null;
}

export function computePriceRow(row: CatalogPriceRow, pricing: CatalogPricing): ComputedPriceRow {
  const units =
    typeof row.units === 'number' && row.units > 0 ? row.units : parseUnits(row.quantity);

  const promoRaw =
    pricing.showDiscount && typeof row.promoPrice === 'number' && row.promoPrice > 0
      ? row.promoPrice
      : null;
  const hasPromo = promoRaw !== null && promoRaw < row.price;
  const current = hasPromo ? promoRaw! : row.price;

  let unitPrice: number | null;
  let unitCurrent: number | null;
  let totalNormal: number | null;
  let totalCurrent: number | null;

  if (pricing.type === 'total') {
    totalNormal = round2(row.price);
    totalCurrent = round2(current);
    unitPrice = units ? round2(row.price / units) : null;
    unitCurrent = units ? round2(current / units) : null;
  } else {
    unitPrice = round2(row.price);
    unitCurrent = round2(current);
    totalNormal = units ? round2(row.price * units) : null;
    totalCurrent = units ? round2(current * units) : null;
  }

  const savings =
    totalNormal !== null && totalCurrent !== null ? Math.max(0, round2(totalNormal - totalCurrent)) : 0;

  return {
    row,
    units,
    unitPrice,
    unitCurrent,
    totalNormal,
    totalCurrent,
    savings,
    hasPromo,
    hasTotals: totalCurrent !== null,
  };
}

export const BADGE_SUGGESTIONS = [
  'Para começar',
  'Estoque inicial',
  'Mais vendido',
  'Melhor custo-benefício',
  'Alto volume',
  'Menor preço/un.',
] as const;
