import React, { useState, useMemo } from 'react';
import { Package, Layers, Factory, Percent, CircleDollarSign, Tag } from 'lucide-react';
import FormSection from './FormSection';
import CurrencyInput from './CurrencyInput';
import MarginSlider from './MarginSlider';
import ResultPanel from './ResultPanel';
import SavedCalculations from './SavedCalculations';
import MarketplaceSection, { MarketplaceType, MARKETPLACE_CONFIG } from './MarketplaceSection';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/useAuth';

const CostCalculator: React.FC = () => {
  const { user } = useAuth();
  
  // Estado do formulário
  const [productName, setProductName] = useState('Tag impressa 4x5cm');
  const [costType, setCostType] = useState<'lot' | 'unit'>('lot');
  const [lotQuantity, setLotQuantity] = useState(500);
  const [lotCost, setLotCost] = useState(150);
  const [unitCost, setUnitCost] = useState(0.3);

  // Matéria-prima
  const [paper, setPaper] = useState(50);
  const [ink, setInk] = useState(30);
  const [varnish, setVarnish] = useState(15);
  const [otherMaterials, setOtherMaterials] = useState(10);

  // Custos operacionais
  const [labor, setLabor] = useState(80);
  const [energy, setEnergy] = useState(20);
  const [equipment, setEquipment] = useState(25);
  const [rent, setRent] = useState(40);
  const [otherCosts, setOtherCosts] = useState(0);

  // Margem de lucro
  const [profitMargin, setProfitMargin] = useState(70);
  const [fixedProfit, setFixedProfit] = useState(0);

  // Marketplace
  const [marketplace, setMarketplace] = useState<MarketplaceType>('none');
  const [commissionPercentage, setCommissionPercentage] = useState(0);
  const [fixedFeePerItem, setFixedFeePerItem] = useState(0);

  // Cálculos em tempo real
  const calculations = useMemo(() => {
    // Custo base
    const baseCost = costType === 'lot' ? lotCost : unitCost * lotQuantity;

    // Matéria-prima total
    const rawMaterialsCost = paper + ink + varnish + otherMaterials;

    // Custos operacionais total
    const operationalCost = labor + energy + equipment + rent + otherCosts;

    // Custo de produção
    const productionCost = baseCost + rawMaterialsCost + operationalCost;

    // Lucro desejado (valor fixo tem prioridade)
    const isFixedProfit = fixedProfit > 0;
    const desiredProfit = isFixedProfit
      ? fixedProfit
      : productionCost * (profitMargin / 100);

    // Preço base de venda (sem taxas)
    const baseSellingPrice = productionCost + desiredProfit;

    // Taxas do marketplace
    const marketplaceCommission = baseSellingPrice * (commissionPercentage / 100);
    const marketplaceFixedFees = fixedFeePerItem * lotQuantity;
    const marketplaceTotalFees = marketplaceCommission + marketplaceFixedFees;

    // Preço final de venda (com taxas)
    const finalSellingPrice = baseSellingPrice + marketplaceTotalFees;

    // Preço unitário final
    const unitPrice = lotQuantity > 0 ? finalSellingPrice / lotQuantity : 0;

    // Lucro líquido
    const netProfit = finalSellingPrice - productionCost - marketplaceTotalFees;

    return {
      baseCost,
      rawMaterialsCost,
      operationalCost,
      productionCost,
      isFixedProfit,
      desiredProfit,
      baseSellingPrice,
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
    costType,
    lotCost,
    unitCost,
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
              placeholder="Ex: Tag impressa 4x5cm"
              className="input-currency"
            />
          </div>
        </FormSection>

        {/* Seção 2: Custo Base */}
        <FormSection
          title="Custo base do produto"
          icon={<CircleDollarSign className="w-5 h-5 text-primary" />}
        >
          <div className="col-span-full">
            <RadioGroup
              value={costType}
              onValueChange={(v) => setCostType(v as 'lot' | 'unit')}
              className="flex flex-col sm:flex-row gap-4 mb-4"
            >
              <div className="flex items-center space-x-3 bg-secondary/50 rounded-lg px-4 py-3 flex-1 cursor-pointer hover:bg-secondary/70 transition-colors">
                <RadioGroupItem value="lot" id="lot" />
                <Label htmlFor="lot" className="text-sm text-secondary-foreground cursor-pointer">
                  Custo por lote (ex: material para 500 un = R$ 150)
                </Label>
              </div>
              <div className="flex items-center space-x-3 bg-secondary/50 rounded-lg px-4 py-3 flex-1 cursor-pointer hover:bg-secondary/70 transition-colors">
                <RadioGroupItem value="unit" id="unit" />
                <Label htmlFor="unit" className="text-sm text-secondary-foreground cursor-pointer">
                  Custo por unidade (ex: R$ 0,30 por unidade)
                </Label>
              </div>
            </RadioGroup>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-secondary-foreground">
              Quantidade do lote
            </label>
            <Input
              type="number"
              value={lotQuantity}
              onChange={(e) => setLotQuantity(parseInt(e.target.value) || 0)}
              className="input-currency"
              min={1}
            />
          </div>

          {costType === 'lot' ? (
            <CurrencyInput
              label="Custo total do lote"
              value={lotCost}
              onChange={setLotCost}
            />
          ) : (
            <CurrencyInput
              label="Custo por unidade"
              value={unitCost}
              onChange={setUnitCost}
            />
          )}
        </FormSection>

        {/* Seção 3: Matéria-prima */}
        <FormSection
          title="Matéria-prima"
          icon={<Layers className="w-5 h-5 text-primary" />}
          subtitle="Informe o custo total de materiais para este lote"
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

      {/* Coluna Direita - Resultados + Histórico */}
      <div className="space-y-6">
        <ResultPanel
          productName={productName}
          quantity={lotQuantity}
          baseCost={calculations.baseCost}
          rawMaterialsCost={calculations.rawMaterialsCost}
          operationalCost={calculations.operationalCost}
          productionCost={calculations.productionCost}
          totalCost={calculations.totalCost}
          profitMargin={profitMargin}
          profitValue={calculations.profitValue}
          desiredProfit={calculations.desiredProfit}
          baseSellingPrice={calculations.baseSellingPrice}
          marketplaceCommission={calculations.marketplaceCommission}
          marketplaceFixedFees={calculations.marketplaceFixedFees}
          marketplaceTotalFees={calculations.marketplaceTotalFees}
          finalSellingPrice={calculations.finalSellingPrice}
          sellingPrice={calculations.sellingPrice}
          unitPrice={calculations.unitPrice}
          isFixedProfit={calculations.isFixedProfit}
          hasMarketplace={marketplace !== 'none'}
          costType={costType}
          lotCost={costType === 'lot' ? lotCost : unitCost * lotQuantity}
          paper={paper}
          ink={ink}
          varnish={varnish}
          otherMaterials={otherMaterials}
          labor={labor}
          energy={energy}
          equipment={equipment}
          rent={rent}
          otherCosts={otherCosts}
          fixedProfit={fixedProfit}
        />
        
        {/* Histórico de Cálculos (apenas para usuários logados) */}
        {user && <SavedCalculations />}
      </div>
    </div>
  );
};

export default CostCalculator;
