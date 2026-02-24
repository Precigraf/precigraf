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
import { SHOPEE_FEE_RULES } from '@/lib/shopeeUtils';

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
      // Shopee fees are now calculated dynamically by the solver
      // Set nominal values for UI display only (actual calculation uses shopeeUtils)
      onCommissionChange(14); // default display
      onFixedFeeChange(20);
      onCpfTaxChange(sellerType === 'cpf' ? 3 : 0);
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
      onCpfTaxChange(value === 'cpf' ? 3 : 0);
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
                Taxas da Shopee calculadas automaticamente por faixa de preço
              </AlertDescription>
            </Alert>
          </div>

          {/* Tabela de faixas */}
          <div className="col-span-full">
            <p className="text-xs font-medium text-muted-foreground mb-2">Faixas de comissão Shopee:</p>
            <div className="space-y-1 text-xs">
              {SHOPEE_FEE_RULES.map((rule, i) => (
                <div key={i} className="flex justify-between items-center py-1 px-2 rounded bg-secondary/30">
                  <span className="text-muted-foreground">
                    {rule.max === null
                      ? `≥ R$ ${rule.min.toFixed(2).replace('.', ',')}`
                      : `R$ ${rule.min.toFixed(2).replace('.', ',')} – ${rule.max.toFixed(2).replace('.', ',')}`}
                  </span>
                  <span className="font-medium text-foreground">
                    {Math.round(rule.percent * 100)}% + R$ {rule.fixed.toFixed(2).replace('.', ',')}
                  </span>
                </div>
              ))}
              {sellerType === 'cpf' && (
                <div className="flex justify-between items-center py-1 px-2 rounded bg-destructive/10">
                  <span className="text-muted-foreground">Taxa CPF adicional</span>
                  <span className="font-medium text-destructive">+ R$ 3,00/un</span>
                </div>
              )}
            </div>
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
