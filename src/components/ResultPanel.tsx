import React from 'react';
import { TrendingUp, Save, BarChart3, Package, DollarSign, Percent } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ResultPanelProps {
  productName: string;
  quantity: number;
  baseCost: number;
  rawMaterialsCost: number;
  operationalCost: number;
  totalCost: number;
  profitMargin: number;
  profitValue: number;
  sellingPrice: number;
  unitPrice: number;
  isFixedProfit: boolean;
}

const ResultPanel: React.FC<ResultPanelProps> = ({
  productName,
  quantity,
  baseCost,
  rawMaterialsCost,
  operationalCost,
  totalCost,
  profitMargin,
  profitValue,
  sellingPrice,
  unitPrice,
  isFixedProfit,
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
        <div className="w-10 h-10 rounded-xl gold-gradient flex items-center justify-center">
          <TrendingUp className="w-5 h-5 text-primary-foreground" />
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
                <DollarSign className="w-4 h-4 text-primary" />
                CUSTO TOTAL
              </span>
              <span className="font-bold text-lg text-foreground">{formatCurrency(totalCost)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Lucro */}
      <div className="bg-secondary/50 rounded-xl p-4 mb-6">
        <div className="flex items-center gap-2 mb-2">
          <Percent className="w-4 h-4 text-primary" />
          <span className="text-sm text-secondary-foreground">
            Lucro {isFixedProfit ? '(valor fixo)' : `(${profitMargin}%)`}
          </span>
        </div>
        <span className="text-2xl font-bold text-success">
          + {formatCurrency(profitValue)}
        </span>
      </div>

      {/* Preço de Venda - Destaque */}
      <div className="gold-gradient rounded-xl p-6 mb-6 shadow-gold">
        <div className="text-center">
          <span className="text-sm font-medium text-primary-foreground/80 uppercase tracking-wide">
            Preço Total de Venda
          </span>
          <div className="text-4xl font-bold text-primary-foreground mt-2 mb-3">
            {formatCurrency(sellingPrice)}
          </div>
          <div className="bg-primary-foreground/20 rounded-lg py-2 px-4 inline-block">
            <span className="text-sm text-primary-foreground">
              Preço por unidade ({quantity} un) → <strong>{formatCurrency(unitPrice)}</strong>
            </span>
          </div>
        </div>
      </div>

      {/* Botões */}
      <div className="grid grid-cols-2 gap-3">
        <Button variant="secondary" className="gap-2">
          <BarChart3 className="w-4 h-4" />
          Análise
        </Button>
        <Button variant="default" className="gap-2 gold-gradient hover:opacity-90 text-primary-foreground border-0">
          <Save className="w-4 h-4" />
          Salvar
        </Button>
      </div>
    </div>
  );
};

export default ResultPanel;
