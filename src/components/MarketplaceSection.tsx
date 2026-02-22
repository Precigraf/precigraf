import React from 'react';
import { Store, AlertTriangle, Info, Lock, Sparkles, Truck } from 'lucide-react';
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
import { Switch } from '@/components/ui/switch';
import {
  SHOPEE_TIERS_2026, getCommissionTier, calculateFreightSubsidy,
  CPF_ADDITIONAL_FEE,
} from '@/lib/shopeeUtils';

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
  usePixSubsidy: boolean;
  onPixSubsidyChange: (value: boolean) => void;
  currentUnitPrice: number;
  profitValue: number;
  marketplaceTotalFees: number;
  isPro?: boolean;
  onShowUpgrade?: () => void;
}

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
  usePixSubsidy,
  onPixSubsidyChange,
  currentUnitPrice,
  profitValue,
  marketplaceTotalFees,
  isPro = true,
  onShowUpgrade,
}) => {
  const showTaxFields = marketplace !== 'none';

  const feesExceedProfit = showTaxFields &&
    marketplaceTotalFees > 0 && profitValue > 0 && marketplaceTotalFees > profitValue;

  const isShopee = marketplace === 'shopee';
  const isCustom = marketplace === 'custom';

  // Compute current tier info for Shopee display (must be before any early returns)
  const currentTierInfo = React.useMemo(() => {
    if (!isShopee || currentUnitPrice <= 0) return null;
    const tier = getCommissionTier(currentUnitPrice);
    const pixRate = usePixSubsidy ? tier.pixRate : 0;
    const pixAmount = currentUnitPrice * pixRate;
    const commissionBase = currentUnitPrice - pixAmount;
    const commissionAmount = commissionBase * tier.commissionRate;
    const cpfFee = sellerType === 'cpf' ? CPF_ADDITIONAL_FEE : 0;
    const freightSubsidy = calculateFreightSubsidy(currentUnitPrice);
    return {
      tier,
      pixAmount: Math.round(pixAmount * 100) / 100,
      commissionAmount: Math.round(commissionAmount * 100) / 100,
      cpfFee,
      freightSubsidy,
      // Taxa fixa + CPF são por PEDIDO
      fixedFeesPerOrder: Math.round((tier.fixedFee + cpfFee) * 100) / 100,
      // Comissão é por unidade
      totalFeesPerUnit: Math.round(commissionAmount * 100) / 100,
    };
  }, [isShopee, currentUnitPrice, usePixSubsidy, sellerType]);

  const formatCurrency = (v: number) =>
    v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

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
    if (value !== 'shopee') {
      onPixSubsidyChange(false);
    }
    onCommissionChange(0);
    onFixedFeeChange(0);
    onCpfTaxChange(0);
  };

  const handleCommissionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === '') { onCommissionChange(0); return; }
    const parsed = parseFloat(value);
    if (!isNaN(parsed)) onCommissionChange(Math.min(Math.max(0, parsed), 100));
  };

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
            <SelectItem value="shopee">Shopee (2026)</SelectItem>
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
          {/* Tipo de Vendedor */}
          <div className="col-span-full">
            <TooltipLabel
              label="Tipo de vendedor"
              tooltip="Vendedores CPF pagam uma taxa adicional de R$ 3,00 por item vendido."
            />
            <Select value={sellerType} onValueChange={(v) => onSellerTypeChange(v as SellerType)}>
              <SelectTrigger className="input-currency mt-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-card border-border z-50">
                <SelectItem value="cpf">CPF (Pessoa Física)</SelectItem>
                <SelectItem value="cnpj">CNPJ (Pessoa Jurídica)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Toggle Subsídio Pix */}
          <div className="col-span-full">
            <div className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg">
              <div className="flex-1">
                <label className="text-sm font-medium text-foreground">Subsídio Pix</label>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Reduz a base de cálculo da comissão em 5% a 8%
                </p>
              </div>
              <Switch checked={usePixSubsidy} onCheckedChange={onPixSubsidyChange} />
            </div>
          </div>

          {/* Info da Faixa Atual */}
          {currentTierInfo && (
            <div className="col-span-full space-y-2">
              <Alert className="bg-warning/10 border-warning/30">
                <Info className="w-4 h-4 text-warning" />
                <AlertDescription className="text-sm space-y-1">
                  <p className="font-medium text-warning">
                    Faixa atual: {currentTierInfo.tier.label}
                  </p>
                  <div className="text-muted-foreground text-xs space-y-0.5">
                    <p>Comissão: {(currentTierInfo.tier.commissionRate * 100).toFixed(0)}% ({formatCurrency(currentTierInfo.commissionAmount)}/un)</p>
                    <p>Taxa fixa (por pedido): {formatCurrency(currentTierInfo.tier.fixedFee)}</p>
                    {sellerType === 'cpf' && (
                      <p>Taxa CPF (por pedido): +{formatCurrency(CPF_ADDITIONAL_FEE)}</p>
                    )}
                    {currentTierInfo.pixAmount > 0 && (
                      <p className="text-success">Subsídio Pix: -{formatCurrency(currentTierInfo.pixAmount)}/un</p>
                    )}
                    <p className="font-medium text-warning pt-1 border-t border-warning/20 mt-1">
                      Comissão/un: {formatCurrency(currentTierInfo.totalFeesPerUnit)} | Fixo/pedido: {formatCurrency(currentTierInfo.fixedFeesPerOrder)}
                    </p>
                  </div>
                </AlertDescription>
              </Alert>

              {/* Subsídio de Frete */}
              <div className="flex items-center gap-2 p-2 bg-success/10 rounded-lg">
                <Truck className="w-4 h-4 text-success flex-shrink-0" />
                <span className="text-xs text-success">
                  Subsídio de frete Shopee: até {formatCurrency(currentTierInfo.freightSubsidy)}
                </span>
              </div>
            </div>
          )}

          {/* Tabela de Faixas */}
          <div className="col-span-full">
            <details className="group">
              <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground transition-colors flex items-center gap-1">
                <Info className="w-3 h-3" />
                Ver tabela de taxas Shopee 2026
              </summary>
              <div className="mt-2 overflow-x-auto">
                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-1.5 px-2 text-muted-foreground font-medium">Faixa de Preço</th>
                      <th className="text-center py-1.5 px-2 text-muted-foreground font-medium">Comissão</th>
                      <th className="text-center py-1.5 px-2 text-muted-foreground font-medium">Taxa Fixa</th>
                      <th className="text-center py-1.5 px-2 text-muted-foreground font-medium">Pix</th>
                    </tr>
                  </thead>
                  <tbody>
                    {SHOPEE_TIERS_2026.map((tier, i) => {
                      const isCurrentTier = currentTierInfo && tier.label === currentTierInfo.tier.label;
                      return (
                        <tr
                          key={i}
                          className={`border-b border-border/50 ${isCurrentTier ? 'bg-primary/10 font-medium' : ''}`}
                        >
                          <td className="py-1.5 px-2 text-foreground">
                            {isCurrentTier && <span className="text-primary mr-1">●</span>}
                            {tier.label}
                          </td>
                          <td className="py-1.5 px-2 text-center text-foreground">{(tier.commissionRate * 100).toFixed(0)}%</td>
                          <td className="py-1.5 px-2 text-center text-foreground">
                            {formatCurrency(tier.fixedFee)}
                            {sellerType === 'cpf' && <span className="text-warning"> +R$ 3</span>}
                          </td>
                          <td className="py-1.5 px-2 text-center text-foreground">
                            {tier.pixRate > 0 ? `${(tier.pixRate * 100).toFixed(0)}%` : '—'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                <p className="text-xs text-muted-foreground mt-1.5">
                  Taxa fixa é cobrada por <strong>pedido</strong> (não por item)
                  {sellerType === 'cpf' && '. CPF: + R$ 3,00 por pedido em todas as faixas'}
                </p>
              </div>
            </details>
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
