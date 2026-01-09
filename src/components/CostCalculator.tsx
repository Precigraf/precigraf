import React, { useState, useMemo } from 'react';
import { Package, Layers, Factory, Percent, Tag } from 'lucide-react';
import FormSection from './FormSection';
import CurrencyInput from './CurrencyInput';
import MarginSlider from './MarginSlider';
import ResultPanel from './ResultPanel';
import MarketplaceSection, { MarketplaceType, MARKETPLACE_CONFIG } from './MarketplaceSection';
import { Input } from '@/components/ui/input';

const CostCalculator: React.FC = () => {
  // Estado do formulário
  const [productName, setProductName] = useState('');
  const [lotQuantity, setLotQuantity] = useState(0);

  // Matéria-prima
  const [paper, setPaper] = useState(0);
  const [ink, setInk] = useState(0);
  const [varnish, setVarnish] = useState(0);
  const [otherMaterials, setOtherMaterials] = useState(0);

  // Custos operacionais
  const [labor, setLabor] = useState(0);
  const [energy, setEnergy] = useState(0);
  const [equipment, setEquipment] = useState(0);
  const [rent, setRent] = useState(0);
  const [otherCosts, setOtherCosts] = useState(0);

  // Margem de lucro
  const [profitMargin, setProfitMargin] = useState(0);
  const [fixedProfit, setFixedProfit] = useState(0);

  // Marketplace
  const [marketplace, setMarketplace] = useState<MarketplaceType>('none');
  const [commissionPercentage, setCommissionPercentage] = useState(0);
  const [fixedFeePerItem, setFixedFeePerItem] = useState(0);

  // Cálculos em tempo real - CALCULADO POR UNIDADE e multiplicado pela quantidade
  const calculations = useMemo(() => {
    // Matéria-prima por unidade (valores informados são por unidade)
    const unitRawMaterialsCost = paper + ink + varnish + otherMaterials;
    
    // Matéria-prima total = unitário × quantidade
    const rawMaterialsCost = unitRawMaterialsCost * lotQuantity;

    // Custos operacionais total (dividido por quantidade para obter por unidade)
    const operationalTotal = labor + energy + equipment + rent + otherCosts;
    const unitOperationalCost = lotQuantity > 0 ? operationalTotal / lotQuantity : 0;

    // Custo de produção por unidade (apenas matéria-prima + operacional por unidade)
    const unitProductionCost = unitRawMaterialsCost + unitOperationalCost;

    // Lucro desejado por unidade (valor fixo tem prioridade)
    const isFixedProfit = fixedProfit > 0;
    const unitDesiredProfit = isFixedProfit
      ? (lotQuantity > 0 ? fixedProfit / lotQuantity : 0)
      : unitProductionCost * (profitMargin / 100);

    // Preço base de venda por unidade (sem taxas)
    const unitBaseSellingPrice = unitProductionCost + unitDesiredProfit;

    // Taxas do marketplace por unidade
    const unitMarketplaceCommission = unitBaseSellingPrice * (commissionPercentage / 100);
    // Taxa fixa é única por venda, não por unidade
    const unitMarketplaceFixedFees = lotQuantity > 0 ? fixedFeePerItem / lotQuantity : 0;
    const unitMarketplaceTotalFees = unitMarketplaceCommission + unitMarketplaceFixedFees;

    // Preço unitário final (com taxas)
    const unitPrice = unitBaseSellingPrice + unitMarketplaceTotalFees;

    // PREÇO FINAL = Preço unitário × Quantidade
    const finalSellingPrice = unitPrice * lotQuantity;

    // Totais para exibição
    const operationalCost = operationalTotal;
    const productionCost = unitProductionCost * lotQuantity;
    const desiredProfit = unitDesiredProfit * lotQuantity;
    const marketplaceCommission = unitMarketplaceCommission * lotQuantity;
    const marketplaceFixedFees = unitMarketplaceFixedFees * lotQuantity;
    const marketplaceTotalFees = unitMarketplaceTotalFees * lotQuantity;

    // Lucro líquido
    const netProfit = finalSellingPrice - productionCost - marketplaceTotalFees;

    return {
      rawMaterialsCost,
      operationalCost,
      productionCost,
      isFixedProfit,
      desiredProfit,
      baseSellingPrice: unitBaseSellingPrice * lotQuantity,
      marketplaceCommission,
      marketplaceFixedFees,
      marketplaceTotalFees,
      finalSellingPrice,
      unitPrice,
      netProfit,
      // Legacy compatibility
      totalCost: productionCost,
      profitValue: desiredProfit,
      sellingPrice: finalSellingPrice,
    };
  }, [
    lotQuantity,
    paper,
    ink,
    varnish,
    otherMaterials,
    labor,
    energy,
    equipment,
    rent,
    otherCosts,
    profitMargin,
    fixedProfit,
    commissionPercentage,
    fixedFeePerItem,
  ]);
  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-6">
      {/* Coluna Esquerda - Formulário */}
      <div className="space-y-6">
        {/* Seção 1: Nome do Produto */}
        <FormSection title="Produto" icon={<Tag className="w-5 h-5 text-primary" />}>
          <div className="col-span-full">
            <label className="text-sm font-medium text-secondary-foreground mb-2 block">
              Nome do produto
            </label>
            <Input
              type="text"
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              placeholder=""
              className="input-currency"
            />
            <p className="text-xs text-muted-foreground mt-1.5">
              Ex: Mini sacola de papel personalizada
            </p>
          </div>
        </FormSection>

        {/* Seção 2: Quantidade */}
        <FormSection
          title="Quantidade"
          icon={<Package className="w-5 h-5 text-primary" />}
        >
          <div className="col-span-full">
            <Input
              type="number"
              value={lotQuantity || ''}
              onChange={(e) => setLotQuantity(parseInt(e.target.value) || 0)}
              placeholder="0"
              className="input-currency"
              min={1}
            />
          </div>
        </FormSection>

        {/* Seção 3: Matéria-prima (valor por unidade) */}
        <FormSection
          title="Matéria-prima (valor por unidade)"
          icon={<Layers className="w-5 h-5 text-primary" />}
          subtitle="Informe o custo de materiais por unidade"
        >
          <CurrencyInput label="Papel" value={paper} onChange={setPaper} />
          <CurrencyInput label="Alça" value={ink} onChange={setInk} />
          <CurrencyInput label="Tinta" value={varnish} onChange={setVarnish} />
          <CurrencyInput label="Outros" value={otherMaterials} onChange={setOtherMaterials} />
        </FormSection>

        {/* Seção 4: Custos Operacionais */}
        <FormSection
          title="Custos Operacionais"
          icon={<Factory className="w-5 h-5 text-primary" />}
          subtitle="Informe o custo total de operação para este lote"
        >
          <CurrencyInput label="Mão de obra" value={labor} onChange={setLabor} />
          <CurrencyInput label="Energia" value={energy} onChange={setEnergy} />
          <CurrencyInput label="Equipamentos" value={equipment} onChange={setEquipment} />
          <CurrencyInput label="Aluguel" value={rent} onChange={setRent} />
          <CurrencyInput
            label="Outros custos"
            value={otherCosts}
            onChange={setOtherCosts}
            fullWidth
          />
        </FormSection>

        {/* Seção 5: Margem de Lucro */}
        <FormSection
          title="Margem de Lucro"
          icon={<Percent className="w-5 h-5 text-primary" />}
        >
          <div className="col-span-full">
            <MarginSlider
              value={profitMargin}
              onChange={setProfitMargin}
              disabled={fixedProfit > 0}
            />
          </div>

          <div className="col-span-full flex items-center justify-center py-4">
            <div className="flex items-center gap-4">
              <div className="h-px w-16 bg-border" />
              <span className="text-sm text-muted-foreground font-medium">OU</span>
              <div className="h-px w-16 bg-border" />
            </div>
          </div>

          <CurrencyInput
            label="Valor fixo de lucro (total)"
            value={fixedProfit}
            onChange={setFixedProfit}
            helperText="Lucro total sobre o lote (não por unidade)"
            fullWidth
          />
        </FormSection>

        {/* Seção 6: Marketplace */}
        <MarketplaceSection
          marketplace={marketplace}
          onMarketplaceChange={setMarketplace}
          commissionPercentage={commissionPercentage}
          onCommissionChange={setCommissionPercentage}
          fixedFeePerItem={fixedFeePerItem}
          onFixedFeeChange={setFixedFeePerItem}
          profitValue={calculations.desiredProfit}
          marketplaceTotalFees={calculations.marketplaceTotalFees}
        />

      </div>

      {/* Coluna Direita - Resultados */}
      <div className="space-y-6">
        <ResultPanel
          productName={productName}
          quantity={lotQuantity}
          rawMaterialsCost={calculations.rawMaterialsCost}
          operationalCost={calculations.operationalCost}
          productionCost={calculations.productionCost}
          profitMargin={profitMargin}
          desiredProfit={calculations.desiredProfit}
          marketplaceCommission={calculations.marketplaceCommission}
          marketplaceFixedFees={calculations.marketplaceFixedFees}
          marketplaceTotalFees={calculations.marketplaceTotalFees}
          finalSellingPrice={calculations.finalSellingPrice}
          unitPrice={calculations.unitPrice}
          isFixedProfit={calculations.isFixedProfit}
          hasMarketplace={marketplace !== 'none'}
        />
      </div>
    </div>
  );
};

export default CostCalculator;
