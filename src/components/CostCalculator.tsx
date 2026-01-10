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
import CalculationHistory from './CalculationHistory';
import SuggestMarginButton from './SuggestMarginButton';
import OnboardingTour from './OnboardingTour';

// Função auxiliar para garantir números válidos
const safeNumber = (value: number): number => {
  if (!Number.isFinite(value) || isNaN(value)) return 0;
  return Math.max(0, value);
};

// Função para arredondar valores monetários (2 casas decimais)
const roundCurrency = (value: number): number => {
  return Math.round(value * 100) / 100;
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

  // Handler para sugestão de margem
  const handleSuggestMargin = useCallback((suggestedMargin: number) => {
    setProfitMargin(suggestedMargin);
    setFixedProfit(0); // Limpar lucro fixo ao usar margem percentual
  }, []);

  // Handler para carregar exemplo
  const handleLoadExample = useCallback(() => {
    setProductName('Sacola de Papel Kraft');
    setLotQuantity(100);
    setPaper(1.50);
    setInk(0.30);
    setVarnish(0);
    setOtherMaterials(0.20);
    setLabor(50);
    setEnergy(15);
    setEquipment(10);
    setRent(25);
    setOtherCosts(10);
    setProfitMargin(35);
    setFixedProfit(0);
    setMarketplace('direct_sale');
    setCommissionPercentage(0);
    setFixedFeePerItem(0);
    setProductPreset('paper_bag');
  }, []);

  // Verificar se custos operacionais estão preenchidos
  const hasOperationalCosts = labor > 0 || energy > 0 || equipment > 0 || rent > 0 || otherCosts > 0;

  // Cálculos em tempo real - CALCULADO POR UNIDADE e multiplicado pela quantidade
  const calculations = useMemo(() => {
    const safeLotQuantity = Math.max(0, Math.floor(safeNumber(lotQuantity)));
    const safePaper = safeNumber(paper);
    const safeInk = safeNumber(ink);
    const safeVarnish = safeNumber(varnish);
    const safeOtherMaterials = safeNumber(otherMaterials);
    const safeLabor = safeNumber(labor);
    const safeEnergy = safeNumber(energy);
    const safeEquipment = safeNumber(equipment);
    const safeRent = safeNumber(rent);
    const safeOtherCosts = safeNumber(otherCosts);
    const safeProfitMargin = Math.min(safeNumber(profitMargin), 1000); // Limite de 1000%
    const safeFixedProfit = safeNumber(fixedProfit);
    const safeCommissionPercentage = Math.min(safeNumber(commissionPercentage), 100);
    const safeFixedFeePerItem = safeNumber(fixedFeePerItem);

    // Se quantidade é zero, retorna valores zerados
    if (safeLotQuantity === 0) {
      return {
        rawMaterialsCost: 0,
        operationalCost: 0,
        operationalTotal: 0,
        productionCost: 0,
        isFixedProfit: safeFixedProfit > 0,
        desiredProfit: 0,
        baseSellingPrice: 0,
        marketplaceCommission: 0,
        marketplaceFixedFees: 0,
        marketplaceTotalFees: 0,
        finalSellingPrice: 0,
        unitPrice: 0,
        unitRawMaterialsCost: 0,
        netProfit: 0,
        totalCost: 0,
        profitValue: 0,
        sellingPrice: 0,
      };
    }

    // Matéria-prima por unidade (valores informados são por unidade)
    const unitRawMaterialsCost = roundCurrency(safePaper + safeInk + safeVarnish + safeOtherMaterials);
    
    // Matéria-prima total = unitário × quantidade
    const rawMaterialsCost = roundCurrency(unitRawMaterialsCost * safeLotQuantity);

    // Custos operacionais total (dividido por quantidade para obter por unidade)
    const operationalTotal = roundCurrency(safeLabor + safeEnergy + safeEquipment + safeRent + safeOtherCosts);
    const unitOperationalCost = roundCurrency(operationalTotal / safeLotQuantity);

    // Custo de produção por unidade (apenas matéria-prima + operacional por unidade)
    const unitProductionCost = roundCurrency(unitRawMaterialsCost + unitOperationalCost);

    // Lucro desejado por unidade (valor fixo tem prioridade)
    const isFixedProfit = safeFixedProfit > 0;
    const unitDesiredProfit = isFixedProfit
      ? roundCurrency(safeFixedProfit / safeLotQuantity)
      : roundCurrency(unitProductionCost * (safeProfitMargin / 100));

    // Preço base de venda por unidade (sem taxas)
    const unitBaseSellingPrice = roundCurrency(unitProductionCost + unitDesiredProfit);

    // Taxas do marketplace por unidade
    const unitMarketplaceCommission = roundCurrency(unitBaseSellingPrice * (safeCommissionPercentage / 100));
    // Taxa fixa é única por venda, não por unidade
    const unitMarketplaceFixedFees = roundCurrency(safeFixedFeePerItem / safeLotQuantity);
    const unitMarketplaceTotalFees = roundCurrency(unitMarketplaceCommission + unitMarketplaceFixedFees);

    // Preço unitário final (com taxas)
    const unitPrice = roundCurrency(unitBaseSellingPrice + unitMarketplaceTotalFees);

    // PREÇO FINAL = Preço unitário × Quantidade
    const finalSellingPrice = roundCurrency(unitPrice * safeLotQuantity);

    // Totais para exibição
    const operationalCost = operationalTotal;
    const productionCost = roundCurrency(unitProductionCost * safeLotQuantity);
    const desiredProfit = roundCurrency(unitDesiredProfit * safeLotQuantity);
    const marketplaceCommission = roundCurrency(unitMarketplaceCommission * safeLotQuantity);
    const marketplaceFixedFees = roundCurrency(unitMarketplaceFixedFees * safeLotQuantity);
    const marketplaceTotalFees = roundCurrency(unitMarketplaceTotalFees * safeLotQuantity);

    // Lucro líquido (pode ser negativo em caso de prejuízo)
    const netProfit = roundCurrency(finalSellingPrice - productionCost - marketplaceTotalFees);

    return {
      rawMaterialsCost,
      operationalCost,
      operationalTotal,
      productionCost,
      isFixedProfit,
      desiredProfit,
      baseSellingPrice: roundCurrency(unitBaseSellingPrice * safeLotQuantity),
      marketplaceCommission,
      marketplaceFixedFees,
      marketplaceTotalFees,
      finalSellingPrice,
      unitPrice,
      unitRawMaterialsCost,
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
        {/* Onboarding e Exemplo */}
        <div className="flex items-center gap-3 mb-2">
          <OnboardingTour onLoadExample={handleLoadExample} />
        </div>

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
              placeholder="Ex: Sacola de papel personalizada"
              className="input-currency"
              maxLength={100}
            />
            <p className="text-xs text-muted-foreground mt-1.5">
              Dê um nome para identificar este cálculo
            </p>
          </div>
        </FormSection>

        {/* Seção 2: Quantidade */}
        <FormSection
          title="Quantidade do Lote"
          icon={<Package className="w-5 h-5 text-primary" />}
        >
          <div className="col-span-full">
            <Input
              type="number"
              value={lotQuantity || ''}
              onChange={handleQuantityChange}
              placeholder="Quantas unidades você vai produzir?"
              className="input-currency"
              min={0}
              max={999999}
            />
            <p className="text-xs text-muted-foreground mt-1.5">
              Total de unidades a serem produzidas neste lote
            </p>
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
          <div className="col-span-full space-y-4">
            {/* Botão de Sugestão de Margem */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Precisa de ajuda?</span>
              <SuggestMarginButton
                productPreset={productPreset}
                quantity={lotQuantity}
                onSuggest={handleSuggestMargin}
                disabled={fixedProfit > 0}
              />
            </div>

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
            helperText="Lucro total desejado para o lote inteiro"
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
          marketplace={marketplace}
          hasOperationalCosts={hasOperationalCosts}
          saveData={{
            paper,
            ink,
            varnish,
            otherMaterials,
            labor,
            energy,
            equipment,
            rent,
            otherCosts,
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
