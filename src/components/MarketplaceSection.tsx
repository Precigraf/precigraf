import React from 'react';
import { Store, AlertTriangle, Info, Lock, Sparkles, ShoppingCart } from 'lucide-react';
import FormSection from './FormSection';
import CurrencyInput from './CurrencyInput';
import TooltipLabel from './TooltipLabel';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

// ─── Tipos ────────────────────────────────────────────────────────────────────

export type MarketplaceType = 'none' | 'shopee' | 'custom';
/** @deprecated Mantido apenas para compatibilidade de tipo — não utilizado na lógica Shopee. */
export type ShopeeAccountType = 'cnpj' | 'cpf_high' | 'cpf_low';

// ─── Tabela Shopee 2026 (faixas de preço) ─────────────────────────────────────

export interface ShopeeTier {
  label: string;
  min: number;
  maxPrice: number;
  commissionPct: number;
  fixedFee: number;
}

export const SHOPEE_TIERS: ShopeeTier[] = [
  { label: 'Até R$ 79,99',          min: 0,   maxPrice:  79.99,   commissionPct: 20, fixedFee:  4 },
  { label: 'R$ 80 – R$ 99,99',      min: 80,  maxPrice:  99.99,   commissionPct: 14, fixedFee: 16 },
  { label: 'R$ 100 – R$ 199,99',    min: 100, maxPrice: 199.99,   commissionPct: 14, fixedFee: 20 },
  { label: 'R$ 200 – R$ 499,99',    min: 200, maxPrice: 499.99,   commissionPct: 14, fixedFee: 26 },
  { label: 'Acima de R$ 500',       min: 500, maxPrice: Infinity,  commissionPct: 14, fixedFee: 26 },
];

export const getShopeeTier = (price: number): ShopeeTier =>
  SHOPEE_TIERS.find(t => price >= t.min && price <= t.maxPrice) ?? SHOPEE_TIERS[0];

/**
 * Solver Shopee 2026 (iterativo).
 *
 * Dado o custo base (custo de produção + lucro desejado), calcula o preço final
 * de venda embutindo comissão e taxa fixa.
 *
 *   finalPrice = (baseCost + fixedFee) / (1 − commissionRate)
 *
 * A faixa é determinada pelo preço final estimado (não pelo baseCost),
 * com até 3 iterações para convergir quando o preço cruza faixas.
 *
 * @param baseCost  Custo que o vendedor precisa cobrir (produção + lucro desejado)
 * @param _accountType  (ignorado — mantido para compatibilidade de assinatura)
 */
export const calcShopeeCost = (
  baseCost: number,
  _accountType?: ShopeeAccountType,
): {
  finalPrice: number;
  commission: number;
  fixedFee: number;
  cpfExtra: number;
  total: number;
  tier: ShopeeTier;
} => {
  // Estimativa inicial: usar baseCost para encontrar a primeira faixa
  let tier = getShopeeTier(baseCost);
  let finalPrice = 0;

  // Iterar até a faixa convergir (máx 3 iterações)
  for (let i = 0; i < 3; i++) {
    const commissionRate = tier.commissionPct / 100;
    finalPrice = (baseCost + tier.fixedFee) / (1 - commissionRate);
    const newTier = getShopeeTier(finalPrice);
    if (newTier.min === tier.min) break; // convergiu
    tier = newTier;
  }

  const commissionRate = tier.commissionPct / 100;
  const commission = finalPrice * commissionRate;

  return {
    finalPrice,
    commission,
    fixedFee: tier.fixedFee,
    cpfExtra: 0,
    total: commission + tier.fixedFee,
    tier,
  };
};

// ─── Config marketplace (compatibilidade) ────────────────────────────────────

interface MarketplaceConfig {
  label: string;
  commissionPercentage: number;
  fixedFeePerItem: number;
  isEditable: boolean;
  description?: string;
}

export const MARKETPLACE_CONFIG: Record<MarketplaceType, MarketplaceConfig> = {
  none:   { label: 'Selecione...', commissionPercentage: 0, fixedFeePerItem: 0, isEditable: false },
  shopee: { label: 'Shopee',       commissionPercentage: 0, fixedFeePerItem: 0, isEditable: false,
            description: 'Taxas calculadas automaticamente com base no preço final de venda.' },
  custom: { label: 'Outro (personalizar)', commissionPercentage: 0, fixedFeePerItem: 0, isEditable: true },
};

// ─── Props ────────────────────────────────────────────────────────────────────

interface MarketplaceSectionProps {
  marketplace: MarketplaceType;
  onMarketplaceChange: (value: MarketplaceType) => void;
  shopeeAccountType: ShopeeAccountType;
  onShopeeAccountTypeChange: (value: ShopeeAccountType) => void;
  commissionPercentage: number;
  onCommissionChange: (value: number) => void;
  fixedFeePerItem: number;
  onFixedFeeChange: (value: number) => void;
  profitValue: number;
  unitBasePrice: number;
  lotQuantity: number;
  isPro?: boolean;
  onShowUpgrade?: () => void;
}

const fmt = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

// ─── Componente ───────────────────────────────────────────────────────────────

const MarketplaceSection: React.FC<MarketplaceSectionProps> = ({
  marketplace,
  onMarketplaceChange,
  commissionPercentage,
  onCommissionChange,
  fixedFeePerItem,
  onFixedFeeChange,
  profitValue,
  _marketplaceTotalFees,
  unitBasePrice,
  lotQuantity,
  isPro = true,
  onShowUpgrade,
}) => {
  const isShopee = marketplace === 'shopee';
  const isCustom = marketplace === 'custom';
  const qty = Math.max(1, Math.floor(lotQuantity || 1));

  // Solver: usa o preço base (custo + lucro, SEM taxas) para calcular
  const shopeeCost = isShopee && unitBasePrice > 0
    ? calcShopeeCost(unitBasePrice)
    : null;

  // Total de taxas para o lote inteiro
  const shopeeTotalFees = shopeeCost
    ? (shopeeCost.commission + shopeeCost.fixedFee) * qty
    : 0;

  const profitImpactPct = shopeeTotalFees > 0 && profitValue > 0
    ? parseFloat(((shopeeTotalFees / profitValue) * 100).toFixed(1))
    : 0;

  const feesExceedProfit = isShopee && shopeeTotalFees > 0 && profitValue > 0 && shopeeTotalFees > profitValue;

  const handleUpgradeClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onShowUpgrade?.();
  };

  const handleMarketplaceChange = (value: MarketplaceType) => {
    onMarketplaceChange(value);
    if (value !== 'custom') { onCommissionChange(0); onFixedFeeChange(0); }
  };

  const handleCommissionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const parsed = parseFloat(e.target.value);
    onCommissionChange(!isNaN(parsed) ? Math.min(Math.max(0, parsed), 100) : 0);
  };

  // ── Plano Free ───────────────────────────────────────────────────────────────
  if (!isPro) {
    return (
      <div className="relative overflow-hidden" onClick={handleUpgradeClick}>
        <div className="absolute inset-0 bg-background/70 backdrop-blur-[2px] z-10 flex flex-col items-center justify-center gap-2 cursor-pointer rounded-xl">
          <Lock className="w-5 h-5 text-muted-foreground" />
          <Badge variant="outline" className="text-xs bg-background/80">
            <Sparkles className="w-3 h-3 mr-1" />
            Recurso exclusivo do Plano Pro
          </Badge>
          <Button size="sm" onClick={handleUpgradeClick} className="mt-2 text-xs pointer-events-auto">
            Fazer upgrade
          </Button>
        </div>
        <div className="opacity-40 pointer-events-none select-none filter grayscale">
          <FormSection title="Marketplace" icon={<Store className="w-5 h-5 text-primary" />}>
            <div className="col-span-full">
              <TooltipLabel label="Onde você vai vender?" tooltip="Cada marketplace cobra taxas diferentes." />
              <Select value="none" disabled>
                <SelectTrigger className="input-currency mt-2">
                  <SelectValue placeholder="Selecione o marketplace" />
                </SelectTrigger>
              </Select>
            </div>
          </FormSection>
        </div>
      </div>
    );
  }

  // ── Versão completa ───────────────────────────────────────────────────────────
  return (
    <div className="rounded-xl border border-border bg-card p-5 space-y-5">

      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="rounded-lg bg-primary/10 p-2">
          <ShoppingCart className="w-5 h-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-foreground">Marketplace</h3>
          {isShopee && shopeeCost ? (
            <p className="text-xs text-muted-foreground truncate mt-0.5">
              Shopee · {shopeeCost.tier.label}
            </p>
          ) : (
            <p className="text-xs text-muted-foreground mt-0.5">Configure o canal de venda</p>
          )}
        </div>
        {isShopee && (
          <Badge variant="default" className="text-[10px] px-2 py-0.5 bg-primary/15 text-primary border-0">
            Ativo
          </Badge>
        )}
      </div>

      {/* Canal */}
      <div className="space-y-2">
        <p className="text-xs font-medium text-muted-foreground">Canal de venda</p>
        <Select value={marketplace} onValueChange={(v) => handleMarketplaceChange(v as MarketplaceType)}>
          <SelectTrigger className="input-currency">
            <SelectValue placeholder="Selecione o marketplace" />
          </SelectTrigger>
          <SelectContent className="bg-card border-border z-50">
            <SelectItem value="none">Selecione...</SelectItem>
            <SelectItem value="shopee">Shopee</SelectItem>
            <SelectItem value="custom">Outro (personalizar)</SelectItem>
          </SelectContent>
        </Select>
        {isShopee && (
          <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <Info className="w-3 h-3 flex-shrink-0" />
            Taxas calculadas automaticamente (solver) a partir do preço base
          </p>
        )}
      </div>

      {/* Shopee breakdown */}
      {isShopee && (
        <>
          {unitBasePrice > 0 && shopeeCost ? (
            <>
              <div className="bg-secondary/30 rounded-lg p-4 space-y-4">
                {/* Preço base → Faixa */}
                <div className="flex items-center gap-3">
                  <div className="flex-1 text-center">
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Preço base</p>
                    <p className="text-sm font-semibold text-foreground">{fmt(unitBasePrice)}</p>
                  </div>
                  <div className="text-muted-foreground/40">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M6 3l5 5-5 5" />
                    </svg>
                  </div>
                  <div className="flex-1 text-center">
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Faixa identificada</p>
                    <p className="text-sm font-semibold text-primary">{shopeeCost.tier.label}</p>
                  </div>
                </div>

                {/* Linhas de custo — valores totais para o lote */}
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      Comissão ({shopeeCost.tier.commissionPct}% × {fmt(shopeeCost.finalPrice)} × {qty} un)
                    </span>
                    <span className="font-medium text-foreground">{fmt(shopeeCost.commission * qty)}</span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Taxa fixa ({fmt(shopeeCost.fixedFee)}/un × {qty} un)</span>
                    <span className="font-medium text-foreground">{fmt(shopeeCost.fixedFee * qty)}</span>
                  </div>

                  <div className="border-t border-border my-1" />

                  <div className="flex justify-between font-semibold">
                    <span className="text-foreground">Total de taxas Shopee</span>
                    <span className="text-destructive">
                      {fmt(shopeeTotalFees)}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Preço final de venda (solver)</span>
                    <span className="font-semibold text-primary">{fmt(shopeeCost.finalPrice)}/un</span>
                  </div>
                </div>
              </div>

              {/* Impacto */}
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">Impacto no resultado</p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="text-center p-2.5 rounded-lg bg-secondary/30">
                    <p className="text-[10px] text-muted-foreground mb-1">Custo total Shopee</p>
                    <p className="text-sm font-semibold text-destructive">
                      -{fmt(shopeeTotalFees)}
                    </p>
                  </div>
                  <div className="text-center p-2.5 rounded-lg bg-secondary/30">
                    <p className="text-[10px] text-muted-foreground mb-1">Taxas vs lucro</p>
                    <p className={`text-sm font-semibold ${
                      profitImpactPct > 80 ? 'text-destructive' :
                      profitImpactPct > 50 ? 'text-amber-600 dark:text-amber-400' :
                      'text-green-600 dark:text-green-400'
                    }`}>
                      {profitImpactPct}%
                    </p>
                  </div>
                </div>
              </div>

              {/* Alerta quando taxas consomem lucro */}
              {feesExceedProfit && (
                <div className="flex items-start gap-3 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                  <AlertTriangle className="w-4 h-4 text-destructive mt-0.5 flex-shrink-0" />
                  <div className="space-y-0.5">
                    <p className="text-sm font-medium text-destructive">
                      Taxas consomem {profitImpactPct}% do lucro
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Considere aumentar a margem de lucro para compensar o custo do marketplace.
                    </p>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="rounded-lg border border-dashed border-border p-4">
              <div className="flex items-start gap-3">
                <Info className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">
                    Aguardando o preço de venda
                  </p>
                  <p className="text-xs text-muted-foreground/70">
                    Preencha os custos e a margem de lucro. A faixa de taxas da Shopee será
                    identificada automaticamente com base no preço final calculado.
                  </p>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Custom */}
      {isCustom && (
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-2">
            <TooltipLabel label="Comissão (%)" tooltip="Percentual cobrado pelo marketplace sobre cada venda." />
            <Input
              type="number"
              value={commissionPercentage}
              onChange={handleCommissionChange}
              className="input-currency"
              min={0}
              max={100}
              step={0.1}
            />
          </div>
          <CurrencyInput
            label="Taxa fixa por venda"
            value={fixedFeePerItem}
            onChange={onFixedFeeChange}
            tooltip="Valor fixo cobrado por transação, independente do valor da venda."
          />
        </div>
      )}

      {/* Nenhum */}
      {marketplace === 'none' && (
        <div className="rounded-lg border border-dashed border-border p-3">
          <p className="flex items-center gap-2 text-xs text-muted-foreground">
            <Info className="w-3.5 h-3.5 flex-shrink-0" />
            Marketplaces cobram comissão + taxas fixas por item vendido
          </p>
        </div>
      )}
    </div>
  );
};

export default MarketplaceSection;
