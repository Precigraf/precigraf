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

export type MarketplaceType =
  | 'none'
  | 'shopee_no_shipping'
  | 'shopee_free_shipping'
  | 'custom';

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
  shopee_no_shipping: {
    label: 'Shopee (sem frete grátis)',
    commissionPercentage: 14,
    fixedFeePerItem: 4,
    isEditable: false,
    description: 'Taxa padrão da Shopee para vendas sem programa de frete grátis.',
  },
  shopee_free_shipping: {
    label: 'Shopee (com frete grátis)',
    commissionPercentage: 20,
    fixedFeePerItem: 4,
    isEditable: false,
    description: 'Inclui taxa adicional do programa de frete grátis.',
  },
  custom: {
    label: 'Outro (personalizar)',
    commissionPercentage: 0,
    fixedFeePerItem: 0,
    isEditable: true,
    description: 'Configure manualmente as taxas do seu canal de vendas.',
  },
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
}) => {
  const config = MARKETPLACE_CONFIG[marketplace];
  const showTaxFields = marketplace !== 'none';
  
  // Verificar se as taxas excedem o lucro (apenas quando há valores válidos)
  const feesExceedProfit = showTaxFields && 
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
        {/* Overlay de bloqueio */}
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

        {/* Conteúdo bloqueado (visível mas desativado) */}
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
    const newConfig = MARKETPLACE_CONFIG[value];
    onCommissionChange(newConfig.commissionPercentage);
    onFixedFeeChange(newConfig.fixedFeePerItem);
  };

  const handleCommissionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === '') {
      onCommissionChange(0);
      return;
    }
    const parsed = parseFloat(value);
    if (!isNaN(parsed)) {
      // Limitar entre 0 e 100
      onCommissionChange(Math.min(Math.max(0, parsed), 100));
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

      {showTaxFields && (
        <>
          {!config.isEditable && (
            <div className="col-span-full">
              <Alert className="bg-warning/10 border-warning/30">
                <Info className="w-4 h-4 text-warning" />
                <AlertDescription className="text-warning text-sm">
                  Taxas padrão do marketplace aplicadas automaticamente
                </AlertDescription>
              </Alert>
            </div>
          )}

          <div className="flex flex-col gap-2">
            <TooltipLabel 
              label="Comissão (%)"
              tooltip="Percentual cobrado pelo marketplace sobre cada venda. Varia de 0% a 20% dependendo do plano."
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
              tooltip="Valor fixo cobrado por transação, independente do valor da venda. Este valor é definido pelo marketplace e não pode ser alterado."
            />
            <Input
              type="text"
              value={`R$ ${fixedFeePerItem.toFixed(2).replace('.', ',')}`}
              className="input-currency bg-muted/50"
              disabled
              readOnly
            />
            <p className="text-xs text-muted-foreground">
              Taxa única por pedido (não pode ser alterada)
            </p>
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
