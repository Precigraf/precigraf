import React from 'react';
import { Calculator, TrendingUp, TrendingDown } from 'lucide-react';

interface QuantitySimulatorProps {
  unitRawMaterialsCost: number;
  operationalTotal: number;
  marginPercentage: number;
  fixedProfit: number;
  commissionPercentage: number;
  fixedFeePerItem: number;
  currentQuantity: number;
}

const QuantitySimulator: React.FC<QuantitySimulatorProps> = ({
  unitRawMaterialsCost,
  operationalTotal,
  marginPercentage,
  fixedProfit,
  commissionPercentage,
  fixedFeePerItem,
  currentQuantity,
}) => {
  const quantities = [15, 20, 40, 50, 80, 100];

  const formatCurrency = (value: number) => {
    if (!Number.isFinite(value) || isNaN(value)) return 'R$ 0,00';
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const calculateForQuantity = (qty: number) => {
    if (qty <= 0) return { unitPrice: 0, lotPrice: 0, margin: 0 };

    // Proteção contra divisão por zero e valores inválidos
    const safeQty = Math.max(1, Math.floor(qty));
    const safeOperationalTotal = Math.max(0, operationalTotal || 0);
    const safeUnitRawMaterialsCost = Math.max(0, unitRawMaterialsCost || 0);
    const safeMarginPercentage = Math.min(Math.max(0, marginPercentage || 0), 1000);
    const safeFixedProfit = Math.max(0, fixedProfit || 0);
    const safeCommissionPercentage = Math.min(Math.max(0, commissionPercentage || 0), 100);
    const safeFixedFeePerItem = Math.max(0, fixedFeePerItem || 0);

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
    const unitMarketplaceFixedFees = safeFixedFeePerItem / safeQty;

    // Preço unitário final
    const unitPrice = unitBaseSellingPrice + unitMarketplaceCommission + unitMarketplaceFixedFees;

    // Preço do lote
    const lotPrice = unitPrice * safeQty;

    // Margem real calculada
    const realMargin = unitProductionCost > 0 
      ? ((unitDesiredProfit / unitProductionCost) * 100) 
      : safeMarginPercentage;

    return { 
      unitPrice: Math.round(unitPrice * 100) / 100, 
      lotPrice: Math.round(lotPrice * 100) / 100, 
      margin: Math.round(realMargin * 100) / 100 
    };
  };

  // Calcular valores atuais para comparação
  const currentCalc = calculateForQuantity(currentQuantity);

  return (
    <div className="bg-secondary/30 rounded-xl p-4">
      <div className="flex items-center gap-2 mb-4">
        <Calculator className="w-4 h-4 text-primary" />
        <span className="text-sm font-medium text-foreground">Simulador de Quantidade</span>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {quantities.map((qty) => {
          const calc = calculateForQuantity(qty);
          const priceDiff = currentCalc.unitPrice > 0 
            ? ((calc.unitPrice - currentCalc.unitPrice) / currentCalc.unitPrice) * 100 
            : 0;
          const isBetter = priceDiff < 0;

          const lotPrice = calc.unitPrice * qty;
          
          return (
            <div 
              key={qty} 
              className="bg-card rounded-lg p-4 border border-border hover:border-primary/50 transition-colors overflow-hidden flex flex-col items-center justify-center"
            >
              <span className="text-xs text-muted-foreground whitespace-nowrap mb-1">
                {qty} un
              </span>
              <span 
                className="font-bold text-foreground whitespace-nowrap max-w-full overflow-hidden text-ellipsis text-center"
                style={{ fontSize: 'clamp(14px, 3.5vw, 18px)' }}
              >
                {formatCurrency(lotPrice)}
              </span>
              <span className="text-sm text-muted-foreground/80 whitespace-nowrap mt-0.5">
                {formatCurrency(calc.unitPrice)}/un
              </span>
              
              {currentQuantity > 0 && currentQuantity !== qty && Math.abs(priceDiff) > 0.01 && (
                <div className={`flex items-center justify-center gap-1 mt-2 whitespace-nowrap ${isBetter ? 'text-success' : 'text-warning'}`}>
                  {isBetter ? (
                    <TrendingDown className="w-3 h-3 flex-shrink-0" />
                  ) : (
                    <TrendingUp className="w-3 h-3 flex-shrink-0" />
                  )}
                  <span className="text-[13px] font-semibold">{Math.abs(priceDiff).toFixed(1)}%</span>
                </div>
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
