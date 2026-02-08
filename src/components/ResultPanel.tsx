import React from 'react';
import { TrendingUp, Package, DollarSign, Percent, Store, Wallet, BadgeDollarSign } from 'lucide-react';
import SmartAlerts from './SmartAlerts';
import QuantitySimulator from './QuantitySimulator';
import CostChart from './CostChart';
import SaveCalculationButton from './SaveCalculationButton';
import PriceBreakdown from './PriceBreakdown';
import MarketplaceImpact from './MarketplaceImpact';
import CouponStrategy from './CouponStrategy';
import { MarketplaceType } from './MarketplaceSection';
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
  // Novos props para simulador
  unitRawMaterialsCost: number;
  operationalTotal: number;
  fixedProfit: number;
  commissionPercentage: number;
  fixedFeePerItem: number;
  // Marketplace info
  marketplace?: MarketplaceType;
  // Custos operacionais preenchidos
  hasOperationalCosts?: boolean;
  // Props para salvar
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
  // Nova prop para sugestão de margem do MarketplaceImpact
  onApplySuggestedMargin?: (margin: number) => void;
  // Prop para indicar se está bloqueado
  isBlocked?: boolean;
  // Props para plano do usuário (estratégia de cupom)
  isPro?: boolean;
  onShowUpgrade?: () => void;
  // Props para edição
  editingCalculation?: { id: string; mode: 'edit' | 'duplicate' } | null;
  duplicatedFrom?: string | null;
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
  unitRawMaterialsCost,
  operationalTotal,
  fixedProfit,
  commissionPercentage,
  fixedFeePerItem,
  marketplace = 'none',
  hasOperationalCosts = true,
  saveData,
  onSaved,
  onApplySuggestedMargin,
  isBlocked = false,
  isPro = false,
  onShowUpgrade,
  editingCalculation = null,
  duplicatedFrom = null,
}) => {
  const formatCurrency = (value: number) => {
    if (!Number.isFinite(value) || isNaN(value)) {
      return 'R$ 0,00';
    }
    // Arredondar para 2 casas decimais antes de formatar
    const rounded = Math.round(value * 100) / 100;
    return rounded.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });
  };

  // Garantir que quantity seja pelo menos 0 para exibição
  const safeQuantity = Math.max(0, Math.floor(quantity || 0));

  // Cálculos adicionais com proteção contra divisão por zero
  const unitProductionCost = safeQuantity > 0 ? Math.round((productionCost / safeQuantity) * 100) / 100 : 0;
  const unitProfit = safeQuantity > 0 ? Math.round((desiredProfit / safeQuantity) * 100) / 100 : 0;
  const netProfit = Math.round((finalSellingPrice - productionCost - marketplaceTotalFees) * 100) / 100;
  const unitNetProfit = safeQuantity > 0 ? Math.round((netProfit / safeQuantity) * 100) / 100 : 0;

  // Margem real calculada (com proteção contra divisão por zero)
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

      {/* Alertas Inteligentes Aprimorados */}
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

      {/* PREÇO FINAL - DESTAQUE MÁXIMO */}
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

      {/* Resumo de Valores - Layout Vertical */}
      <div className="space-y-3">
        {/* Custo de Produção */}
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

        {/* Lucro Desejado */}
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

        {/* Lucro Líquido Total */}
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

        {/* Taxas Marketplace */}
        {hasMarketplace && (
          <div className="bg-warning/10 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Store className="w-4 h-4 text-warning" />
                <span className="text-sm text-warning">Taxas Marketplace</span>
              </div>
              <div className="text-right">
                <div className="text-sm font-semibold text-warning">
                  -{formatCurrency(marketplaceTotalFees)}
                </div>
                <div className="text-xs text-muted-foreground">
                  Comissão + Taxa fixa
                </div>
              </div>
            </div>
          </div>
        )}
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
        marketplaceTotalFees={marketplaceTotalFees}
        finalSellingPrice={finalSellingPrice}
        quantity={safeQuantity}
      />

      {/* Impacto do Marketplace */}
      <MarketplaceImpact
        marketplace={marketplace}
        unitPrice={unitPrice}
        unitProfit={unitProfit}
        marketplaceTotalFees={marketplaceTotalFees}
        quantity={safeQuantity}
        onApplySuggestedMargin={onApplySuggestedMargin}
      />

      {/* Estratégia de Cupom - PRO Feature */}
      <CouponStrategy
        finalSellingPrice={finalSellingPrice}
        unitPrice={unitPrice}
        quantity={safeQuantity}
        totalCost={productionCost + marketplaceTotalFees}
        profit={desiredProfit}
        isPro={isPro}
        onShowUpgrade={onShowUpgrade}
      />

      {/* Gráfico de Composição */}
      <CostChart
        rawMaterialsCost={rawMaterialsCost}
        operationalCost={operationalCost}
        profit={desiredProfit}
        marketplaceFees={marketplaceTotalFees}
      />

      {/* Simulador de Quantidade */}
      <QuantitySimulator
        unitRawMaterialsCost={unitRawMaterialsCost}
        operationalTotal={operationalTotal}
        marginPercentage={profitMargin}
        fixedProfit={fixedProfit}
        commissionPercentage={commissionPercentage}
        fixedFeePerItem={fixedFeePerItem}
        currentQuantity={safeQuantity}
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
        />
      )}
    </div>
  );
};

export default ResultPanel;
