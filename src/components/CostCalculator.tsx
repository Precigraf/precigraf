import React, { useState, useMemo, useCallback } from 'react';
import { Package, Layers, Percent, Tag, Lock, Edit } from 'lucide-react';
import ProFeatureGate from './ProFeatureGate';
import FormSection from './FormSection';
import CurrencyInput from './CurrencyInput';
import MarginSlider from './MarginSlider';
import ResultPanel from './ResultPanel';
import MarketplaceSection, { MarketplaceType } from './MarketplaceSection';
import ProductPresets, { ProductPresetType, PRODUCT_PRESETS } from './ProductPresets';
import RawMaterialInput from './RawMaterialInput';
import InkCostInput, { InkCostData } from './InkCostInput';
import OtherMaterialsInput, { OtherMaterialItem, calculateOtherMaterialItemCost } from './OtherMaterialsInput';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import CalculationHistory from './CalculationHistory';
import OnboardingTour from './OnboardingTour';
import { useUserPlan } from '@/hooks/useUserPlan';
import UpgradePlanModal from './UpgradePlanModal';
import TrialBanner from './TrialBanner';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { logError } from '@/lib/logger';
import { 
  AdvancedOperationalCosts, 
  OperationalCostsData, 
  DEFAULT_OPERATIONAL_COSTS_DATA,
  calculateAllOperationalCosts 
} from './OperationalCosts';

// Interface para cálculo em edição
interface EditingCalculation {
  id: string;
  mode: 'edit' | 'duplicate';
}

// Função auxiliar para garantir números válidos
const safeNumber = (value: number): number => {
  if (!Number.isFinite(value) || isNaN(value)) return 0;
  return Math.max(0, value);
};

// Função para arredondar valores monetários (2 casas decimais)
const roundCurrency = (value: number): number => {
  return Math.round(value * 100) / 100;
};

// Interface para dados de matéria-prima
interface RawMaterialData {
  packageValue: number;
  packageQuantity: number;
  quantityUsed: number;
}

// Função para calcular custo unitário de matéria-prima
const calculateRawMaterialCost = (data: RawMaterialData): number => {
  const safePackageQuantity = data.packageQuantity > 0 ? data.packageQuantity : 1;
  const safeQuantityUsed = data.quantityUsed > 0 ? data.quantityUsed : 1;
  const unitValue = data.packageValue / safePackageQuantity;
  return roundCurrency(unitValue * safeQuantityUsed);
};

const CostCalculator: React.FC = () => {
  const navigate = useNavigate();
  const { 
    plan, 
    planStatus,
    calculationsCount, 
    maxCalculations, 
    loading: planLoading,
    isTrialActive,
    isTrialExpired,
    trialRemainingHours,
    canCreateCalculation,
    canSaveCalculation,
  } = useUserPlan();
  const isPro = plan === 'pro';
  const isBlocked = !canCreateCalculation || (!isPro && calculationsCount >= maxCalculations);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  // Estado de edição
  const [editingCalculation, setEditingCalculation] = useState<EditingCalculation | null>(null);
  const [duplicatedFrom, setDuplicatedFrom] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  // Estado do formulário
  const [productName, setProductName] = useState('');
  const [lotQuantity, setLotQuantity] = useState(0);
  const [historyRefreshTrigger, setHistoryRefreshTrigger] = useState(0);
  const [productPreset, setProductPreset] = useState<ProductPresetType>('custom');

  // Matéria-prima - Nova estrutura com pacote/quantidade/uso
  const [paperData, setPaperData] = useState<RawMaterialData>({ packageValue: 0, packageQuantity: 0, quantityUsed: 1 });
  const [handleData, setHandleData] = useState<RawMaterialData>({ packageValue: 0, packageQuantity: 0, quantityUsed: 1 });
  const [packagingData, setPackagingData] = useState<RawMaterialData>({ packageValue: 0, packageQuantity: 0, quantityUsed: 1 });
  const [otherMaterialsItems, setOtherMaterialsItems] = useState<OtherMaterialItem[]>([]);
  
  // Tinta - Nova estrutura avançada com cálculo por ML
  const [inkData, setInkData] = useState<InkCostData>({ 
    totalValue: 0, 
    bottleCount: 0, 
    mlPerBottle: 0, 
    mlPerPrint: 0, 
    printQuantity: 0 
  });

  // Custos operacionais avançados com rateio por tempo
  const [operationalCostsData, setOperationalCostsData] = useState<OperationalCostsData>(DEFAULT_OPERATIONAL_COSTS_DATA);

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
      setLotQuantity(Math.min(parsed, 999999));
    }
  };

  // Handler para preset de produto
  const handlePresetChange = (preset: ProductPresetType) => {
    setProductPreset(preset);
    if (preset !== 'custom') {
      const config = PRODUCT_PRESETS[preset];
      // Aplicar valores do preset como custo unitário direto (para compatibilidade)
      setPaperData({ packageValue: config.paper, packageQuantity: 1, quantityUsed: 1 });
      setHandleData({ packageValue: config.ink, packageQuantity: 1, quantityUsed: 1 });
      // Para tinta no preset, aplicar como valor simples (1 frasco, 1ml, 1 impressão = custo direto)
      setInkData({ totalValue: config.varnish, bottleCount: 1, mlPerBottle: 1, mlPerPrint: 1, printQuantity: 1 });
      setOtherMaterialsItems([{ id: 'preset-other', name: 'Outros', packageValue: config.otherMaterials, packageQuantity: 1, quantityUsed: 1 }]);
      if (config.defaultQuantity > 0 && lotQuantity === 0) {
        setLotQuantity(config.defaultQuantity);
      }
      if (!productName) {
        setProductName(config.label);
      }
    }
  };

  const handleCalculationSaved = useCallback(() => {
    setHistoryRefreshTrigger(prev => prev + 1);
    // Limpar modo de edição após salvar
    if (editingCalculation) {
      const wasEdit = editingCalculation.mode === 'edit';
      setEditingCalculation(null);
      setDuplicatedFrom(null);
      toast.success(wasEdit ? 'Cálculo atualizado!' : 'Cálculo salvo!');
    }
  }, [editingCalculation]);

  // Handler para edição de cálculo
  const handleEditCalculation = useCallback((calculation: {
    id: string;
    product_name: string;
    lot_quantity: number;
    paper_cost: number;
    ink_cost: number;
    varnish_cost: number;
    other_material_cost: number;
    labor_cost: number;
    energy_cost: number;
    equipment_cost: number;
    rent_cost: number;
    other_operational_cost: number;
    margin_percentage: number;
    fixed_profit: number | null;
  }, mode: 'edit' | 'duplicate') => {
    // Carregar dados do cálculo no formulário
    setProductName(calculation.product_name);
    setLotQuantity(calculation.lot_quantity);
    
    // Carregar custos de matéria-prima (como valores diretos para simplicidade)
    setPaperData({ packageValue: calculation.paper_cost, packageQuantity: 1, quantityUsed: 1 });
    setHandleData({ packageValue: calculation.ink_cost, packageQuantity: 1, quantityUsed: 1 });
    setInkData({ totalValue: calculation.varnish_cost, bottleCount: 1, mlPerBottle: 1, mlPerPrint: 1, printQuantity: 1 });
    setPackagingData({ packageValue: 0, packageQuantity: 1, quantityUsed: 1 });
    setOtherMaterialsItems(calculation.other_material_cost > 0 ? [{ id: 'edit-other', name: 'Outros insumos', packageValue: calculation.other_material_cost, packageQuantity: 1, quantityUsed: 1 }] : []);
    
    // Margem e lucro
    setProfitMargin(calculation.margin_percentage);
    setFixedProfit(calculation.fixed_profit || 0);
    
    // Limpar marketplace
    setMarketplace('none');
    setCommissionPercentage(0);
    setFixedFeePerItem(0);
    
    // Para duplicação: armazenar ID original e NÃO definir ID de edição
    // O cálculo será tratado como NOVO até o momento do save
    if (mode === 'duplicate') {
      setDuplicatedFrom(calculation.id);
      setEditingCalculation({ id: '', mode: 'duplicate' }); // ID vazio = novo registro
    } else {
      setDuplicatedFrom(null);
      setEditingCalculation({ id: calculation.id, mode });
    }
    
    // Scroll para o topo
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    toast.info(mode === 'edit' ? 'Modo edição ativado' : 'Editando cópia do cálculo - salve para criar o novo registro');
  }, []);

  // Handler para cancelar edição
  const handleCancelEdit = useCallback(() => {
    setEditingCalculation(null);
    setDuplicatedFrom(null);
    // Limpar formulário
    setProductName('');
    setLotQuantity(0);
    setPaperData({ packageValue: 0, packageQuantity: 0, quantityUsed: 1 });
    setHandleData({ packageValue: 0, packageQuantity: 0, quantityUsed: 1 });
    setInkData({ totalValue: 0, bottleCount: 0, mlPerBottle: 0, mlPerPrint: 0, printQuantity: 0 });
    setPackagingData({ packageValue: 0, packageQuantity: 0, quantityUsed: 1 });
    setOtherMaterialsItems([]);
    setOperationalCostsData(DEFAULT_OPERATIONAL_COSTS_DATA);
    setProfitMargin(0);
    setFixedProfit(0);
    setMarketplace('none');
    setCommissionPercentage(0);
    setFixedFeePerItem(0);
    setProductPreset('custom');
    toast.info('Edição cancelada');
  }, []);

  // Handler para sugestão de margem
  const handleSuggestMargin = useCallback((suggestedMargin: number) => {
    if (isBlocked) {
      setShowUpgradeModal(true);
      return;
    }
    setProfitMargin(suggestedMargin);
    setFixedProfit(0);
  }, [isBlocked]);

  // Handler para bloqueio de campos quando limite atingido
  const handleBlockedClick = useCallback(() => {
    if (isBlocked) {
      setShowUpgradeModal(true);
    }
  }, [isBlocked]);

  // Handler para carregar exemplo
  const handleLoadExample = useCallback(() => {
    setProductName('Sacola de Papel Kraft');
    setLotQuantity(100);
    // Exemplo: Papel - Pacote de R$70 com 200 folhas, usa 2 folhas por produto
    setPaperData({ packageValue: 70, packageQuantity: 200, quantityUsed: 2 });
    // Alça - Pacote de R$40 com 100 alças, usa 2 alças por produto
    setHandleData({ packageValue: 40, packageQuantity: 100, quantityUsed: 2 });
    // Tinta - R$145 por 4 frascos de 250ml, 0.8ml por impressão, 100 impressões
    setInkData({ totalValue: 145, bottleCount: 4, mlPerBottle: 250, mlPerPrint: 0.8, printQuantity: 100 });
    // Embalagem - Não usa
    setPackagingData({ packageValue: 0, packageQuantity: 0, quantityUsed: 1 });
    // Outros materiais - Cola/acabamento R$20 para 100 unidades
    setOtherMaterialsItems([{ id: 'example-1', name: 'Cola especial', packageValue: 15, packageQuantity: 100, quantityUsed: 1 }, { id: 'example-2', name: 'Acabamento', packageValue: 5, packageQuantity: 100, quantityUsed: 1 }]);
    // Custos operacionais avançados - Exemplo
    setOperationalCostsData({
      productionTimeMinutes: 120,
      equipment: { equipmentValue: 0, usefulLifeYears: 5, usagePercentage: 100 },
      equipments: [{ id: 'ex-equip-1', name: 'Impressora Epson L4260', equipmentValue: 5000, usefulLifeYears: 5, usagePercentage: 80 }],
      electricity: { monthlyBill: 300, usagePercentage: 50 },
      internet: { monthlyBill: 100, usagePercentage: 20 },
      labor: { monthlyWithdrawal: 3000 },
      otherFixedCosts: [],
    });
    setProfitMargin(35);
    setFixedProfit(0);
    setMarketplace('none');
    setCommissionPercentage(0);
    setFixedFeePerItem(0);
    setProductPreset('paper_bag');
  }, []);

  // Calcular custos operacionais avançados
  const calculatedOperationalCosts = useMemo(() => 
    calculateAllOperationalCosts(operationalCostsData), 
    [operationalCostsData]
  );

  // Verificar se custos operacionais estão preenchidos
  const hasOperationalCosts = calculatedOperationalCosts.totalAppliedCost > 0;

  // Calcular custo de tinta (baseado em ML)
  const inkCost = useMemo(() => {
    const safeBottleCount = inkData.bottleCount > 0 ? inkData.bottleCount : 1;
    const safeMlPerBottle = inkData.mlPerBottle > 0 ? inkData.mlPerBottle : 1;
    const safeMlPerPrint = inkData.mlPerPrint >= 0 ? inkData.mlPerPrint : 0;
    const safePrintQuantity = inkData.printQuantity >= 0 ? inkData.printQuantity : 0;

    const totalMl = safeBottleCount * safeMlPerBottle;
    const valuePerMl = inkData.totalValue / totalMl;
    const totalConsumption = safeMlPerPrint * safePrintQuantity;
    const finalCost = totalConsumption * valuePerMl;

    return roundCurrency(finalCost);
  }, [inkData]);

  // Calcular custo total de outros insumos
  const otherMaterialsTotalCost = useMemo(() => {
    return otherMaterialsItems.reduce((sum, item) => sum + calculateOtherMaterialItemCost(item), 0);
  }, [otherMaterialsItems]);

  // Calcular custos de matéria-prima por unidade
  const rawMaterialCosts = useMemo(() => {
    return {
      paper: calculateRawMaterialCost(paperData),
      handle: calculateRawMaterialCost(handleData),
      ink: inkCost,
      packaging: calculateRawMaterialCost(packagingData),
      other: roundCurrency(otherMaterialsTotalCost),
    };
  }, [paperData, handleData, inkCost, packagingData, otherMaterialsTotalCost]);

  // Cálculos em tempo real
  const calculations = useMemo(() => {
    const safeLotQuantity = Math.max(0, Math.floor(safeNumber(lotQuantity)));
    const safeProfitMargin = Math.min(safeNumber(profitMargin), 1000);
    const safeFixedProfit = safeNumber(fixedProfit);
    const safeCommissionPercentage = Math.min(safeNumber(commissionPercentage), 100);
    const safeFixedFeePerItem = safeNumber(fixedFeePerItem);
    
    // Custo operacional total vem do novo sistema avançado
    const operationalTotal = calculatedOperationalCosts.totalAppliedCost;

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

    // Matéria-prima por unidade (soma dos custos calculados)
    const unitRawMaterialsCost = roundCurrency(
      rawMaterialCosts.paper + 
      rawMaterialCosts.handle + 
      rawMaterialCosts.ink + 
      rawMaterialCosts.packaging + 
      rawMaterialCosts.other
    );
    
    // Matéria-prima total = unitário × quantidade
    const rawMaterialsCost = roundCurrency(unitRawMaterialsCost * safeLotQuantity);

    // Custos operacionais - usar o total calculado pelo sistema avançado
    const unitOperationalCost = safeLotQuantity > 0 ? roundCurrency(operationalTotal / safeLotQuantity) : 0;

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
      totalCost: productionCost,
      profitValue: desiredProfit,
      sellingPrice: finalSellingPrice,
    };
  }, [
    lotQuantity,
    rawMaterialCosts,
    calculatedOperationalCosts.totalAppliedCost,
    profitMargin,
    fixedProfit,
    commissionPercentage,
    fixedFeePerItem,
  ]);

  // Valores para salvar (compatibilidade com banco de dados)
  // Mapeando os novos custos operacionais para os campos existentes
  const saveDataValues = useMemo(() => ({
    paper: rawMaterialCosts.paper,
    ink: rawMaterialCosts.handle,
    varnish: rawMaterialCosts.ink,
    otherMaterials: rawMaterialCosts.packaging + rawMaterialCosts.other,
    labor: calculatedOperationalCosts.labor.appliedCost,
    energy: calculatedOperationalCosts.electricity.appliedCost,
    equipment: calculatedOperationalCosts.equipment.appliedCost + calculatedOperationalCosts.equipments.reduce((sum, e) => sum + e.appliedCost, 0),
    rent: calculatedOperationalCosts.internet.appliedCost,
    otherCosts: calculatedOperationalCosts.otherFixedCosts.reduce((sum, cost) => sum + cost.appliedCost, 0),
  }), [rawMaterialCosts, calculatedOperationalCosts]);

  return (
    <>
      {/* Overlay de bloqueio quando trial expirado ou limite atingido */}
      {isBlocked && (
        <div 
          className="fixed inset-0 z-40 pointer-events-none"
          style={{ background: 'transparent' }}
        />
      )}

      <div className={`grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-6 ${isBlocked ? 'pointer-events-none opacity-60' : ''}`}>
        {/* Banner de Trial */}
        <div className="lg:col-span-2 pointer-events-auto relative z-50">
          <TrialBanner
            isTrialActive={isTrialActive}
            isTrialExpired={isTrialExpired}
            trialRemainingHours={trialRemainingHours}
            onUpgrade={() => {
              setShowUpgradeModal(false);
              navigate('/upgrade');
            }}
          />
        </div>

        {/* Banner de bloqueio quando limite atingido (durante trial) */}
        {!canCreateCalculation && !isTrialExpired && (
          <div className="lg:col-span-2 w-full bg-destructive/10 border border-destructive/30 rounded-xl p-4 pointer-events-auto relative z-50">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
              <div className="flex items-start gap-3 flex-1">
                <Lock className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                <div className="text-left flex-1">
                  <p className="text-base font-semibold text-destructive">Sistema bloqueado</p>
                  <p className="text-sm text-muted-foreground leading-snug">
                    Você atingiu o limite de {maxCalculations} cálculos do plano gratuito. Faça upgrade para continuar.
                  </p>
                </div>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowUpgradeModal(true);
                }}
                className="w-full sm:w-auto px-4 py-3 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors pointer-events-auto cursor-pointer z-50 relative"
              >
                Fazer upgrade
              </button>
            </div>
          </div>
        )}

        {/* Coluna Esquerda - Formulário */}
        <div className="space-y-6">
          {/* Banner de Modo Edição */}
          {editingCalculation && (
            <div className="p-4 bg-warning/10 border border-warning/30 rounded-xl flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-warning/20 flex items-center justify-center">
                  <Edit className="w-5 h-5 text-warning" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-warning text-warning-foreground">
                      Modo edição
                    </Badge>
                    {editingCalculation.mode === 'duplicate' && (
                      <Badge variant="outline" className="text-xs">Cópia</Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {editingCalculation.mode === 'edit' 
                      ? 'Alterações serão salvas no cálculo original'
                      : 'Editando cópia do cálculo'}
                  </p>
                </div>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleCancelEdit}
                className="shrink-0"
              >
                Cancelar
              </Button>
            </div>
          )}

          {/* Onboarding e Exemplo */}
          <div className="flex items-center gap-3 mb-2">
            <OnboardingTour onLoadExample={handleLoadExample} isFreePlan={!isPro} />
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

          {/* Seção 3: Matéria-prima (NOVA LÓGICA) */}
          <FormSection
            title="Matéria-prima"
            icon={<Layers className="w-5 h-5 text-primary" />}
            subtitle="Informe o valor do pacote, quantidade no pacote e quantas unidades usa por produto"
          >
            <RawMaterialInput
              label="Papel"
              packageValue={paperData.packageValue}
              packageQuantity={paperData.packageQuantity}
              quantityUsed={paperData.quantityUsed}
              onPackageValueChange={(v) => setPaperData(prev => ({ ...prev, packageValue: v }))}
              onPackageQuantityChange={(v) => setPaperData(prev => ({ ...prev, packageQuantity: v }))}
              onQuantityUsedChange={(v) => setPaperData(prev => ({ ...prev, quantityUsed: v }))}
              tooltip="Custo do papel/substrato. Informe o valor do pacote, quantas unidades vêm no pacote, e quantas você usa por produto."
            />
            <RawMaterialInput
              label="Alça"
              packageValue={handleData.packageValue}
              packageQuantity={handleData.packageQuantity}
              quantityUsed={handleData.quantityUsed}
              onPackageValueChange={(v) => setHandleData(prev => ({ ...prev, packageValue: v }))}
              onPackageQuantityChange={(v) => setHandleData(prev => ({ ...prev, packageQuantity: v }))}
              onQuantityUsedChange={(v) => setHandleData(prev => ({ ...prev, quantityUsed: v }))}
              tooltip="Custo de alças, cordões ou acabamentos. Informe o valor do pacote, quantas unidades vêm, e quantas usa por produto."
            />
            <RawMaterialInput
              label="Embalagem"
              packageValue={packagingData.packageValue}
              packageQuantity={packagingData.packageQuantity}
              quantityUsed={packagingData.quantityUsed}
              onPackageValueChange={(v) => setPackagingData(prev => ({ ...prev, packageValue: v }))}
              onPackageQuantityChange={(v) => setPackagingData(prev => ({ ...prev, packageQuantity: v }))}
              onQuantityUsedChange={(v) => setPackagingData(prev => ({ ...prev, quantityUsed: v }))}
              tooltip="Custo de embalagens adicionais para envio ou apresentação do produto."
            />
            <InkCostInput
              data={inkData}
              onDataChange={setInkData}
              tooltip="Custo de tinta baseado em volume (ml). Informe o valor pago, quantidade de frascos, ml por frasco, e consumo por impressão."
            />
            <OtherMaterialsInput
              items={otherMaterialsItems}
              onItemsChange={setOtherMaterialsItems}
            />
          </FormSection>

          {/* Seção 4: Custos Operacionais Avançados (PRO) */}
          <ProFeatureGate
            isPro={isPro}
            onUpgrade={() => setShowUpgradeModal(true)}
            featureName="Custos Operacionais"
            message="Disponível apenas no Plano Pro"
          >
            <AdvancedOperationalCosts
              data={operationalCostsData}
              onDataChange={setOperationalCostsData}
              disabled={false}
            />
          </ProFeatureGate>

          {/* Seção 5: Margem de Lucro */}
          <FormSection
            title="Margem de Lucro"
            icon={<Percent className="w-5 h-5 text-primary" />}
          >
            <div className="col-span-full space-y-4">
              <MarginSlider
                value={profitMargin}
                onChange={setProfitMargin}
                disabled={fixedProfit > 0}
              />
              <p className="text-xs text-muted-foreground">
                Ex: 30% conforme seu objetivo de lucro
              </p>
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
            isPro={isPro}
            onShowUpgrade={() => setShowUpgradeModal(true)}
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
            unitRawMaterialsCost={calculations.unitRawMaterialsCost}
            operationalTotal={calculations.operationalTotal}
            fixedProfit={fixedProfit}
            commissionPercentage={commissionPercentage}
            fixedFeePerItem={fixedFeePerItem}
            marketplace={marketplace}
            hasOperationalCosts={hasOperationalCosts}
            saveData={saveDataValues}
            onSaved={handleCalculationSaved}
            onApplySuggestedMargin={handleSuggestMargin}
            isBlocked={isBlocked}
            isPro={isPro}
            onShowUpgrade={() => setShowUpgradeModal(true)}
            editingCalculation={editingCalculation}
            duplicatedFrom={duplicatedFrom}
          />
        </div>

        {/* Histórico de Cálculos - Full Width */}
        <div className="lg:col-span-2">
          <CalculationHistory 
            refreshTrigger={historyRefreshTrigger} 
            onEditCalculation={handleEditCalculation}
          />
        </div>
      </div>

      <UpgradePlanModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        onUpgrade={() => {
          setShowUpgradeModal(false);
          navigate('/upgrade');
        }}
        message="Faça o upgrade para continuar utilizando o sistema."
      />
    </>
  );
};

export default CostCalculator;
