import React from 'react';
import { Store, AlertTriangle, Info } from 'lucide-react';
import FormSection from './FormSection';
import CurrencyInput from './CurrencyInput';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';

export type MarketplaceType =
  | 'none'
  | 'shopee_no_shipping'
  | 'shopee_free_shipping'
  | 'mercadolivre_free'
  | 'mercadolivre_classic'
  | 'mercadolivre_premium'
  | 'elo7';

interface MarketplaceConfig {
  label: string;
  commissionPercentage: number;
  fixedFeePerItem: number;
  isFixedFeeEditable: boolean;
}

export const MARKETPLACE_CONFIG: Record<MarketplaceType, MarketplaceConfig> = {
  none: {
    label: 'Nenhum (Venda Direta)',
    commissionPercentage: 0,
    fixedFeePerItem: 0,
    isFixedFeeEditable: false,
  },
  shopee_no_shipping: {
    label: 'Shopee (sem frete grátis)',
    commissionPercentage: 14,
    fixedFeePerItem: 4,
    isFixedFeeEditable: false,
  },
  shopee_free_shipping: {
    label: 'Shopee (com frete grátis)',
    commissionPercentage: 20,
    fixedFeePerItem: 4,
    isFixedFeeEditable: false,
  },
  mercadolivre_free: {
    label: 'Mercado Livre – Grátis',
    commissionPercentage: 0,
    fixedFeePerItem: 0,
    isFixedFeeEditable: false,
  },
  mercadolivre_classic: {
    label: 'Mercado Livre – Clássico',
    commissionPercentage: 12,
    fixedFeePerItem: 0,
    isFixedFeeEditable: true,
  },
  mercadolivre_premium: {
    label: 'Mercado Livre – Premium',
    commissionPercentage: 17,
    fixedFeePerItem: 0,
    isFixedFeeEditable: true,
  },
  elo7: {
    label: 'Elo7',
    commissionPercentage: 15,
    fixedFeePerItem: 0,
    isFixedFeeEditable: true,
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
}) => {
  const config = MARKETPLACE_CONFIG[marketplace];
  const showWarning = marketplace !== 'none';
  
  // Verificar se as taxas excedem o lucro (apenas quando há valores válidos)
  const feesExceedProfit = showWarning && 
    marketplaceTotalFees > 0 && 
    profitValue > 0 && 
    marketplaceTotalFees > profitValue;

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
      title="Mercado de Venda"
      icon={<Store className="w-5 h-5 text-primary" />}
    >
      <div className="col-span-full">
        <label className="text-sm font-medium text-secondary-foreground mb-2 block">
          Onde você vai vender?
        </label>
        <Select value={marketplace} onValueChange={handleMarketplaceChange}>
          <SelectTrigger className="input-currency">
            <SelectValue placeholder="Selecione o marketplace" />
          </SelectTrigger>
          <SelectContent className="bg-card border-border z-50">
            {Object.entries(MARKETPLACE_CONFIG).map(([key, cfg]) => (
              <SelectItem key={key} value={key}>
                {cfg.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {marketplace === 'none' && (
        <div className="col-span-full">
          <p className="text-xs text-muted-foreground flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5" />
            Marketplaces cobram comissão + taxas fixas por item vendido
          </p>
        </div>
      )}

      {showWarning && (
        <>
          <div className="col-span-full">
            <Alert className="bg-warning/10 border-warning/30">
              <Info className="w-4 h-4 text-warning" />
              <AlertDescription className="text-warning text-sm">
                Este marketplace cobra taxas sobre suas vendas
              </AlertDescription>
            </Alert>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-secondary-foreground">
              Comissão (%)
            </label>
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
            label="Taxa fixa por item"
            value={fixedFeePerItem}
            onChange={onFixedFeeChange}
            helperText={config.isFixedFeeEditable ? 'Valor configurável' : undefined}
          />

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
