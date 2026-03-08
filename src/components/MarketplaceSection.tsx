import React from 'react';
import { Store, AlertTriangle, Info, Lock, Sparkles, User, Building2, Megaphone } from 'lucide-react';
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

export type MarketplaceType =
  | 'none'
  | 'shopee'
  | 'custom';

interface MarketplaceConfig {
  label: string;
  commissionPercentage: number;
  fixedFeePerItem: number;
  isEditable: boolean;
  description?: string;
  isShopee?: boolean;
}

export const MARKETPLACE_CONFIG: Record<MarketplaceType, MarketplaceConfig> = {
  none: {
    label: 'Selecione...',
    commissionPercentage: 0,
    fixedFeePerItem: 0,
    isEditable: false,
  },
  shopee: {
    label: 'Shopee (Taxas 2026)',
    commissionPercentage: 0,
    fixedFeePerItem: 0,
    isEditable: false,
    description: 'Taxas calculadas automaticamente por faixa de preço (solver iterativo).',
    isShopee: true,
  },
  custom: {
    label: 'Outro (personalizar)',
    commissionPercentage: 0,
    fixedFeePerItem: 0,
    isEditable: true,
    description: 'Configure manualmente as taxas do seu canal de vendas.',
  },
};

export type SellerType = 'cpf' | 'cnpj';

export interface ShopeeExtraFields {
  sellerType: SellerType;
  impostoVenda: number;
  adsFixo: number;
  roasAds: number;
}

export const DEFAULT_SHOPEE_EXTRA: ShopeeExtraFields = {
  sellerType: 'cnpj',
  impostoVenda: 0,
  adsFixo: 0,
  roasAds: 0,
};

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
  // Novos campos Shopee
  shopeeExtra?: ShopeeExtraFields;
  onShopeeExtraChange?: (fields: ShopeeExtraFields) => void;
}

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
  shopeeExtra = DEFAULT_SHOPEE_EXTRA,
  onShopeeExtraChange,
}) => {
  const config = MARKETPLACE_CONFIG[marketplace];
  const isShopee = config.isShopee === true;
  const showTaxFields = marketplace !== 'none' && !isShopee;
  
  // Verificar se as taxas excedem o lucro
  const feesExceedProfit = (showTaxFields || isShopee) && 
    marketplaceTotalFees > 0 && 
    profitValue > 0 && 
    marketplaceTotalFees > profitValue;

  const handleUpgradeClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onShowUpgrade) {
      onShowUpgrade();
    }
  };

  // Versão bloqueada para usuários FREE
  if (!isPro) {
    return (
      <div 
        className="relative overflow-hidden"
        onClick={handleUpgradeClick}
      >
        <div className="absolute inset-0 bg-background/70 backdrop-blur-[2px] z-10 flex flex-col items-center justify-center gap-2 cursor-pointer rounded-xl">
          <Lock className="w-5 h-5 text-muted-foreground" />
          <Badge variant="outline" className="text-xs bg-background/80">
            <Sparkles className="w-3 h-3 mr-1" />
            Recurso exclusivo do Plano Pro
          </Badge>
          <Button
            size="sm"
            onClick={handleUpgradeClick}
            className="mt-2 text-xs pointer-events-auto"
          >
            Fazer upgrade
          </Button>
        </div>

        <div className="opacity-40 pointer-events-none select-none filter grayscale">
          <FormSection
            title="Marketplace"
            icon={<Store className="w-5 h-5 text-primary" />}
          >
            <div className="col-span-full">
              <TooltipLabel 
                label="Onde você vai vender?"
                tooltip="Cada marketplace cobra taxas diferentes. Escolha o canal para calcular o lucro líquido real após as taxas."
              />
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
    if (value === 'shopee') {
      // Shopee: taxas são calculadas pelo solver, zerar campos manuais
      onCommissionChange(0);
      onFixedFeeChange(0);
    } else {
      const newConfig = MARKETPLACE_CONFIG[value];
      onCommissionChange(newConfig.commissionPercentage);
      onFixedFeeChange(newConfig.fixedFeePerItem);
    }
  };

  const handleCommissionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === '') {
      onCommissionChange(0);
      return;
    }
    const parsed = parseFloat(value);
    if (!isNaN(parsed)) {
      onCommissionChange(Math.min(Math.max(0, parsed), 100));
    }
  };

  const updateShopeeExtra = (updates: Partial<ShopeeExtraFields>) => {
    if (onShopeeExtraChange) {
      onShopeeExtraChange({ ...shopeeExtra, ...updates });
    }
  };

  return (
    <FormSection
      title="Marketplace"
      icon={<Store className="w-5 h-5 text-primary" />}
    >
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
            {Object.entries(MARKETPLACE_CONFIG).map(([key, cfg]) => (
              <SelectItem key={key} value={key}>
                <span className="flex items-center gap-2">
                  {cfg.label}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {config.description && marketplace !== 'none' && (
          <p className="text-xs text-muted-foreground mt-2">
            {config.description}
          </p>
        )}
      </div>

      {marketplace === 'none' && (
        <div className="col-span-full">
          <p className="text-xs text-muted-foreground flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5" />
            Marketplaces cobram comissão + taxas fixas por item vendido
          </p>
        </div>
      )}

      {/* Campos específicos da Shopee 2026 */}
      {isShopee && (
        <>
          {/* Tipo de vendedor: CPF ou CNPJ */}
          <div className="col-span-full">
            <TooltipLabel 
              label="Tipo de vendedor"
              tooltip="Vendedores CPF pagam uma taxa adicional fixa de R$ 3,00 por pedido."
            />
            <div className="flex gap-2 mt-2">
              <Button
                type="button"
                variant={shopeeExtra.sellerType === 'cnpj' ? 'default' : 'outline'}
                size="sm"
                onClick={() => updateShopeeExtra({ sellerType: 'cnpj' })}
                className="flex-1 gap-2"
              >
                <Building2 className="w-4 h-4" />
                CNPJ
              </Button>
              <Button
                type="button"
                variant={shopeeExtra.sellerType === 'cpf' ? 'default' : 'outline'}
                size="sm"
                onClick={() => updateShopeeExtra({ sellerType: 'cpf' })}
                className="flex-1 gap-2"
              >
                <User className="w-4 h-4" />
                CPF (+R$ 3,00)
              </Button>
            </div>
          </div>

          {/* Imposto sobre venda */}
          <div className="flex flex-col gap-2">
            <TooltipLabel 
              label="Imposto sobre venda (%)"
              tooltip="Percentual de imposto incidente sobre o preço de venda. Ex: Simples Nacional = 6%."
            />
            <Input
              type="number"
              value={shopeeExtra.impostoVenda || ''}
              onChange={(e) => {
                const v = e.target.value === '' ? 0 : parseFloat(e.target.value);
                if (!isNaN(v)) updateShopeeExtra({ impostoVenda: Math.min(Math.max(0, v), 99) });
              }}
              className="input-currency"
              min={0}
              max={99}
              step={0.1}
              placeholder="Ex: 6"
            />
          </div>

          {/* Investimento em Ads */}
          <div className="flex flex-col gap-2">
            <TooltipLabel 
              label="Investimento Ads (R$)"
              tooltip="Valor fixo investido em anúncios por produto. Ex: R$ 2,00 por produto vendido."
            />
            <Input
              type="number"
              value={shopeeExtra.adsFixo || ''}
              onChange={(e) => {
                const v = e.target.value === '' ? 0 : parseFloat(e.target.value);
                if (!isNaN(v)) updateShopeeExtra({ adsFixo: Math.max(0, v) });
              }}
              className="input-currency"
              min={0}
              step={0.5}
              placeholder="Ex: 2.00"
            />
          </div>

          {/* ROAS */}
          <div className="flex flex-col gap-2">
            <TooltipLabel 
              label="ROAS (Retorno sobre Ads)"
              tooltip="Return on Ad Spend. Ex: ROAS 5 significa que cada R$ 1 em ads gera R$ 5 em vendas (custo de 20%). Deixe 0 se não usar."
            />
            <Input
              type="number"
              value={shopeeExtra.roasAds || ''}
              onChange={(e) => {
                const v = e.target.value === '' ? 0 : parseFloat(e.target.value);
                if (!isNaN(v)) updateShopeeExtra({ roasAds: Math.max(0, v) });
              }}
              className="input-currency"
              min={0}
              step={0.1}
              placeholder="Ex: 5.0"
            />
            {shopeeExtra.roasAds > 0 && (
              <p className="text-xs text-muted-foreground">
                Custo de Ads: {Math.round((1 / shopeeExtra.roasAds) * 10000) / 100}% do preço de venda
              </p>
            )}
          </div>

          {/* Info sobre cálculo automático */}
          <div className="col-span-full">
            <Alert className="bg-primary/5 border-primary/20">
              <Info className="w-4 h-4 text-primary" />
              <AlertDescription className="text-sm text-muted-foreground">
                As taxas de comissão e tarifa fixa são calculadas automaticamente pelo solver iterativo com base na faixa de preço final do produto.
              </AlertDescription>
            </Alert>
          </div>
        </>
      )}

      {/* Campos manuais para marketplace custom */}
      {showTaxFields && (
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
              disabled={!config.isEditable && marketplace !== 'custom'}
            />
          </div>

          <div className="flex flex-col gap-2">
            <TooltipLabel 
              label="Taxa fixa por venda"
              tooltip="Valor fixo cobrado por transação."
            />
            <Input
              type="number"
              value={fixedFeePerItem}
              onChange={(e) => {
                const v = parseFloat(e.target.value);
                if (!isNaN(v)) onFixedFeeChange(Math.max(0, v));
              }}
              className="input-currency"
              min={0}
              step={0.5}
            />
          </div>
        </>
      )}

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
    </FormSection>
  );
};

export default MarketplaceSection;
