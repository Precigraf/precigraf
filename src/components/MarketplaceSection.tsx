import React from 'react';
import { Store, AlertTriangle, Info, Lock, Sparkles, ShieldCheck } from 'lucide-react';
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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { SellerType, Shopee2026FeeBreakdown } from '@/lib/shopee2026';

export type MarketplaceType = 'none' | 'shopee_2026' | 'custom';

interface MarketplaceSectionProps {
  marketplace: MarketplaceType;
  onMarketplaceChange: (value: MarketplaceType) => void;
  commissionPercentage: number;
  onCommissionChange: (value: number) => void;
  fixedFeePerItem: number;
  onFixedFeeChange: (value: number) => void;
  profitValue: number;
  marketplaceTotalFees: number;
  isPro?: boolean;
  onShowUpgrade?: () => void;
  // Shopee 2026
  sellerType: SellerType;
  onSellerTypeChange: (type: SellerType) => void;
  shopee2026Fees: Shopee2026FeeBreakdown | null;
}

const MARKETPLACE_OPTIONS: Record<MarketplaceType, { label: string; description?: string }> = {
  none: { label: 'Nenhum (venda direta)' },
  shopee_2026: {
    label: 'Shopee 2026 (CPF/CNPJ)',
    description: 'Taxas atualizadas da Shopee 2026 calculadas automaticamente por faixa de preço.',
  },
  custom: {
    label: 'Outro (personalizar)',
    description: 'Configure manualmente as taxas do seu canal de vendas.',
  },
};

const formatBRL = (value: number) => {
  if (!Number.isFinite(value) || isNaN(value)) return 'R$ 0,00';
  const rounded = Math.round(value * 100) / 100;
  return rounded.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

const MarketplaceSection: React.FC<MarketplaceSectionProps> = ({
  marketplace,
  onMarketplaceChange,
  commissionPercentage,
  onCommissionChange,
  fixedFeePerItem,
  onFixedFeeChange,
  profitValue,
  marketplaceTotalFees,
  isPro = true,
  onShowUpgrade,
  sellerType,
  onSellerTypeChange,
  shopee2026Fees,
}) => {
  const feesExceedProfit =
    marketplace !== 'none' &&
    marketplaceTotalFees > 0 &&
    profitValue > 0 &&
    marketplaceTotalFees > profitValue;

  const handleUpgradeClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onShowUpgrade?.();
  };

  // Versão bloqueada para usuários FREE
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

  const handleMarketplaceChange = (value: MarketplaceType) => {
    onMarketplaceChange(value);
    if (value === 'custom') {
      onCommissionChange(0);
      onFixedFeeChange(0);
    } else {
      onCommissionChange(0);
      onFixedFeeChange(0);
    }
  };

  const handleCommissionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === '') { onCommissionChange(0); return; }
    const parsed = parseFloat(value);
    if (!isNaN(parsed)) onCommissionChange(Math.min(Math.max(0, parsed), 100));
  };

  return (
    <FormSection title="Marketplace" icon={<Store className="w-5 h-5 text-primary" />}>
      {/* Seletor de marketplace */}
      <div className="col-span-full">
        <TooltipLabel
          label="Onde você vai vender?"
          tooltip="Cada marketplace cobra taxas diferentes. Escolha o canal para calcular o lucro líquido real após as taxas."
        />
        <Select value={marketplace} onValueChange={handleMarketplaceChange}>
          <SelectTrigger className="input-currency mt-2">
            <SelectValue placeholder="Selecione o marketplace" />
          </SelectTrigger>
          <SelectContent className="bg-card border-border z-50">
            {Object.entries(MARKETPLACE_OPTIONS).map(([key, cfg]) => (
              <SelectItem key={key} value={key}>
                <span className="flex items-center gap-2">{cfg.label}</span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {MARKETPLACE_OPTIONS[marketplace]?.description && marketplace !== 'none' && (
          <p className="text-xs text-muted-foreground mt-2">
            {MARKETPLACE_OPTIONS[marketplace].description}
          </p>
        )}
      </div>

      {/* Info quando nenhum marketplace */}
      {marketplace === 'none' && (
        <div className="col-span-full">
          <p className="text-xs text-muted-foreground flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5" />
            Marketplaces cobram comissão + taxas fixas por item vendido
          </p>
        </div>
      )}

      {/* =================== SHOPEE 2026 =================== */}
      {marketplace === 'shopee_2026' && (
        <>
          {/* Tipo de Vendedor */}
          <div className="col-span-full">
            <TooltipLabel
              label="Tipo de vendedor"
              tooltip="CPF paga uma taxa adicional de R$ 3,00 por venda. CNPJ não paga essa taxa."
            />
            <RadioGroup
              value={sellerType}
              onValueChange={(v) => onSellerTypeChange(v as SellerType)}
              className="flex gap-6 mt-2"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="cpf" id="seller-cpf" />
                <Label htmlFor="seller-cpf" className="text-sm cursor-pointer">CPF</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="cnpj" id="seller-cnpj" />
                <Label htmlFor="seller-cnpj" className="text-sm cursor-pointer">CNPJ</Label>
              </div>
            </RadioGroup>
          </div>

          {/* Aviso de taxas automáticas */}
          <div className="col-span-full">
            <Alert className="bg-primary/5 border-primary/20">
              <ShieldCheck className="w-4 h-4 text-primary" />
              <AlertDescription className="text-primary text-sm">
                Taxas calculadas automaticamente conforme tabela oficial Shopee 2026
              </AlertDescription>
            </Alert>
          </div>

          {/* Breakdown de taxas */}
          {shopee2026Fees && shopee2026Fees.totalFees > 0 && (
            <div className="col-span-full">
              <div className="bg-secondary/50 rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Faixa detectada
                  </span>
                   <Badge variant="outline" className="text-xs">
                    {shopee2026Fees.priceRange} — Shopee 2026 {sellerType.toUpperCase()}
                  </Badge>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      Comissão ({shopee2026Fees.commissionPercent}%)
                    </span>
                    <span className="font-medium text-foreground">
                      {formatBRL(shopee2026Fees.commissionValue)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Taxa fixa (por pedido)</span>
                    <span className="font-medium text-foreground">
                      {formatBRL(shopee2026Fees.fixedFee)}
                    </span>
                  </div>
                  {shopee2026Fees.cpfTax > 0 && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Taxa vendedor CPF</span>
                      <span className="font-medium text-foreground">
                        {formatBRL(shopee2026Fees.cpfTax)}
                      </span>
                    </div>
                  )}
                  {shopee2026Fees.pixSubsidyPercent > 0 && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        Subsídio Pix ({shopee2026Fees.pixSubsidyPercent}%)
                      </span>
                      <span className="font-medium text-foreground">
                        {formatBRL(shopee2026Fees.pixSubsidyValue)}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between border-t border-border pt-2">
                    <span className="font-semibold text-foreground">Total Shopee / pedido</span>
                    <span className="font-bold text-warning">
                      {formatBRL(shopee2026Fees.totalFees)}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Por unidade</span>
                    <span className="text-muted-foreground">
                      {formatBRL(shopee2026Fees.totalFeesPerUnit)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Alerta de taxas excedendo lucro */}
          {feesExceedProfit && (
            <div className="col-span-full">
              <Alert className="bg-destructive/10 border-destructive/30">
                <AlertTriangle className="w-4 h-4 text-destructive" />
                <AlertDescription className="text-destructive text-sm font-medium">
                  ⚠️ Atenção: com as taxas da Shopee 2026, este produto gera prejuízo.
                </AlertDescription>
              </Alert>
            </div>
          )}

          {!feesExceedProfit && marketplaceTotalFees > 0 && profitValue > 0 && marketplaceTotalFees > profitValue * 0.5 && (
            <div className="col-span-full">
              <Alert className="bg-warning/10 border-warning/30">
                <AlertTriangle className="w-4 h-4 text-warning" />
                <AlertDescription className="text-warning text-sm">
                  ⚠️ Margem comprometida pelas taxas do marketplace.
                </AlertDescription>
              </Alert>
            </div>
          )}
        </>
      )}

      {/* =================== CUSTOM =================== */}
      {marketplace === 'custom' && (
        <>
          <div className="flex flex-col gap-2">
            <TooltipLabel
              label="Comissão (%)"
              tooltip="Percentual cobrado pelo marketplace sobre cada venda."
            />
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

          <div className="flex flex-col gap-2">
            <TooltipLabel
              label="Taxa fixa por venda"
              tooltip="Valor fixo cobrado por transação, independente do valor da venda."
            />
            <CurrencyInput
              label=""
              value={fixedFeePerItem}
              onChange={onFixedFeeChange}
            />
          </div>

          {feesExceedProfit && (
            <div className="col-span-full">
              <Alert className="bg-destructive/10 border-destructive/30">
                <AlertTriangle className="w-4 h-4 text-destructive" />
                <AlertDescription className="text-destructive text-sm font-medium">
                  ⚠️ Atenção: as taxas estão consumindo seu lucro!
                </AlertDescription>
              </Alert>
            </div>
          )}
        </>
      )}
    </FormSection>
  );
};

export default MarketplaceSection;
