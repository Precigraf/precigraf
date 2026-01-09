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

    // Custo operacional por unidade
    const unitOperationalCost = operationalTotal / qty;
    
    // Custo de produção por unidade
    const unitProductionCost = unitRawMaterialsCost + unitOperationalCost;

    // Lucro desejado por unidade
    const isFixedProfit = fixedProfit > 0;
    const unitDesiredProfit = isFixedProfit
      ? fixedProfit / qty
      : unitProductionCost * (marginPercentage / 100);

    // Preço base de venda por unidade
    const unitBaseSellingPrice = unitProductionCost + unitDesiredProfit;

    // Taxas do marketplace
    const unitMarketplaceCommission = unitBaseSellingPrice * (commissionPercentage / 100);
    const unitMarketplaceFixedFees = fixedFeePerItem / qty;

    // Preço unitário final
    const unitPrice = unitBaseSellingPrice + unitMarketplaceCommission + unitMarketplaceFixedFees;

    // Preço do lote
    const lotPrice = unitPrice * qty;

    // Margem real calculada
    const realMargin = unitProductionCost > 0 
      ? ((unitDesiredProfit / unitProductionCost) * 100) 
      : marginPercentage;

    return { unitPrice, lotPrice, margin: realMargin };
  };

  // Calcular valores atuais para comparação
  const currentCalc = calculateForQuantity(currentQuantity);

  return (
    <div className="bg-secondary/30 rounded-xl p-4">
      <div className="flex items-center gap-2 mb-4">
        <Calculator className="w-4 h-4 text-primary" />
        <span className="text-sm font-medium text-foreground">Simulador de Quantidade</span>
      </div>

      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
        {quantities.map((qty) => {
          const calc = calculateForQuantity(qty);
          const priceDiff = currentCalc.unitPrice > 0 
            ? ((calc.unitPrice - currentCalc.unitPrice) / currentCalc.unitPrice) * 100 
            : 0;
          const isBetter = priceDiff < 0;

          return (
            <div 
              key={qty} 
              className="bg-card rounded-lg p-3 border border-border hover:border-primary/50 transition-colors"
            >
              <div className="text-center">
                <span className="text-xs text-muted-foreground block mb-1">
                  {qty} un
                </span>
                <span className="text-sm font-bold text-foreground block">
                  {formatCurrency(calc.unitPrice)}
                </span>
                <span className="text-xs text-muted-foreground block">
                  /unidade
                </span>
                
                {currentQuantity > 0 && currentQuantity !== qty && Math.abs(priceDiff) > 0.01 && (
                  <div className={`flex items-center justify-center gap-1 mt-2 text-xs ${isBetter ? 'text-success' : 'text-warning'}`}>
                    {isBetter ? (
                      <TrendingDown className="w-3 h-3" />
                    ) : (
                      <TrendingUp className="w-3 h-3" />
                    )}
                    <span>{Math.abs(priceDiff).toFixed(1)}%</span>
                  </div>
                )}
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
