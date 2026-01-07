import React from 'react';
import { TrendingUp, Package, DollarSign, Percent, Store } from 'lucide-react';

interface ResultPanelProps {
  productName: string;
  quantity: number;
  rawMaterialsCost: number;
  operationalCost: number;
  productionCost: number;
  profitMargin: number;
  desiredProfit: number;
  marketplaceCommission: number;
  marketplaceFixedFees: number;
  marketplaceTotalFees: number;
  finalSellingPrice: number;
  unitPrice: number;
  isFixedProfit: boolean;
  hasMarketplace: boolean;
}

const ResultPanel: React.FC<ResultPanelProps> = ({
  productName,
  quantity,
  rawMaterialsCost,
  operationalCost,
  productionCost,
  profitMargin,
  desiredProfit,
  marketplaceCommission,
  marketplaceFixedFees,
  marketplaceTotalFees,
  finalSellingPrice,
  unitPrice,
  isFixedProfit,
  hasMarketplace,
}) => {
  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });
  };

  return (
    <div className="glass-card result-gradient p-6 sticky top-6 animate-slide-up">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-foreground flex items-center justify-center">
          <TrendingUp className="w-5 h-5 text-background" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-foreground">Resultado</h2>
          <p className="text-sm text-muted-foreground">
            {productName || 'Produto sem nome'}
          </p>
        </div>
      </div>

      {/* Custos Breakdown */}
      <div className="space-y-4 mb-6">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Package className="w-4 h-4" />
          <span>Custos para {quantity} unidades</span>
        </div>

        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-secondary-foreground">Matéria-prima</span>
            <span className="font-medium text-foreground">{formatCurrency(rawMaterialsCost)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-secondary-foreground">Custos operacionais</span>
            <span className="font-medium text-foreground">{formatCurrency(operationalCost)}</span>
          </div>
          
          <div className="border-t border-border pt-3">
            <div className="flex justify-between items-center">
              <span className="font-semibold text-foreground flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-foreground" />
                CUSTO DE PRODUÇÃO
              </span>
              <span className="font-bold text-lg text-foreground">{formatCurrency(productionCost)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Lucro Desejado */}
      <div className="bg-secondary/50 rounded-xl p-4 mb-4">
        <div className="flex items-center gap-2 mb-2">
          <Percent className="w-4 h-4 text-foreground" />
          <span className="text-sm text-secondary-foreground">
            Lucro Desejado {isFixedProfit ? '(valor fixo)' : `(${profitMargin}%)`}
          </span>
        </div>
        <span className="text-2xl font-bold text-success">
          + {formatCurrency(desiredProfit)}
        </span>
      </div>

      {/* Taxas do Marketplace */}
      {hasMarketplace && (
        <div className="bg-warning/10 border border-warning/30 rounded-xl p-4 mb-4">
          <div className="flex items-center gap-2 mb-3">
            <Store className="w-4 h-4 text-warning" />
            <span className="text-sm font-medium text-warning">Taxas do Marketplace</span>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between items-center">
              <span className="text-secondary-foreground">• Comissão (%)</span>
              <span className="text-foreground">{formatCurrency(marketplaceCommission)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-secondary-foreground">• Taxa fixa ({quantity} un)</span>
              <span className="text-foreground">{formatCurrency(marketplaceFixedFees)}</span>
            </div>
            <div className="border-t border-warning/30 pt-2 mt-2">
              <div className="flex justify-between items-center font-medium">
                <span className="text-warning">Total de taxas</span>
                <span className="text-warning">{formatCurrency(marketplaceTotalFees)}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Preço Final de Venda - Destaque */}
      <div className="bg-foreground rounded-xl p-6">
        <div className="text-center">
          <span className="text-sm font-medium text-background/80 uppercase tracking-wide">
            Preço Final de Venda
          </span>
          <div className="text-4xl font-bold text-background mt-2 mb-3">
            {formatCurrency(finalSellingPrice)}
          </div>
          <div className="bg-background/20 rounded-lg py-2 px-4 inline-block">
            <span className="text-sm text-background">
              Preço por unidade ({quantity} un) → <strong>{formatCurrency(unitPrice)}</strong>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResultPanel;
