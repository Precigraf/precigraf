import React from 'react';
import { Calculator, Lock, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MarketplaceType, SellerType } from './MarketplaceSection';
import { calculateShopeeUnitPrice } from '@/lib/shopeeUtils';

interface QuantitySimulatorProps {
  unitRawMaterialsCost: number;
  operationalTotal: number;
  marginPercentage: number;
  fixedProfit: number;
  commissionPercentage: number;
  fixedFeePerItem: number;
  cpfTax: number;
  currentQuantity: number;
  hasMarketplace: boolean;
  isPro?: boolean;
  onShowUpgrade?: () => void;
  marketplace?: MarketplaceType;
  sellerType?: SellerType;
  usePixSubsidy?: boolean;
}

const QuantitySimulator: React.FC<QuantitySimulatorProps> = ({
  unitRawMaterialsCost,
  operationalTotal,
  marginPercentage,
  fixedProfit,
  commissionPercentage,
  fixedFeePerItem,
  cpfTax,
  currentQuantity,
  hasMarketplace,
  isPro = true,
  onShowUpgrade,
  marketplace = 'none',
  sellerType = 'cpf',
  usePixSubsidy = false,
}) => {
  const quantities = [15, 20, 40, 50, 80, 100];

  const formatCurrency = (value: number) => {
    if (!Number.isFinite(value) || isNaN(value)) return 'R$ 0,00';
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const calculateForQuantity = (qty: number) => {
    if (qty <= 0) return { unitPrice: 0, lotPrice: 0, margin: 0, totalCost: 0, totalFees: 0, totalProfit: 0 };

    const safeQty = Math.max(1, Math.floor(qty));
    const safeOperationalTotal = Math.max(0, operationalTotal || 0);
    const safeUnitRawMaterialsCost = Math.max(0, unitRawMaterialsCost || 0);
    const safeMarginPercentage = Math.min(Math.max(0, marginPercentage || 0), 1000);
    const safeFixedProfit = Math.max(0, fixedProfit || 0);

    const unitOperationalCost = safeOperationalTotal / safeQty;
    const unitProductionCost = safeUnitRawMaterialsCost + unitOperationalCost;

    const isFixedProfitMode = safeFixedProfit > 0;
    const unitDesiredProfit = isFixedProfitMode
      ? safeFixedProfit / safeQty
      : unitProductionCost * (safeMarginPercentage / 100);

    const unitBaseSellingPrice = unitProductionCost + unitDesiredProfit;

    let unitPrice: number;
    let totalFees: number;

    if (marketplace === 'shopee') {
      const shopee = calculateShopeeUnitPrice(unitBaseSellingPrice, sellerType === 'cpf', usePixSubsidy);
      unitPrice = shopee.unitPrice;
      totalFees = Math.round(shopee.totalFeesPerUnit * safeQty * 100) / 100;
    } else if (hasMarketplace) {
      // Custom marketplace - existing logic
      const safeCommissionPercentage = Math.min(Math.max(0, commissionPercentage || 0), 100);
      const safeFixedFeePerItem = Math.max(0, fixedFeePerItem || 0);
      const safeCpfTax = Math.max(0, cpfTax || 0);
      const unitFixedFees = (safeFixedFeePerItem + safeCpfTax) / safeQty;
      const commissionFraction = safeCommissionPercentage / 100;
      unitPrice = commissionFraction < 1
        ? (unitBaseSellingPrice + unitFixedFees) / (1 - commissionFraction)
        : unitBaseSellingPrice + unitFixedFees;
      const unitMarketplaceCommission = unitPrice * commissionFraction;
      totalFees = Math.round((unitMarketplaceCommission + unitFixedFees) * safeQty * 100) / 100;
    } else {
      unitPrice = unitBaseSellingPrice;
      totalFees = 0;
    }

    const lotPrice = Math.round(unitPrice * safeQty * 100) / 100;
    const totalCost = Math.round(unitProductionCost * safeQty * 100) / 100;
    const totalProfit = Math.round(unitDesiredProfit * safeQty * 100) / 100;

    return {
      unitPrice: Math.round(unitPrice * 100) / 100,
      lotPrice,
      margin: 0,
      totalCost,
      totalFees,
      totalProfit,
    };
  };

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
        className="relative overflow-hidden rounded-xl"
        onClick={handleUpgradeClick}
      >
        <div className="absolute inset-0 bg-background/70 backdrop-blur-[2px] z-10 flex flex-col items-center justify-center gap-2 cursor-pointer">
          <Lock className="w-5 h-5 text-muted-foreground" />
          <Badge variant="outline" className="text-xs bg-background/80">
            <Sparkles className="w-3 h-3 mr-1" />
            Desbloqueie no Plano Pro
          </Badge>
          <Button
            size="sm"
            onClick={handleUpgradeClick}
            className="mt-2 text-xs pointer-events-auto"
          >
            Fazer upgrade
          </Button>
        </div>

        <div className="opacity-70 pointer-events-none select-none filter grayscale bg-secondary/30 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-4">
            <Calculator className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-foreground">Simulador de Quantidade</span>
          </div>

          <div className="flex flex-col gap-2">
            {[15, 20, 40].map((qty) => (
              <div
                key={qty}
                className="bg-card rounded-lg p-3 border border-border flex items-center justify-between"
              >
                <span className="text-sm font-medium text-muted-foreground min-w-[50px]">
                  {qty} un
                </span>
                <span className="text-sm text-muted-foreground">
                  R$ ---
                </span>
              </div>
            ))}
          </div>

          <p className="text-xs text-muted-foreground text-center mt-3">
            Simule preços para diferentes quantidades
          </p>
        </div>
      </div>
    );
  }

  // Versão completa para usuários PRO
  return (
    <div className="bg-secondary/30 rounded-xl p-4">
      <div className="flex items-center gap-2 mb-4">
        <Calculator className="w-4 h-4 text-primary" />
        <span className="text-sm font-medium text-foreground">Simulador de Quantidade</span>
      </div>

      <div className="flex flex-col gap-2">
        {quantities.map((qty) => {
          const calc = calculateForQuantity(qty);

          return (
            <div
              key={qty}
              className="bg-card rounded-lg p-3 border border-border hover:border-primary/50 transition-colors"
            >
              {/* Linha principal */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-muted-foreground min-w-[50px]">
                    {qty} un
                  </span>
                  <span
                    className="font-bold text-foreground"
                    style={{ fontSize: 'clamp(14px, 3.5vw, 16px)' }}
                  >
                    {formatCurrency(calc.lotPrice)}
                  </span>
                </div>
                <span className="text-sm text-muted-foreground/80">
                  {formatCurrency(calc.unitPrice)}/un
                </span>
              </div>

              {/* Detalhamento */}
              <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 pt-2 border-t border-border/50 text-xs">
                <div className="flex items-center gap-1">
                  <span className="text-muted-foreground">Custos:</span>
                  <span className="font-medium text-foreground">{formatCurrency(calc.totalCost)}</span>
                </div>
                {(hasMarketplace || marketplace === 'shopee') && (
                  <div className="flex items-center gap-1">
                    <span className="text-warning">Taxas:</span>
                    <span className="font-medium text-warning">{formatCurrency(calc.totalFees)}</span>
                  </div>
                )}
                <div className="flex items-center gap-1">
                  <span className="text-success">Lucro:</span>
                  <span className="font-medium text-success">{formatCurrency(calc.totalProfit)}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <p className="text-xs text-muted-foreground text-center mt-3">
        Quanto maior a quantidade, menor o custo por unidade
      </p>
    </div>
  );
};

export default QuantitySimulator;
