import React from 'react';
import { Calculator, Lock, Sparkles, TrendingUp, Store, DollarSign } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MarketplaceType, ShopeeAccountType, calcShopeeCost } from './MarketplaceSection';

interface QuantitySimulatorProps {
  unitRawMaterialsCost: number;
  operationalTotal: number;
  marginPercentage: number;
  fixedProfit: number;
  commissionPercentage: number;
  fixedFeePerItem: number;
  currentQuantity: number;
  marketplace: MarketplaceType;
  shopeeAccountType: ShopeeAccountType;
  isPro?: boolean;
  onShowUpgrade?: () => void;
}

const QuantitySimulator: React.FC<QuantitySimulatorProps> = ({
  unitRawMaterialsCost,
  operationalTotal,
  marginPercentage,
  fixedProfit,
  commissionPercentage,
  fixedFeePerItem,
  currentQuantity,
  marketplace,
  shopeeAccountType,
  isPro = true,
  onShowUpgrade,
}) => {
  const quantities = [15, 20, 40, 50, 80, 100];

  const formatCurrency = (value: number) => {
    if (!Number.isFinite(value) || isNaN(value)) return 'R$ 0,00';
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const calculateForQuantity = (qty: number) => {
    if (qty <= 0) return { unitPrice: 0, lotPrice: 0, unitCosts: 0, unitFees: 0, unitProfit: 0 };

    const safeQty = Math.max(1, Math.floor(qty));
    const safeOperationalTotal = Math.max(0, operationalTotal || 0);
    const safeUnitRawMaterialsCost = Math.max(0, unitRawMaterialsCost || 0);
    const safeMarginPercentage = Math.min(Math.max(0, marginPercentage || 0), 1000);
    const safeFixedProfit = Math.max(0, fixedProfit || 0);
    const safeCommissionPercentage = Math.min(Math.max(0, commissionPercentage || 0), 100);
    const safeFixedFeePerItem = Math.max(0, fixedFeePerItem || 0);

    const unitOperationalCost = safeOperationalTotal / safeQty;
    const unitProductionCost = safeUnitRawMaterialsCost + unitOperationalCost;

    const isFixedProfit = safeFixedProfit > 0;
    const unitDesiredProfit = isFixedProfit
      ? safeFixedProfit / safeQty
      : unitProductionCost * (safeMarginPercentage / 100);

    const unitBaseSellingPrice = unitProductionCost + unitDesiredProfit;

    // Marketplace fees: Shopee tier-based or custom flat
    let unitMarketplaceCommission = 0;
    let unitMarketplaceFixedFees = 0;

    if (marketplace === 'shopee') {
      const shopee = calcShopeeCost(unitBaseSellingPrice, shopeeAccountType);
      unitMarketplaceCommission = shopee.commission;
      unitMarketplaceFixedFees = shopee.fixedFee / safeQty + (shopee.cpfExtra > 0 ? shopee.cpfExtra / safeQty : 0);
    } else if (marketplace === 'custom') {
      unitMarketplaceCommission = unitBaseSellingPrice * (safeCommissionPercentage / 100);
      unitMarketplaceFixedFees = safeFixedFeePerItem / safeQty;
    }

    const unitTotalFees = unitMarketplaceCommission + unitMarketplaceFixedFees;
    const unitPrice = Math.round((unitBaseSellingPrice + unitTotalFees) * 100) / 100;
    const lotPrice = Math.round(unitPrice * safeQty * 100) / 100;

    return { 
      unitPrice, 
      lotPrice, 
      unitCosts: Math.round(unitProductionCost * 100) / 100,
      unitFees: Math.round(unitTotalFees * 100) / 100,
      unitProfit: Math.round(unitDesiredProfit * 100) / 100,
    };
  };

  const hasMarketplace = marketplace !== 'none';

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
              {/* Linha principal: quantidade, preço lote, preço unitário */}
              <div className="flex items-center justify-between mb-2">
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

              {/* Linha 1: Custos + Lucro */}
              <div className="flex items-center gap-3 text-xs border-t border-border/50 pt-2">
                <div className="flex items-center gap-1">
                  <DollarSign className="w-3 h-3 text-muted-foreground" />
                  <span className="text-muted-foreground">Custos:</span>
                  <span className="font-medium text-foreground">{formatCurrency(calc.unitCosts)}</span>
                </div>
                <div className="flex items-center gap-1">
                  <TrendingUp className="w-3 h-3 text-success" />
                  <span className="text-success">Lucro:</span>
                  <span className="font-medium text-success">{formatCurrency(calc.unitProfit)}</span>
                </div>
              </div>
              {/* Linha 2: Taxas (se houver marketplace) */}
              {hasMarketplace && (
                <div className="flex items-center gap-1 text-xs">
                  <Store className="w-3 h-3 text-warning" />
                  <span className="text-warning">Taxas:</span>
                  <span className="font-medium text-warning">{formatCurrency(calc.unitFees)}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <p className="text-xs text-muted-foreground text-center mt-3">
        Valores por unidade · Quanto maior a quantidade, menor o custo por unidade
      </p>
    </div>
  );
};

export default QuantitySimulator;
