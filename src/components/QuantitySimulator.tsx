import React from 'react';
import { Calculator, Lock, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

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
    const safeCommissionPercentage = Math.min(Math.max(0, commissionPercentage || 0), 100);
    const safeFixedFeePerItem = Math.max(0, fixedFeePerItem || 0);
    const safeCpfTax = Math.max(0, cpfTax || 0);

    // Custo operacional por unidade
    const unitOperationalCost = safeOperationalTotal / safeQty;
    
    // Custo de produção por unidade
    const unitProductionCost = safeUnitRawMaterialsCost + unitOperationalCost;

    // Lucro desejado por unidade
    const isFixedProfit = safeFixedProfit > 0;
    const unitDesiredProfit = isFixedProfit
      ? safeFixedProfit / safeQty
      : unitProductionCost * (safeMarginPercentage / 100);

    // Preço base de venda por unidade
    const unitBaseSellingPrice = unitProductionCost + unitDesiredProfit;

    // Taxas do marketplace
    const unitMarketplaceCommission = unitBaseSellingPrice * (safeCommissionPercentage / 100);
    // Taxa fixa (R$20) + taxa CPF (R$3) são por pedido, divididas pela quantidade
    const unitMarketplaceFixedFees = (safeFixedFeePerItem + safeCpfTax) / safeQty;

    // Preço unitário final
    const unitPrice = unitBaseSellingPrice + unitMarketplaceCommission + unitMarketplaceFixedFees;

    // Totais do lote
    const lotPrice = Math.round(unitPrice * safeQty * 100) / 100;
    const totalCost = Math.round(unitProductionCost * safeQty * 100) / 100;
    const totalFees = Math.round((unitMarketplaceCommission + unitMarketplaceFixedFees) * safeQty * 100) / 100;
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
