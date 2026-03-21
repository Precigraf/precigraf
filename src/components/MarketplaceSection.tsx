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
export type ShopeeAccountType = 'cnpj' | 'cpf_high' | 'cpf_low';

// ─── Tabela Shopee 2026 ───────────────────────────────────────────────────────

export interface ShopeeTier {
  label: string;
  maxPrice: number;
  commissionPct: number;
  fixedFee: number;
  pixSubsidy: number;
}

export const SHOPEE_TIERS: ShopeeTier[] = [
  { label: 'Até R$ 79,99',           maxPrice:  79.99, commissionPct: 20, fixedFee:  4, pixSubsidy: 0 },
  { label: 'R$ 80,00 – R$ 99,99',    maxPrice:  99.99, commissionPct: 14, fixedFee: 16, pixSubsidy: 5 },
  { label: 'R$ 100,00 – R$ 199,99',  maxPrice: 199.99, commissionPct: 14, fixedFee: 20, pixSubsidy: 5 },
  { label: 'R$ 200,00 – R$ 499,99',  maxPrice: 499.99, commissionPct: 14, fixedFee: 26, pixSubsidy: 5 },
  { label: 'Acima de R$ 500,00',     maxPrice: Infinity, commissionPct: 14, fixedFee: 26, pixSubsidy: 8 },
];

export const SHOPEE_CPF_HIGH_EXTRA = 3;

export const getShopeeTier = (unitPrice: number): ShopeeTier =>
  SHOPEE_TIERS.find(t => unitPrice <= t.maxPrice) ?? SHOPEE_TIERS[SHOPEE_TIERS.length - 1];

export const calcShopeeCost = (
  unitPrice: number,
  accountType: ShopeeAccountType
): { commission: number; fixedFee: number; cpfExtra: number; total: number; tier: ShopeeTier } => {
  const tier       = getShopeeTier(unitPrice);
  const commission = unitPrice * (tier.commissionPct / 100);
  const fixedFee   = tier.fixedFee;
  const cpfExtra   = accountType === 'cpf_high' ? SHOPEE_CPF_HIGH_EXTRA : 0;
  const total      = commission + fixedFee + cpfExtra;
  return { commission, fixedFee, cpfExtra, total, tier };
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
  marketplaceTotalFees: number;
  unitPrice: number;
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
  shopeeAccountType,
  onShopeeAccountTypeChange,
  commissionPercentage,
  onCommissionChange,
  fixedFeePerItem,
  onFixedFeeChange,
  profitValue,
  marketplaceTotalFees,
  unitPrice,
  lotQuantity,
  isPro = true,
  onShowUpgrade,
}) => {
  const isShopee  = marketplace === 'shopee';
  const isCustom  = marketplace === 'custom';
  const qty = Math.max(1, Math.floor(lotQuantity || 1));

  const shopeeCost = isShopee && unitPrice > 0
    ? calcShopeeCost(unitPrice, shopeeAccountType)
    : null;

  // Total fees for the whole lot
  const shopeeTotalFees = shopeeCost
    ? shopeeCost.commission * qty + shopeeCost.fixedFee + shopeeCost.cpfExtra
    : 0;

  const profitImpactPct = shopeeTotalFees > 0 && profitValue > 0
    ? Math.round((shopeeTotalFees / profitValue) * 1000) / 10
    : 0;

  const feesExceedProfit = isShopee && shopeeCost != null && profitValue > 0 && shopeeCost.total > profitValue;

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
              Shopee ·{' '}
              {shopeeAccountType === 'cnpj'
                ? 'CNPJ'
                : shopeeAccountType === 'cpf_high'
                ? 'CPF alto volume'
                : 'CPF baixo volume'}{' '}
              · {shopeeCost.tier.label}
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
            Taxas calculadas automaticamente a partir do preço final de venda
          </p>
        )}
      </div>

      {/* Shopee */}
      {isShopee && (
        <>
          {/* Tipo de conta */}
          <div className="space-y-3">
            <div>
              <p className="text-xs font-medium text-foreground">Tipo de conta</p>
              <p className="text-[11px] text-muted-foreground">(determina taxa adicional por item)</p>
            </div>

            <div className="space-y-2">
              {([
                { value: 'cnpj'    as const, name: 'CNPJ',               sub: 'Sem taxa adicional' },
                { value: 'cpf_high' as const, name: 'CPF — alto volume',  sub: '+450 pedidos/90 dias · +R$ 3,00/item' },
                { value: 'cpf_low'  as const, name: 'CPF — baixo volume', sub: 'Até 450 pedidos/90 dias · sem adicional' },
              ]).map(opt => {
                const active = shopeeAccountType === opt.value;
                return (
                  <label
                    key={opt.value}
                    className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                      active
                        ? 'border-primary/40 bg-primary/5'
                        : 'border-border hover:border-muted-foreground/30'
                    }`}
                  >
                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                      active ? 'border-primary' : 'border-muted-foreground/40'
                    }`}>
                      {active && <div className="w-2 h-2 rounded-full bg-primary" />}
                    </div>
                    <input
                      type="radio"
                      name="shopee-account"
                      checked={active}
                      onChange={() => onShopeeAccountTypeChange(opt.value)}
                      className="sr-only"
                    />
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium ${active ? 'text-foreground' : 'text-muted-foreground'}`}>
                        {opt.name}
                      </p>
                      <p className="text-[11px] text-muted-foreground">{opt.sub}</p>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Preço → faixa → breakdown */}
          {unitPrice > 0 && shopeeCost ? (
            <>
              <div className="bg-secondary/30 rounded-lg p-4 space-y-4">
                {/* Preço de venda → Faixa */}
                <div className="flex items-center gap-3">
                  <div className="flex-1 text-center">
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Preço final de venda</p>
                    <p className="text-sm font-semibold text-foreground">{fmt(unitPrice)}</p>
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

                {/* Linhas de custo */}
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      Comissão ({shopeeCost.tier.commissionPct}% × {fmt(unitPrice)})
                    </span>
                    <span className="font-medium text-foreground">{fmt(shopeeCost.commission)}</span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Taxa fixa</span>
                    <span className="font-medium text-foreground">{fmt(shopeeCost.fixedFee)}</span>
                  </div>

                  {shopeeCost.cpfExtra > 0 && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Taxa adicional CPF</span>
                      <span className="font-medium text-warning">
                        + {fmt(shopeeCost.cpfExtra)}
                      </span>
                    </div>
                  )}

                  <div className="border-t border-border my-1" />

                  <div className="flex justify-between font-semibold">
                    <span className="text-foreground">Custo Shopee / unidade</span>
                    <span className="text-destructive">
                      {fmt(shopeeCost.total)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Subsídio Pix */}
              {shopeeCost.tier.pixSubsidy > 0 && (
                <div className="flex items-start gap-2 text-[11px] text-muted-foreground">
                  <Info className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                  <span>
                    Subsídio Pix de{' '}
                    <strong>{shopeeCost.tier.pixSubsidy}%</strong> disponível nessa faixa —
                    desconto dado pela Shopee ao comprador. Não afeta seu recebimento.
                  </span>
                </div>
              )}

              {/* Impacto */}
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">Impacto no resultado</p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="text-center p-2.5 rounded-lg bg-secondary/30">
                    <p className="text-[10px] text-muted-foreground mb-1">Custo total Shopee</p>
                    <p className="text-sm font-semibold text-destructive">
                      -{fmt(shopeeCost.total)}
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
            /* Preço ainda não calculado */
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
