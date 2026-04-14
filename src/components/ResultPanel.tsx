import React from 'react';
import { TrendingUp, Package, DollarSign, Wallet, BadgeDollarSign } from 'lucide-react';
import SmartAlerts from './SmartAlerts';
import QuantitySimulator from './QuantitySimulator';
import CostChart from './CostChart';
import SaveCalculationButton from './SaveCalculationButton';
import PriceBreakdown from './PriceBreakdown';
import CouponStrategy from './CouponStrategy';

interface ResultPanelProps {
  productName: string;
  quantity: number;
  rawMaterialsCost: number;
  operationalCost: number;
  productionCost: number;
  profitMargin: number;
  desiredProfit: number;
  finalSellingPrice: number;
  unitPrice: number;
  isFixedProfit: boolean;
  unitRawMaterialsCost: number;
  operationalTotal: number;
  fixedProfit: number;
  hasOperationalCosts?: boolean;
  saveData?: {
    paper: number;
    ink: number;
    varnish: number;
    otherMaterials: number;
    labor: number;
    energy: number;
    equipment: number;
    rent: number;
    otherCosts: number;
  };
  onSaved?: () => void;
  onApplySuggestedMargin?: (margin: number) => void;
  isBlocked?: boolean;
  isPro?: boolean;
  onShowUpgrade?: () => void;
  editingCalculation?: { id: string; mode: 'edit' | 'duplicate' } | null;
  duplicatedFrom?: string | null;
  rawInputs?: Record<string, unknown>;
}

const ResultPanel: React.FC<ResultPanelProps> = ({
  productName,
  quantity,
  rawMaterialsCost,
  operationalCost,
  productionCost,
  profitMargin,
  desiredProfit,
  finalSellingPrice,
  unitPrice,
  isFixedProfit,
  unitRawMaterialsCost,
  operationalTotal,
  fixedProfit,
  hasOperationalCosts = true,
  saveData,
  onSaved,
  onApplySuggestedMargin,
  isBlocked = false,
  isPro = false,
  onShowUpgrade,
  editingCalculation = null,
  duplicatedFrom = null,
  rawInputs,
}) => {
  const formatCurrency = (value: number) => {
    if (!Number.isFinite(value) || isNaN(value)) {
      return 'R$ 0,00';
    }
    return value.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });
  };

  const safeQuantity = Math.max(0, Math.floor(quantity || 0));
  const unitProductionCost = safeQuantity > 0 ? productionCost / safeQuantity : 0;
  const unitProfit = safeQuantity > 0 ? desiredProfit / safeQuantity : 0;
  const netProfit = finalSellingPrice - productionCost;
  const unitNetProfit = safeQuantity > 0 ? netProfit / safeQuantity : 0;

  const realMarginPercentage = productionCost > 0 
    ? Math.round((desiredProfit / productionCost) * 100) 
    : profitMargin;

  return (
    <div className="glass-card result-gradient p-6 sticky top-6 animate-slide-up space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
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

      {/* Alertas Inteligentes */}
      <SmartAlerts
        marginPercentage={realMarginPercentage}
        netProfit={netProfit}
        rawMaterialsCost={rawMaterialsCost}
        operationalCost={operationalCost}
        quantity={safeQuantity}
        hasOperationalCosts={hasOperationalCosts}
        productionCost={productionCost}
        finalSellingPrice={finalSellingPrice}
      />

      {/* PREÇO FINAL */}
      <div className="bg-foreground rounded-xl p-6">
        <div className="text-center">
          <span className="text-xs font-medium text-background/70 uppercase tracking-wide">
            Preço Final de Venda
          </span>
          <div className="text-4xl font-bold text-background mt-1">
            {formatCurrency(finalSellingPrice)}
          </div>
          <div className="text-sm text-background/80 mt-1">
            para {safeQuantity} unidades
          </div>
        </div>
      </div>

      {/* Preço por Unidade */}
      <div className="bg-success/10 border border-success/30 rounded-xl p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BadgeDollarSign className="w-5 h-5 text-success" />
            <span className="text-sm font-medium text-foreground">
              Preço por Unidade
            </span>
          </div>
          <span className="text-2xl font-bold text-success">
            {formatCurrency(unitPrice)}
          </span>
        </div>
      </div>

      {/* Resumo de Valores */}
      <div className="space-y-3">
        <div className="bg-secondary/50 rounded-lg p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <DollarSign className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Custo Produção</span>
            </div>
            <div className="text-right">
              <div className="text-sm font-semibold text-foreground">
                {formatCurrency(productionCost)}
              </div>
              <div className="text-xs text-muted-foreground">
                {formatCurrency(unitProductionCost)}/un
              </div>
            </div>
          </div>
        </div>

        <div className="bg-secondary/50 rounded-lg p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Wallet className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                Lucro {isFixedProfit ? '(fixo)' : `(${profitMargin}%)`}
              </span>
            </div>
            <div className="text-right">
              <div className="text-sm font-semibold text-success">
                {formatCurrency(desiredProfit)}
              </div>
              <div className="text-xs text-muted-foreground">
                {formatCurrency(unitProfit)}/un
              </div>
            </div>
          </div>
        </div>

        <div className="bg-success/10 rounded-lg p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-success" />
              <span className="text-sm text-success">Lucro Líquido Total</span>
            </div>
            <div className="text-right">
              <div className="text-sm font-semibold text-success">
                {formatCurrency(netProfit)}
              </div>
              <div className="text-xs text-muted-foreground">
                {formatCurrency(unitNetProfit)}/un
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Breakdown Detalhado */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Package className="w-4 h-4" />
          <span>Detalhamento dos Custos</span>
        </div>

        <div className="space-y-2 text-sm">
          <div className="flex justify-between items-center py-1">
            <span className="text-secondary-foreground">Matéria-prima</span>
            <span className="font-medium text-foreground">{formatCurrency(rawMaterialsCost)}</span>
          </div>
          <div className="flex justify-between items-center py-1">
            <span className="text-secondary-foreground">Custos operacionais</span>
            <span className="font-medium text-foreground">{formatCurrency(operationalCost)}</span>
          </div>
          <div className="flex justify-between items-center py-1 border-t border-border pt-2">
            <span className="font-medium text-foreground">Custo Total de Produção</span>
            <span className="font-bold text-foreground">{formatCurrency(productionCost)}</span>
          </div>
        </div>
      </div>

      {/* Resumo Detalhado do Preço */}
      <PriceBreakdown
        rawMaterialsCost={rawMaterialsCost}
        operationalCost={operationalCost}
        desiredProfit={desiredProfit}
        marketplaceTotalFees={0}
        finalSellingPrice={finalSellingPrice}
        quantity={safeQuantity}
      />

      {/* Estratégia de Cupom - PRO Feature */}
      <CouponStrategy
        finalSellingPrice={finalSellingPrice}
        unitPrice={unitPrice}
        quantity={safeQuantity}
        totalCost={productionCost}
        profit={desiredProfit}
        isPro={isPro}
        onShowUpgrade={onShowUpgrade}
      />

      {/* Gráfico de Composição */}
      <CostChart
        rawMaterialsCost={rawMaterialsCost}
        operationalCost={operationalCost}
        profit={desiredProfit}
        marketplaceFees={0}
      />

      {/* Simulador de Quantidade */}
      <QuantitySimulator
        unitRawMaterialsCost={unitRawMaterialsCost}
        operationalTotal={operationalTotal}
        marginPercentage={profitMargin}
        fixedProfit={fixedProfit}
        commissionPercentage={0}
        fixedFeePerItem={0}
        currentQuantity={safeQuantity}
        marketplace="none"
        shopeeAccountType="cnpj"
        isPro={isPro}
        onShowUpgrade={onShowUpgrade}
      />

      {/* Botão Salvar Cálculo */}
      {saveData && (
        <SaveCalculationButton
          data={{
            productName,
            quantity: safeQuantity,
            paper: saveData.paper,
            ink: saveData.ink,
            varnish: saveData.varnish,
            otherMaterials: saveData.otherMaterials,
            labor: saveData.labor,
            energy: saveData.energy,
            equipment: saveData.equipment,
            rent: saveData.rent,
            otherCosts: saveData.otherCosts,
            profitMargin,
            fixedProfit,
            productionCost,
            desiredProfit,
            finalSellingPrice,
            unitPrice,
          }}
           onSaved={onSaved}
           editingCalculation={editingCalculation}
           duplicatedFrom={duplicatedFrom}
           rawInputs={rawInputs}
        />
      )}
    </div>
  );
};

export default ResultPanel;
