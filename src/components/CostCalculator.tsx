import React, { useState, useMemo, useCallback } from 'react';
import { Package, Layers, Factory, Percent, Tag } from 'lucide-react';
import FormSection from './FormSection';
import CurrencyInput from './CurrencyInput';
import MarginSlider from './MarginSlider';
import ResultPanel from './ResultPanel';
import MarketplaceSection, { MarketplaceType } from './MarketplaceSection';
import ProductPresets, { ProductPresetType, PRODUCT_PRESETS } from './ProductPresets';
import TooltipLabel from './TooltipLabel';
import { Input } from '@/components/ui/input';
import SaveCalculationButton from './SaveCalculationButton';
import CalculationHistory from './CalculationHistory';
// Função auxiliar para garantir números válidos
const safeNumber = (value: number): number => {
  if (!Number.isFinite(value) || isNaN(value)) return 0;
  return Math.max(0, value);
};

const CostCalculator: React.FC = () => {
  // Estado do formulário
  const [productName, setProductName] = useState('');
  const [lotQuantity, setLotQuantity] = useState(0);
  const [historyRefreshTrigger, setHistoryRefreshTrigger] = useState(0);
  const [productPreset, setProductPreset] = useState<ProductPresetType>('custom');

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

  // Handler para quantidade com validação
  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === '') {
      setLotQuantity(0);
      return;
    }
    const parsed = parseInt(value, 10);
    if (!isNaN(parsed) && parsed >= 0) {
      setLotQuantity(Math.min(parsed, 999999)); // Limite máximo
    }
  };

  // Handler para preset de produto
  const handlePresetChange = (preset: ProductPresetType) => {
    setProductPreset(preset);
    if (preset !== 'custom') {
      const config = PRODUCT_PRESETS[preset];
      setPaper(config.paper);
      setInk(config.ink);
      setVarnish(config.varnish);
      setOtherMaterials(config.otherMaterials);
      if (config.defaultQuantity > 0 && lotQuantity === 0) {
        setLotQuantity(config.defaultQuantity);
      }
      // Definir nome do produto baseado no preset
      if (!productName) {
        setProductName(config.label);
      }
    }
  };

  const handleCalculationSaved = useCallback(() => {
    setHistoryRefreshTrigger(prev => prev + 1);
  }, []);

  // Cálculos em tempo real - CALCULADO POR UNIDADE e multiplicado pela quantidade
  const calculations = useMemo(() => {
    const safeLotQuantity = safeNumber(lotQuantity);
    const safePaper = safeNumber(paper);
    const safeInk = safeNumber(ink);
    const safeVarnish = safeNumber(varnish);
    const safeOtherMaterials = safeNumber(otherMaterials);
    const safeLabor = safeNumber(labor);
    const safeEnergy = safeNumber(energy);
    const safeEquipment = safeNumber(equipment);
    const safeRent = safeNumber(rent);
    const safeOtherCosts = safeNumber(otherCosts);
    const safeProfitMargin = safeNumber(profitMargin);
    const safeFixedProfit = safeNumber(fixedProfit);
    const safeCommissionPercentage = Math.min(safeNumber(commissionPercentage), 100);
    const safeFixedFeePerItem = safeNumber(fixedFeePerItem);

    // Matéria-prima por unidade (valores informados são por unidade)
    const unitRawMaterialsCost = safePaper + safeInk + safeVarnish + safeOtherMaterials;
    
    // Matéria-prima total = unitário × quantidade
    const rawMaterialsCost = unitRawMaterialsCost * safeLotQuantity;

    // Custos operacionais total (dividido por quantidade para obter por unidade)
    const operationalTotal = safeLabor + safeEnergy + safeEquipment + safeRent + safeOtherCosts;
    const unitOperationalCost = safeLotQuantity > 0 ? operationalTotal / safeLotQuantity : 0;

    // Custo de produção por unidade (apenas matéria-prima + operacional por unidade)
    const unitProductionCost = unitRawMaterialsCost + unitOperationalCost;

    // Lucro desejado por unidade (valor fixo tem prioridade)
    const isFixedProfit = safeFixedProfit > 0;
    const unitDesiredProfit = isFixedProfit
      ? (safeLotQuantity > 0 ? safeFixedProfit / safeLotQuantity : 0)
      : unitProductionCost * (safeProfitMargin / 100);

    // Preço base de venda por unidade (sem taxas)
    const unitBaseSellingPrice = unitProductionCost + unitDesiredProfit;

    // Taxas do marketplace por unidade
    const unitMarketplaceCommission = unitBaseSellingPrice * (safeCommissionPercentage / 100);
    // Taxa fixa é única por venda, não por unidade
    const unitMarketplaceFixedFees = safeLotQuantity > 0 ? safeFixedFeePerItem / safeLotQuantity : 0;
    const unitMarketplaceTotalFees = unitMarketplaceCommission + unitMarketplaceFixedFees;

    // Preço unitário final (com taxas)
    const unitPrice = unitBaseSellingPrice + unitMarketplaceTotalFees;

    // PREÇO FINAL = Preço unitário × Quantidade
    const finalSellingPrice = unitPrice * safeLotQuantity;

    // Totais para exibição
    const operationalCost = operationalTotal;
    const productionCost = unitProductionCost * safeLotQuantity;
    const desiredProfit = unitDesiredProfit * safeLotQuantity;
    const marketplaceCommission = unitMarketplaceCommission * safeLotQuantity;
    const marketplaceFixedFees = unitMarketplaceFixedFees * safeLotQuantity;
    const marketplaceTotalFees = unitMarketplaceTotalFees * safeLotQuantity;

    // Lucro líquido
    const netProfit = finalSellingPrice - productionCost - marketplaceTotalFees;

    return {
      rawMaterialsCost: safeNumber(rawMaterialsCost),
      operationalCost: safeNumber(operationalCost),
      operationalTotal: safeNumber(operationalTotal),
      productionCost: safeNumber(productionCost),
      isFixedProfit,
      desiredProfit: safeNumber(desiredProfit),
      baseSellingPrice: safeNumber(unitBaseSellingPrice * safeLotQuantity),
      marketplaceCommission: safeNumber(marketplaceCommission),
      marketplaceFixedFees: safeNumber(marketplaceFixedFees),
      marketplaceTotalFees: safeNumber(marketplaceTotalFees),
      finalSellingPrice: safeNumber(finalSellingPrice),
      unitPrice: safeNumber(unitPrice),
      unitRawMaterialsCost: safeNumber(unitRawMaterialsCost),
      netProfit: safeNumber(netProfit),
      // Legacy compatibility
      totalCost: safeNumber(productionCost),
      profitValue: safeNumber(desiredProfit),
      sellingPrice: safeNumber(finalSellingPrice),
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
              maxLength={100}
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
              onChange={handleQuantityChange}
              placeholder="0"
              className="input-currency"
              min={0}
              max={999999}
            />
            {lotQuantity === 0 && (
              <p className="text-xs text-warning mt-1.5">
                Informe a quantidade para calcular os resultados
              </p>
            )}
          </div>
        </FormSection>

        {/* Seção 3: Matéria-prima (valor por unidade) */}
        <FormSection
          title="Matéria-prima (valor por unidade)"
          icon={<Layers className="w-5 h-5 text-primary" />}
          subtitle="Informe o custo de materiais por unidade"
        >
          <CurrencyInput 
            label="Papel" 
            value={paper} 
            onChange={setPaper}
            tooltip="Custo do papel/substrato por unidade produzida."
          />
          <CurrencyInput 
            label="Alça" 
            value={ink} 
            onChange={setInk}
            tooltip="Custo de alças, cordões ou acabamentos por unidade."
          />
          <CurrencyInput 
            label="Tinta" 
            value={varnish} 
            onChange={setVarnish}
            tooltip="Custo de tinta, verniz ou laminação por unidade."
          />
          <CurrencyInput 
            label="Outros" 
            value={otherMaterials} 
            onChange={setOtherMaterials}
            tooltip="Outros materiais como cola, fita, embalagem, etc."
          />
        </FormSection>

        {/* Seção 4: Custos Operacionais */}
        <FormSection
          title="Custos Operacionais"
          icon={<Factory className="w-5 h-5 text-primary" />}
          subtitle="Informe o custo total de operação para este lote"
        >
          <CurrencyInput 
            label="Mão de obra" 
            value={labor} 
            onChange={setLabor}
            tooltip="Custo de trabalho humano para produzir este lote. Inclua salários, encargos e benefícios proporcionais."
          />
          <CurrencyInput 
            label="Energia" 
            value={energy} 
            onChange={setEnergy}
            tooltip="Custo de energia elétrica consumida na produção deste lote."
          />
          <CurrencyInput 
            label="Equipamentos" 
            value={equipment} 
            onChange={setEquipment}
            tooltip="Depreciação de máquinas, manutenção preventiva e corretiva proporcionais a este lote."
          />
          <CurrencyInput 
            label="Espaço" 
            value={rent} 
            onChange={setRent}
            tooltip="Aluguel, água, internet, IPTU e outros custos fixos do espaço, proporcionais a este lote."
          />
          <CurrencyInput
            label="Outros custos"
            value={otherCosts}
            onChange={setOtherCosts}
            fullWidth
            tooltip="Taxas, impostos, frete de insumos, embalagem de envio, etc."
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
            helperText="Lucro total desejado (não por unidade)"
            fullWidth
            tooltip="Defina um valor de lucro fixo em R$ ao invés de percentual. Útil quando você já sabe quanto quer ganhar no lote."
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
          hasMarketplace={marketplace !== 'none' && marketplace !== 'direct_sale'}
          unitRawMaterialsCost={calculations.unitRawMaterialsCost}
          operationalTotal={calculations.operationalTotal}
          fixedProfit={fixedProfit}
          commissionPercentage={commissionPercentage}
          fixedFeePerItem={fixedFeePerItem}
        />

        {/* Botão Salvar Cálculo */}
        <SaveCalculationButton
          data={{
            productName,
            quantity: lotQuantity,
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
            productionCost: calculations.productionCost,
            desiredProfit: calculations.desiredProfit,
            finalSellingPrice: calculations.finalSellingPrice,
            unitPrice: calculations.unitPrice,
          }}
          onSaved={handleCalculationSaved}
        />
      </div>

      {/* Histórico de Cálculos - Full Width */}
      <div className="lg:col-span-2">
        <CalculationHistory refreshTrigger={historyRefreshTrigger} />
      </div>
    </div>
  );
};

export default CostCalculator;
