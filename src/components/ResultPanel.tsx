import React from 'react';
import { TrendingUp, Save, Package, DollarSign, Percent, Loader2, Store } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useCalculations } from '@/hooks/useCalculations';
import { useNavigate } from 'react-router-dom';

interface ResultPanelProps {
  productName: string;
  quantity: number;
  baseCost: number;
  rawMaterialsCost: number;
  operationalCost: number;
  productionCost: number;
  totalCost: number;
  profitMargin: number;
  profitValue: number;
  desiredProfit: number;
  baseSellingPrice: number;
  marketplaceCommission: number;
  marketplaceFixedFees: number;
  marketplaceTotalFees: number;
  finalSellingPrice: number;
  sellingPrice: number;
  unitPrice: number;
  isFixedProfit: boolean;
  hasMarketplace: boolean;
  // Additional data for saving
  costType: string;
  lotCost: number;
  paper: number;
  ink: number;
  varnish: number;
  otherMaterials: number;
  labor: number;
  energy: number;
  equipment: number;
  rent: number;
  otherCosts: number;
  fixedProfit: number;
}

const ResultPanel: React.FC<ResultPanelProps> = ({
  productName,
  quantity,
  baseCost,
  rawMaterialsCost,
  operationalCost,
  productionCost,
  totalCost,
  profitMargin,
  profitValue,
  desiredProfit,
  baseSellingPrice,
  marketplaceCommission,
  marketplaceFixedFees,
  marketplaceTotalFees,
  finalSellingPrice,
  sellingPrice,
  unitPrice,
  isFixedProfit,
  hasMarketplace,
  costType,
  lotCost,
  paper,
  ink,
  varnish,
  otherMaterials,
  labor,
  energy,
  equipment,
  rent,
  otherCosts,
  fixedProfit,
}) => {
  const { user } = useAuth();
  const { saveCalculation } = useCalculations();
  const navigate = useNavigate();
  const [saving, setSaving] = React.useState(false);

  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });
  };

  const handleSave = async () => {
    if (!user) {
      navigate('/auth');
      return;
    }

    setSaving(true);
    await saveCalculation({
      productName,
      costType,
      lotQuantity: quantity,
      lotCost,
      paperCost: paper,
      inkCost: ink,
      varnishCost: varnish,
      otherMaterialCost: otherMaterials,
      laborCost: labor,
      energyCost: energy,
      equipmentCost: equipment,
      rentCost: rent,
      otherOperationalCost: otherCosts,
      marginPercentage: profitMargin,
      fixedProfit: fixedProfit > 0 ? fixedProfit : null,
      totalCost,
      profit: profitValue,
      salePrice: sellingPrice,
      unitPrice,
    });
    setSaving(false);
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
            <span className="text-secondary-foreground">Custo base</span>
            <span className="font-medium text-foreground">{formatCurrency(baseCost)}</span>
          </div>
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
      <div className="bg-foreground rounded-xl p-6 mb-6">
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

      {/* Botão Salvar */}
      <Button
        variant="default"
        className="w-full gap-2 bg-foreground hover:bg-foreground/90 text-background border-0"
        onClick={handleSave}
        disabled={saving}
      >
        {saving ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <>
            <Save className="w-4 h-4" />
            {user ? 'Salvar' : 'Entrar para Salvar'}
          </>
        )}
      </Button>
    </div>
  );
};

export default ResultPanel;
