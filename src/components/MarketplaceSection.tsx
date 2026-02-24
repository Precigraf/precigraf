import React from 'react';
import { Store, AlertTriangle, Info, Lock, Sparkles } from 'lucide-react';
import FormSection from './FormSection';
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

export type MarketplaceType = 'none' | 'shopee' | 'custom';
export type SellerType = 'cpf' | 'cnpj';

interface MarketplaceSectionProps {
  marketplace: MarketplaceType;
  onMarketplaceChange: (value: MarketplaceType) => void;
  sellerType: SellerType;
  onSellerTypeChange: (value: SellerType) => void;
  commissionPercentage: number;
  onCommissionChange: (value: number) => void;
  fixedFeePerItem: number;
  onFixedFeeChange: (value: number) => void;
  cpfTax: number;
  onCpfTaxChange: (value: number) => void;
  profitValue: number;
  marketplaceTotalFees: number;
  activeTierLabel?: string;
  isPro?: boolean;
  onShowUpgrade?: () => void;
}

const SHOPEE_COMMISSION = 14;
const SHOPEE_FIXED_FEE = 20;
const SHOPEE_CPF_TAX = 3;

const MarketplaceSection: React.FC<MarketplaceSectionProps> = ({
  marketplace,
  onMarketplaceChange,
  sellerType,
  onSellerTypeChange,
  commissionPercentage,
  onCommissionChange,
  fixedFeePerItem,
  onFixedFeeChange,
  cpfTax,
  onCpfTaxChange,
  profitValue,
  marketplaceTotalFees,
  activeTierLabel = '',
  isPro = true,
  onShowUpgrade,
}) => {
  const showTaxFields = marketplace !== 'none';

  const feesExceedProfit = showTaxFields &&
    marketplaceTotalFees > 0 &&
    profitValue > 0 &&
    marketplaceTotalFees > profitValue;

  const handleUpgradeClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onShowUpgrade) onShowUpgrade();
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
    if (value === 'shopee') {
      onCommissionChange(SHOPEE_COMMISSION);
      onFixedFeeChange(SHOPEE_FIXED_FEE);
      onCpfTaxChange(sellerType === 'cpf' ? SHOPEE_CPF_TAX : 0);
    } else if (value === 'custom') {
      onCommissionChange(0);
      onFixedFeeChange(0);
      onCpfTaxChange(0);
    } else {
      onCommissionChange(0);
      onFixedFeeChange(0);
      onCpfTaxChange(0);
    }
  };

  const handleSellerTypeChange = (value: SellerType) => {
    onSellerTypeChange(value);
    if (marketplace === 'shopee') {
      onCpfTaxChange(value === 'cpf' ? SHOPEE_CPF_TAX : 0);
    }
  };

  const handleCommissionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === '') { onCommissionChange(0); return; }
    const parsed = parseFloat(value);
    if (!isNaN(parsed)) onCommissionChange(Math.min(Math.max(0, parsed), 100));
  };

  const isShopee = marketplace === 'shopee';
  const isCustom = marketplace === 'custom';

  return (
    <FormSection title="Marketplace" icon={<Store className="w-5 h-5 text-primary" />}>
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
            <SelectItem value="none">Selecione...</SelectItem>
            <SelectItem value="shopee">Shopee</SelectItem>
            <SelectItem value="custom">Outro (personalizar)</SelectItem>
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

      {isShopee && (
        <>
          {/* Seletor CPF / CNPJ */}
          <div className="col-span-full">
            <TooltipLabel
              label="Tipo de vendedor"
              tooltip="Vendedores CPF pagam uma taxa adicional de R$ 3,00 por pedido."
            />
            <Select value={sellerType} onValueChange={handleSellerTypeChange}>
              <SelectTrigger className="input-currency mt-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-card border-border z-50">
                <SelectItem value="cpf">CPF (Pessoa Física)</SelectItem>
                <SelectItem value="cnpj">CNPJ (Pessoa Jurídica)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="col-span-full">
            <Alert className="bg-warning/10 border-warning/30">
              <Info className="w-4 h-4 text-warning" />
              <AlertDescription className="text-warning text-sm">
                {activeTierLabel || 'Taxas padrão da Shopee aplicadas automaticamente'}
              </AlertDescription>
            </Alert>
          </div>

          {/* Info sobre taxas dinâmicas */}
          <div className="col-span-full text-xs text-muted-foreground space-y-1">
            <p className="font-medium">Taxas calculadas automaticamente por faixa de preço:</p>
            <ul className="list-disc list-inside space-y-0.5 text-[11px]">
              <li>Até R$ 79,99 → 20% + R$ 4,00</li>
              <li>R$ 80–99,99 → 14% + R$ 16,00 (Pix 5%)</li>
              <li>R$ 100–199,99 → 14% + R$ 20,00 (Pix 5%)</li>
              <li>R$ 200–499,99 → 14% + R$ 26,00 (Pix 5%)</li>
              <li>Acima de R$ 500 → 14% + R$ 26,00 (Pix 8%)</li>
              {sellerType === 'cpf' && <li className="text-warning">+ Taxa CPF: R$ 3,00 por pedido</li>}
            </ul>
          </div>
        </>
      )}

      {isCustom && (
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

          <div className="flex flex-col gap-2">
            <TooltipLabel label="Taxa fixa por venda" tooltip="Valor fixo cobrado por transação." />
            <Input
              type="text"
              value={`R$ ${fixedFeePerItem.toFixed(2).replace('.', ',')}`}
              className="input-currency bg-muted/50"
              disabled
              readOnly
            />
            <p className="text-xs text-muted-foreground">Taxa única por pedido (não pode ser alterada)</p>
          </div>
        </>
      )}

      {showTaxFields && feesExceedProfit && (
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
