import React from 'react';
import { Store, AlertTriangle, Info, ShoppingBag, MessageCircle } from 'lucide-react';
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

export type MarketplaceType =
  | 'none'
  | 'direct_sale'
  | 'facebook_ads'
  | 'payment_link'
  | 'shopee_no_shipping'
  | 'shopee_free_shipping'
  | 'mercadolivre_free'
  | 'mercadolivre_classic'
  | 'mercadolivre_premium'
  | 'elo7'
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
  direct_sale: {
    label: 'Venda Direta (sem taxas)',
    commissionPercentage: 0,
    fixedFeePerItem: 0,
    isEditable: false,
    description: 'Venda presencial ou entrega direta, sem intermediários.',
  },
  facebook_ads: {
    label: 'Facebook Ads (Meta Ads)',
    commissionPercentage: 0,
    fixedFeePerItem: 0,
    isEditable: true,
    description: 'Vendas via anúncios do Facebook/Instagram. Adicione o custo de tráfego pago.',
  },
  payment_link: {
    label: 'Via Link de Pagamento',
    commissionPercentage: 3.5,
    fixedFeePerItem: 0,
    isEditable: true,
    description: 'PagSeguro, Mercado Pago, PicPay, etc. Taxa média de 3-5%.',
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
  mercadolivre_free: {
    label: 'Mercado Livre – Grátis',
    commissionPercentage: 0,
    fixedFeePerItem: 0,
    isEditable: false,
    description: 'Anúncio gratuito com exposição limitada.',
  },
  mercadolivre_classic: {
    label: 'Mercado Livre – Clássico',
    commissionPercentage: 12,
    fixedFeePerItem: 0,
    isEditable: true,
    description: 'Boa exposição com taxa de comissão moderada.',
  },
  mercadolivre_premium: {
    label: 'Mercado Livre – Premium',
    commissionPercentage: 17,
    fixedFeePerItem: 0,
    isEditable: true,
    description: 'Máxima exposição e benefícios exclusivos.',
  },
  elo7: {
    label: 'Elo7',
    commissionPercentage: 15,
    fixedFeePerItem: 0,
    isEditable: true,
    description: 'Marketplace especializado em produtos artesanais.',
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
  const showTaxFields = marketplace !== 'none' && marketplace !== 'direct_sale';
  
  // Verificar se as taxas excedem o lucro (apenas quando há valores válidos)
  const feesExceedProfit = showTaxFields && 
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

      {marketplace === 'direct_sale' && (
        <div className="col-span-full">
          <Alert className="bg-success/10 border-success/30">
            <ShoppingBag className="w-4 h-4 text-success" />
            <AlertDescription className="text-success text-sm">
              Sem taxas! Você fica com 100% do lucro.
            </AlertDescription>
          </Alert>
        </div>
      )}

      {marketplace === 'facebook_ads' && (
        <div className="col-span-full">
          <Alert className="bg-primary/5 border-primary/20">
            <MessageCircle className="w-4 h-4 text-primary" />
            <AlertDescription className="text-primary text-sm">
              Lembre-se de incluir o custo de tráfego pago no seu cálculo de lucro.
            </AlertDescription>
          </Alert>
        </div>
      )}

      {marketplace === 'payment_link' && (
        <div className="col-span-full">
          <Alert className="bg-primary/5 border-primary/20">
            <MessageCircle className="w-4 h-4 text-primary" />
            <AlertDescription className="text-primary text-sm">
              Taxas variam de 1.99% a 4.99% dependendo do gateway escolhido.
            </AlertDescription>
          </Alert>
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

          <CurrencyInput
            label="Taxa fixa por venda"
            value={fixedFeePerItem}
            onChange={onFixedFeeChange}
            helperText="Taxa única por pedido (não por unidade)"
            tooltip="Valor fixo cobrado por transação, independente do valor da venda."
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
