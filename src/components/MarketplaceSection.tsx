import React from 'react';
import { Store, AlertTriangle, Info, Lock, Sparkles } from 'lucide-react';
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
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

// ─── Tipos ────────────────────────────────────────────────────────────────────

export type MarketplaceType = 'none' | 'shopee' | 'custom';
export type ShopeeAccountType = 'cnpj' | 'cpf_high' | 'cpf_low';

// ─── Tabela de faixas Shopee 2026 ─────────────────────────────────────────────

interface ShopeeTier {
  label: string;
  maxPrice: number;
  commissionPct: number;
  fixedFee: number;
  pixSubsidy: number;
}

export const SHOPEE_TIERS: ShopeeTier[] = [
  { label: 'Até R$ 79,99',          maxPrice:  79.99, commissionPct: 20, fixedFee:  4, pixSubsidy: 0 },
  { label: 'R$ 80,00 – R$ 99,99',   maxPrice:  99.99, commissionPct: 14, fixedFee: 16, pixSubsidy: 5 },
  { label: 'R$ 100,00 – R$ 199,99', maxPrice: 199.99, commissionPct: 14, fixedFee: 20, pixSubsidy: 5 },
  { label: 'R$ 200,00 – R$ 499,99', maxPrice: 499.99, commissionPct: 14, fixedFee: 26, pixSubsidy: 5 },
  { label: 'Acima de R$ 500,00',     maxPrice: Infinity, commissionPct: 14, fixedFee: 26, pixSubsidy: 8 },
];

export const SHOPEE_CPF_HIGH_EXTRA = 3;

export const getShopeeTier = (unitPrice: number): ShopeeTier => {
  return SHOPEE_TIERS.find(t => unitPrice <= t.maxPrice) ?? SHOPEE_TIERS[SHOPEE_TIERS.length - 1];
};

export const calcShopeeCost = (
  unitPrice: number,
  accountType: ShopeeAccountType
): { commission: number; fixedFee: number; cpfExtra: number; total: number; tier: ShopeeTier } => {
  const tier = getShopeeTier(unitPrice);
  const commission  = unitPrice * (tier.commissionPct / 100);
  const fixedFee    = tier.fixedFee;
  const cpfExtra    = accountType === 'cpf_high' ? SHOPEE_CPF_HIGH_EXTRA : 0;
  const total       = commission + fixedFee + cpfExtra;
  return { commission, fixedFee, cpfExtra, total, tier };
};

// Configuração geral de marketplaces (para compatibilidade)
interface MarketplaceConfig {
  label: string;
  commissionPercentage: number;
  fixedFeePerItem: number;
  isEditable: boolean;
  description?: string;
}

export const MARKETPLACE_CONFIG: Record<MarketplaceType, MarketplaceConfig> = {
  none: {
    label: 'Selecione...',
    commissionPercentage: 0,
    fixedFeePerItem: 0,
    isEditable: false,
  },
  shopee: {
    label: 'Shopee',
    commissionPercentage: 0,
    fixedFeePerItem: 0,
    isEditable: false,
    description: 'Taxas calculadas automaticamente pela faixa de preço do produto (tabela 2026).',
  },
  custom: {
    label: 'Outro (personalizar)',
    commissionPercentage: 0,
    fixedFeePerItem: 0,
    isEditable: true,
    description: 'Configure manualmente as taxas do seu canal de vendas.',
  },
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
  const config = MARKETPLACE_CONFIG[marketplace];
  const showTaxFields = marketplace !== 'none';
  const isShopee = marketplace === 'shopee';

  const qty = Math.max(1, Math.floor(lotQuantity || 1));
  const shopeeCost = isShopee && unitPrice > 0
    ? calcShopeeCost(unitPrice, shopeeAccountType)
    : null;

  const feesExceedProfit =
    showTaxFields && marketplaceTotalFees > 0 && profitValue > 0 && marketplaceTotalFees > profitValue;

  const formatCurrency = (v: number) =>
    v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const handleUpgradeClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onShowUpgrade?.();
  };

  const handleMarketplaceChange = (value: MarketplaceType) => {
    onMarketplaceChange(value);
    if (value !== 'custom') {
      onCommissionChange(0);
      onFixedFeeChange(0);
    }
  };

  const handleCommissionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const parsed = parseFloat(e.target.value);
    if (!isNaN(parsed)) onCommissionChange(Math.min(Math.max(0, parsed), 100));
    else onCommissionChange(0);
  };

  // ── Versão bloqueada (free) ──────────────────────────────────────────────────
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
            <div className="col-span-full">
              <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5" />
                Calcule taxas de Shopee e outros marketplaces
              </p>
            </div>
          </FormSection>
        </div>
      </div>
    );
  }

  // ── Versão completa ───────────────────────────────────────────────────────────
  return (
    <FormSection title="Marketplace" icon={<Store className="w-5 h-5 text-primary" />}>
      {/* Seleção do canal */}
      <div className="col-span-full">
        <TooltipLabel
          label="Onde você vai vender?"
          tooltip="Cada marketplace cobra taxas diferentes. Escolha o canal para calcular o lucro líquido real após as taxas."
        />
        <Select value={marketplace} onValueChange={(v) => handleMarketplaceChange(v as MarketplaceType)}>
          <SelectTrigger className="input-currency mt-2">
            <SelectValue placeholder="Selecione o marketplace" />
          </SelectTrigger>
          <SelectContent className="bg-card border-border z-50">
            <SelectItem value="none">Selecione...</SelectItem>
            <SelectItem value="shopee">Shopee</SelectItem>
            <SelectItem value="custom">Outro (personalizar)</SelectItem>
          </SelectContent>
        </Select>
        {config.description && marketplace !== 'none' && (
          <p className="text-xs text-muted-foreground mt-2">{config.description}</p>
        )}
      </div>

      {/* Shopee: tipo de conta + breakdown por faixa */}
      {isShopee && (
        <>
          <div className="col-span-full">
            <TooltipLabel label="Tipo de conta" tooltip="CPF com mais de 450 pedidos nos últimos 90 dias paga R$ 3,00 a mais por pedido." />
            <div className="flex flex-col gap-2 mt-2">
              {([
                { value: 'cnpj' as const, label: 'CNPJ' },
                { value: 'cpf_high' as const, label: 'CPF (+450 pedidos/90 dias)' },
                { value: 'cpf_low' as const, label: 'CPF (até 450 pedidos/90 dias)' },
              ]).map(opt => (
                <label key={opt.value} className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="radio"
                    name="shopee-account"
                    checked={shopeeAccountType === opt.value}
                    onChange={() => onShopeeAccountTypeChange(opt.value)}
                    className="accent-primary"
                  />
                  {opt.label}
                </label>
              ))}
            </div>
          </div>

          {/* Breakdown das taxas */}
          {shopeeCost && unitPrice > 0 && (
            <div className="col-span-full bg-secondary/30 rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Faixa detectada</span>
                <Badge variant="outline" className="text-xs">
                  {shopeeCost.tier.label}
                </Badge>
              </div>

              <Separator />

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    Comissão ({shopeeCost.tier.commissionPct}% × {formatCurrency(unitPrice)} × {qty} un)
                  </span>
                  <span className="font-medium">{formatCurrency(shopeeCost.commission * qty)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Taxa fixa ({formatCurrency(shopeeCost.fixedFee)}/pedido)</span>
                  <span className="font-medium">{formatCurrency(shopeeCost.fixedFee)}</span>
                </div>
                {shopeeCost.cpfExtra > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Taxa adicional CPF</span>
                    <span className="font-medium text-warning">+ {formatCurrency(shopeeCost.cpfExtra)}</span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between font-semibold">
                  <span>Total de taxas Shopee</span>
                  <span>{formatCurrency(shopeeCost.commission * qty + shopeeCost.fixedFee + shopeeCost.cpfExtra)}</span>
                </div>
              </div>

              {shopeeCost.tier.pixSubsidy > 0 && (
                <div className="flex items-start gap-2 text-xs text-muted-foreground mt-2">
                  <Info className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                  <span>
                    Subsídio Pix de {shopeeCost.tier.pixSubsidy}% disponível nessa faixa — desconto dado pela Shopee ao comprador. Não afeta seu recebimento.
                  </span>
                </div>
              )}
            </div>
          )}

          {unitPrice <= 0 && (
            <div className="col-span-full">
              <Alert className="bg-muted/50 border-muted-foreground/20">
                <Info className="w-4 h-4" />
                <AlertDescription className="text-sm">
                  Preencha os custos e margem para calcular as taxas da faixa correta.
                </AlertDescription>
              </Alert>
            </div>
          )}
        </>
      )}

      {/* Marketplace personalizado */}
      {marketplace === 'custom' && (
        <>
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
        </>
      )}

      {/* Alerta: taxas excedem lucro */}
      {feesExceedProfit && (
        <div className="col-span-full">
          <Alert className="bg-destructive/10 border-destructive/30">
            <AlertTriangle className="w-4 h-4 text-destructive" />
            <AlertDescription className="text-destructive text-sm font-medium">
              As taxas estão consumindo seu lucro. Considere aumentar a margem.
            </AlertDescription>
          </Alert>
        </div>
      )}
    </FormSection>
  );
};

export default MarketplaceSection;
