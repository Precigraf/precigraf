import { useState, useMemo, useCallback } from 'react';
import { InkCostData } from '@/components/InkCostInput';
import { OtherMaterialItem, calculateOtherMaterialItemCost } from '@/components/OtherMaterialsInput';
import { MarketplaceType, ShopeeAccountType, calcShopeeCost } from '@/components/MarketplaceSection';
import { ProductPresetType, PRODUCT_PRESETS } from '@/components/ProductPresets';
import {
  OperationalCostsData,
  DEFAULT_OPERATIONAL_COSTS_DATA,
  calculateAllOperationalCosts,
} from '@/components/OperationalCosts';

// ─── helpers ──────────────────────────────────────────────────────────────────

interface RawMaterialData {
  packageValue: number;
  packageQuantity: number;
  quantityUsed: number;
}

const safeNumber = (v: number) =>
  !Number.isFinite(v) || isNaN(v) ? 0 : Math.max(0, v);

// Sem arredondamento — valores exatos

const exact = (v: number) => v;

const calcRawMaterial = (d: RawMaterialData) => {
  const qty = d.packageQuantity > 0 ? d.packageQuantity : 1;
  const used = d.quantityUsed > 0 ? d.quantityUsed : 1;
  return (d.packageValue / qty) * used;
};

// ─── estado inicial ────────────────────────────────────────────────────────────

const EMPTY_RAW: RawMaterialData = { packageValue: 0, packageQuantity: 0, quantityUsed: 1 };
const EMPTY_INK: InkCostData = { totalValue: 0, bottleCount: 0, mlPerBottle: 0, mlPerPrint: 0, printQuantity: 0 };

// ─── o hook ───────────────────────────────────────────────────────────────────

export function useCalculator() {
  // form
  const [productName, setProductName]   = useState('');
  const [lotQuantity, setLotQuantity]   = useState(0);
  const [productPreset, setProductPreset] = useState<ProductPresetType>('custom');

  // matéria-prima
  const [paperData, setPaperData]         = useState<RawMaterialData>(EMPTY_RAW);
  const [handleData, setHandleData]       = useState<RawMaterialData>(EMPTY_RAW);
  const [packagingData, setPackagingData] = useState<RawMaterialData>(EMPTY_RAW);
  const [inkData, setInkData]             = useState<InkCostData>(EMPTY_INK);
  const [otherMaterialsItems, setOtherMaterialsItems] = useState<OtherMaterialItem[]>([]);

  // operacional
  const [operationalCostsData, setOperationalCostsData] =
    useState<OperationalCostsData>(DEFAULT_OPERATIONAL_COSTS_DATA);

  // margem
  const [profitMargin, setProfitMargin] = useState(0);
  const [fixedProfit, setFixedProfit]   = useState(0);

  // marketplace
  const [marketplace, setMarketplace]               = useState<MarketplaceType>('none');
  const [shopeeAccountType, setShopeeAccountType]   = useState<ShopeeAccountType>('cnpj');
  const [commissionPercentage, setCommissionPercentage] = useState(0);
  const [fixedFeePerItem, setFixedFeePerItem]         = useState(0);

  // ── derivados ────────────────────────────────────────────────────────────────

  const inkCost = useMemo(() => {
    const bottles  = inkData.bottleCount  > 0 ? inkData.bottleCount  : 1;
    const mlBottle = inkData.mlPerBottle  > 0 ? inkData.mlPerBottle  : 1;
    const mlPrint  = inkData.mlPerPrint  >= 0 ? inkData.mlPerPrint   : 0;
    const prints   = inkData.printQuantity >= 0 ? inkData.printQuantity : 0;
    return (inkData.totalValue / (bottles * mlBottle)) * mlPrint * prints;
  }, [inkData]);

  const rawMaterialCosts = useMemo(() => ({
    paper:    calcRawMaterial(paperData),
    handle:   calcRawMaterial(handleData),
    ink:      inkCost,
    packaging: calcRawMaterial(packagingData),
    other:    otherMaterialsItems.reduce((s, i) => s + calculateOtherMaterialItemCost(i), 0),
  }), [paperData, handleData, inkCost, packagingData, otherMaterialsItems]);

  const calculatedOperationalCosts = useMemo(
    () => calculateAllOperationalCosts(operationalCostsData),
    [operationalCostsData]
  );

  const calculations = useMemo(() => {
    const qty        = Math.max(0, Math.floor(safeNumber(lotQuantity)));
    const margin     = Math.min(safeNumber(profitMargin), 1000);
    const fixed      = safeNumber(fixedProfit);
    const commission = Math.min(safeNumber(commissionPercentage), 100);
    const fixedFee   = safeNumber(fixedFeePerItem);
    const opTotal    = calculatedOperationalCosts.totalAppliedCost;

    const zero = {
      rawMaterialsCost: 0, operationalCost: 0, operationalTotal: 0, productionCost: 0,
      isFixedProfit: fixed > 0, desiredProfit: 0, baseSellingPrice: 0,
      finalSellingPrice: 0, unitPrice: 0, unitRawMaterialsCost: 0, netProfit: 0,
      marketplaceCommission: 0, marketplaceFixedFees: 0, marketplaceTotalFees: 0,
      totalCost: 0, profitValue: 0, sellingPrice: 0,
    };
    if (qty === 0) return zero;

    const unitRaw     = Object.values(rawMaterialCosts).reduce((a, b) => a + b, 0);
    const unitOp      = opTotal / qty;
    const unitCost    = unitRaw + unitOp;
    const isFixed     = fixed > 0;
    const unitProfit  = isFixed
      ? fixed / qty
      : unitCost * (margin / 100);
    const unitBase    = unitCost + unitProfit;

    // Marketplace fees: Shopee uses tier-based, custom uses flat commission
    let unitComm = 0;
    let unitFee  = 0;

    if (marketplace === 'shopee') {
      const shopee = calcShopeeCost(unitBase, shopeeAccountType);
      unitComm = shopee.commission;
      unitFee  = shopee.fixedFee / qty + (shopee.cpfExtra > 0 ? shopee.cpfExtra / qty : 0);
    } else if (marketplace === 'custom') {
      unitComm = unitBase * (commission / 100);
      unitFee  = fixedFee / qty;
    }

    const unitFees    = unitComm + unitFee;
    const unitPrice   = unitBase + unitFees;
    const totalSell   = unitPrice * qty;
    const totalProd   = unitCost * qty;
    const totalFees   = unitFees * qty;

    return {
      rawMaterialsCost:     roundCurrency(unitRaw * qty),
      operationalCost:      opTotal,
      operationalTotal:     opTotal,
      productionCost:       totalProd,
      isFixedProfit:        isFixed,
      desiredProfit:        roundCurrency(unitProfit * qty),
      baseSellingPrice:     roundCurrency(unitBase * qty),
      finalSellingPrice:    totalSell,
      unitPrice,
      unitRawMaterialsCost: unitRaw,
      netProfit:            roundCurrency(totalSell - totalProd - totalFees),
      marketplaceCommission: roundCurrency(unitComm * qty),
      marketplaceFixedFees:  roundCurrency(unitFee  * qty),
      marketplaceTotalFees:  totalFees,
      totalCost:            totalProd,
      profitValue:          roundCurrency(unitProfit * qty),
      sellingPrice:         totalSell,
    };
  }, [lotQuantity, rawMaterialCosts, calculatedOperationalCosts, profitMargin,
      fixedProfit, commissionPercentage, fixedFeePerItem, marketplace, shopeeAccountType]);

  // ── ações ────────────────────────────────────────────────────────────────────

  const reset = useCallback(() => {
    setProductName(''); setLotQuantity(0); setProductPreset('custom');
    setPaperData(EMPTY_RAW); setHandleData(EMPTY_RAW);
    setPackagingData(EMPTY_RAW); setInkData(EMPTY_INK);
    setOtherMaterialsItems([]);
    setOperationalCostsData(DEFAULT_OPERATIONAL_COSTS_DATA);
    setProfitMargin(0); setFixedProfit(0);
    setMarketplace('none'); setShopeeAccountType('cnpj');
    setCommissionPercentage(0); setFixedFeePerItem(0);
  }, []);

  const applyPreset = useCallback((preset: ProductPresetType) => {
    setProductPreset(preset);
    if (preset === 'custom') return;
    const c = PRODUCT_PRESETS[preset];
    setPaperData({ packageValue: c.paper, packageQuantity: 1, quantityUsed: 1 });
    setHandleData({ packageValue: c.ink, packageQuantity: 1, quantityUsed: 1 });
    setInkData({ totalValue: c.varnish, bottleCount: 1, mlPerBottle: 1, mlPerPrint: 1, printQuantity: 1 });
    setOtherMaterialsItems([{ id: 'preset-other', name: 'Outros',
      packageValue: c.otherMaterials, packageQuantity: 1, quantityUsed: 1 }]);
    if (c.defaultQuantity > 0 && lotQuantity === 0) setLotQuantity(c.defaultQuantity);
    if (!productName) setProductName(c.label);
  }, [lotQuantity, productName]);

  // valores mapeados para salvar no banco
  const saveDataValues = useMemo(() => ({
    paper:         rawMaterialCosts.paper,
    ink:           rawMaterialCosts.handle,
    varnish:       rawMaterialCosts.ink,
    otherMaterials: rawMaterialCosts.packaging + rawMaterialCosts.other,
    labor:          calculatedOperationalCosts.labor.appliedCost,
    energy:         calculatedOperationalCosts.electricity.appliedCost,
    equipment:      calculatedOperationalCosts.equipment.appliedCost +
                    calculatedOperationalCosts.equipments.reduce((s, e) => s + e.appliedCost, 0),
    rent:           calculatedOperationalCosts.internet.appliedCost,
    otherCosts:     calculatedOperationalCosts.otherFixedCosts.reduce((s, c) => s + c.appliedCost, 0),
  }), [rawMaterialCosts, calculatedOperationalCosts]);

  // ── retorno público ──────────────────────────────────────────────────────────

  return {
    // estado
    productName, setProductName,
    lotQuantity, setLotQuantity,
    productPreset,
    paperData, setPaperData,
    handleData, setHandleData,
    packagingData, setPackagingData,
    inkData, setInkData,
    otherMaterialsItems, setOtherMaterialsItems,
    operationalCostsData, setOperationalCostsData,
    profitMargin, setProfitMargin,
    fixedProfit, setFixedProfit,
    marketplace, setMarketplace,
    shopeeAccountType, setShopeeAccountType,
    commissionPercentage, setCommissionPercentage,
    fixedFeePerItem, setFixedFeePerItem,
    // derivados
    calculations,
    rawMaterialCosts,
    calculatedOperationalCosts,
    saveDataValues,
    hasOperationalCosts: calculatedOperationalCosts.totalAppliedCost > 0,
    // ações
    reset,
    applyPreset,
  };
}
