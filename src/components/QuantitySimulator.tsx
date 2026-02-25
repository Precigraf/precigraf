import React from 'react';
import { Calculator, Lock, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MarketplaceType, SellerType } from './MarketplaceSection';
import { solveShopeeUnitPrice, getTierLabel } from '@/lib/shopeeUtils';

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
  marketplace?: MarketplaceType;
  sellerType?: SellerType;
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
  cpfTax,
  currentQuantity,
  hasMarketplace,
  marketplace = 'none',
  sellerType = 'cpf',
  isPro = true,
  onShowUpgrade,
}) => {
  const quantities = [15, 20, 40, 50, 80, 100];

  const formatCurrency = (value: number) => {
    if (!Number.isFinite(value) || isNaN(value)) return 'R$ 0,00';
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const calculateForQuantity = (qty: number) => {
    if (qty <= 0) return { unitPrice: 0, lotPrice: 0, totalCost: 0, totalFees: 0, totalProfit: 0, tierLabel: '' };

    const safeQty = Math.max(1, Math.floor(qty));
    const safeOperationalTotal = Math.max(0, operationalTotal || 0);
    const safeUnitRawMaterialsCost = Math.max(0, unitRawMaterialsCost || 0);
    const safeMarginPercentage = Math.min(Math.max(0, marginPercentage || 0), 1000);
    const safeFixedProfit = Math.max(0, fixedProfit || 0);

    // Custo operacional por unidade
    const unitOperationalCost = safeOperationalTotal / safeQty;
    
    // Custo de produção por unidade
    const unitProductionCost = safeUnitRawMaterialsCost + unitOperationalCost;

    // Lucro desejado por unidade
    const isFixed = safeFixedProfit > 0;
    const unitDesiredProfit = isFixed
      ? safeFixedProfit / safeQty
      : unitProductionCost * (safeMarginPercentage / 100);

    // Preço base de venda por unidade (sem marketplace)
    const unitBaseSellingPrice = unitProductionCost + unitDesiredProfit;

    let unitPrice = unitBaseSellingPrice;
    let totalFees = 0;
    let tierLabel = '';

    if (marketplace === 'shopee') {
      const shopeeResult = solveShopeeUnitPrice(unitBaseSellingPrice, safeQty, sellerType);
      unitPrice = shopeeResult.unitPrice;
      totalFees = shopeeResult.totalFeesForLot;
      tierLabel = getTierLabel(shopeeResult.tier, sellerType);
    } else if (hasMarketplace) {
      const safeCommission = Math.min(Math.max(0, commissionPercentage || 0), 100);
      const safeFee = Math.max(0, fixedFeePerItem || 0);
      const safeCpf = Math.max(0, cpfTax || 0);
      const unitFixedFees = (safeFee + safeCpf) / safeQty;
      const commFrac = safeCommission / 100;
      unitPrice = commFrac < 1
        ? (unitBaseSellingPrice + unitFixedFees) / (1 - commFrac)
        : unitBaseSellingPrice + unitFixedFees;
      const unitCommission = unitPrice * commFrac;
      totalFees = Math.round((unitCommission + unitFixedFees) * safeQty * 100) / 100;
    }

    const lotPrice = Math.round(unitPrice * safeQty * 100) / 100;
    const totalCost = Math.round(unitProductionCost * safeQty * 100) / 100;
    const totalProfit = Math.round(unitDesiredProfit * safeQty * 100) / 100;

    return { 
      unitPrice: Math.round(unitPrice * 100) / 100, 
      lotPrice, 
      totalCost,
      totalFees,
      totalProfit,
      tierLabel,
    };
  };

  const handleUpgradeClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onShowUpgrade) onShowUpgrade();
  };

  // Versão bloqueada para usuários FREE
  if (!isPro) {
    return (
      <div className="relative overflow-hidden rounded-xl" onClick={handleUpgradeClick}>
        <div className="absolute inset-0 bg-background/70 backdrop-blur-[2px] z-10 flex flex-col items-center justify-center gap-2 cursor-pointer">
          <Lock className="w-5 h-5 text-muted-foreground" />
          <Badge variant="outline" className="text-xs bg-background/80">
            <Sparkles className="w-3 h-3 mr-1" />
            Desbloqueie no Plano Pro
          </Badge>
          <Button size="sm" onClick={handleUpgradeClick} className="mt-2 text-xs pointer-events-auto">
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
              <div key={qty} className="bg-card rounded-lg p-3 border border-border flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground min-w-[50px]">{qty} un</span>
                <span className="text-sm text-muted-foreground">R$ ---</span>
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground text-center mt-3">Simule preços para diferentes quantidades</p>
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
            <div key={qty} className="bg-card rounded-lg p-3 border border-border hover:border-primary/50 transition-colors">
              {/* Linha principal */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-muted-foreground min-w-[50px]">{qty} un</span>
                  <span className="font-bold text-foreground" style={{ fontSize: 'clamp(14px, 3.5vw, 16px)' }}>
                    {formatCurrency(calc.lotPrice)}
                  </span>
                </div>
                <span className="text-sm text-muted-foreground/80">{formatCurrency(calc.unitPrice)}/un</span>
              </div>

              {/* Detalhamento */}
              <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 pt-2 border-t border-border/50 text-xs">
                <div className="flex items-center gap-1">
                  <span className="text-muted-foreground">Mat. + Operacional:</span>
                  <span className="font-medium text-foreground">{formatCurrency(calc.totalCost)}</span>
                </div>
                {hasMarketplace && (
                  <div className="flex items-center gap-1">
                    <span className="text-warning">Taxas Shopee:</span>
                    <span className="font-medium text-warning">{formatCurrency(calc.totalFees)}</span>
                  </div>
                )}
                <div className="flex items-center gap-1">
                  <span className="text-success">Lucro:</span>
                  <span className="font-medium text-success">{formatCurrency(calc.totalProfit)}</span>
                </div>
              </div>

              {/* Faixa de preço ativa */}
              {calc.tierLabel && (
                <div className="mt-1.5 text-[10px] text-warning/70">{calc.tierLabel}</div>
              )}
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
