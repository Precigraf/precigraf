import React, { useState, useMemo } from 'react';
import AppLayout from '@/components/AppLayout';
import MarketplaceSection, { MarketplaceType, ShopeeAccountType, calcShopeeCost } from '@/components/MarketplaceSection';

import CurrencyInput from '@/components/CurrencyInput';
import FormSection from '@/components/FormSection';
import { Store, DollarSign, TrendingUp, Package } from 'lucide-react';

import { Input } from '@/components/ui/input';
import { useUserPlan } from '@/hooks/useUserPlan';
import UpgradePlanModal from '@/components/UpgradePlanModal';
import { useNavigate } from 'react-router-dom';

const safeNumber = (value: number): number => {
  if (!Number.isFinite(value) || isNaN(value)) return 0;
  return Math.max(0, value);
};

const formatCurrency = (value: number) => {
  if (!Number.isFinite(value) || isNaN(value)) return 'R$ 0,00';
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

const Marketplace = () => {
  const navigate = useNavigate();
  const { plan } = useUserPlan();
  const isPro = plan === 'pro';
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  // Inputs
  const [basePrice, setBasePrice] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [marketplace, setMarketplace] = useState<MarketplaceType>('none');
  const [shopeeAccountType, setShopeeAccountType] = useState<ShopeeAccountType>('cnpj');
  const [commissionPercentage, setCommissionPercentage] = useState(0);
  const [fixedFeePerItem, setFixedFeePerItem] = useState(0);

  const calculations = useMemo(() => {
    const safeBase = safeNumber(basePrice);
    const safeQty = Math.max(1, Math.floor(safeNumber(quantity)));
    const safeCommission = Math.min(safeNumber(commissionPercentage), 100);
    const safeFee = safeNumber(fixedFeePerItem);

    let unitMarketplaceCommission = 0;
    let unitMarketplaceFixedFees = 0;

    if (marketplace === 'shopee') {
      const shopee = calcShopeeCost(safeBase);
      unitMarketplaceCommission = shopee.finalPrice - safeBase;
    } else if (marketplace === 'custom') {
      unitMarketplaceCommission = safeBase * (safeCommission / 100);
      unitMarketplaceFixedFees = safeFee / safeQty;
    }

    const totalFees = unitMarketplaceCommission + unitMarketplaceFixedFees;
    const finalPrice = safeBase + totalFees;

    return {
      unitFees: totalFees,
      totalFees: totalFees * safeQty,
      unitFinalPrice: finalPrice,
      totalFinalPrice: finalPrice * safeQty,
      commission: unitMarketplaceCommission * safeQty,
      fixedFees: unitMarketplaceFixedFees * safeQty,
    };
  }, [basePrice, quantity, marketplace, shopeeAccountType, commissionPercentage, fixedFeePerItem]);

  const hasMarketplace = marketplace !== 'none';

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Store className="w-6 h-6 text-primary" />
            Marketplace
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Simule taxas e preços finais para venda em marketplaces
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-6">
          {/* Coluna Esquerda */}
          <div className="space-y-6">
            {/* Preço Base e Quantidade */}
            <FormSection
              title="Dados do Produto"
              icon={<Package className="w-5 h-5 text-primary" />}
              subtitle="Informe o preço base e a quantidade"
            >
              <CurrencyInput
                label="Preço Base (por unidade)"
                value={basePrice}
                onChange={setBasePrice}
                tooltip="Preço de venda por unidade antes das taxas do marketplace"
              />
              <div>
                <label className="text-sm font-medium text-foreground mb-1 block">
                  Quantidade
                </label>
                <Input
                  type="number"
                  min={1}
                  max={999999}
                  value={quantity || ''}
                  onChange={(e) => {
                    const v = parseInt(e.target.value, 10);
                    if (!isNaN(v) && v >= 0) setQuantity(Math.min(v, 999999));
                    else if (e.target.value === '') setQuantity(0);
                  }}
                  className="h-10"
                />
              </div>
            </FormSection>

            {/* Seleção de Marketplace */}
            <MarketplaceSection
              marketplace={marketplace}
              onMarketplaceChange={setMarketplace}
              shopeeAccountType={shopeeAccountType}
              onShopeeAccountTypeChange={setShopeeAccountType}
              commissionPercentage={commissionPercentage}
              onCommissionChange={setCommissionPercentage}
              fixedFeePerItem={fixedFeePerItem}
              onFixedFeeChange={setFixedFeePerItem}
              profitValue={0}
              unitBasePrice={basePrice}
              lotQuantity={quantity}
              isPro={isPro}
              onShowUpgrade={() => setShowUpgradeModal(true)}
            />
          </div>

          {/* Coluna Direita - Resultados */}
          <div className="space-y-6">
            <div className="glass-card result-gradient p-6 sticky top-6 animate-slide-up space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-foreground flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-background" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-foreground">Resultado</h2>
                  <p className="text-sm text-muted-foreground">Simulação de Marketplace</p>
                </div>
              </div>

              {/* Preço Final */}
              <div className="bg-foreground rounded-xl p-6">
                <div className="text-center">
                  <span className="text-xs font-medium text-background/70 uppercase tracking-wide">
                    Preço Final com Taxas
                  </span>
                  <div className="text-4xl font-bold text-background mt-1">
                    {formatCurrency(calculations.totalFinalPrice)}
                  </div>
                  <div className="text-sm text-background/80 mt-1">
                    para {Math.max(1, quantity)} unidades
                  </div>
                </div>
              </div>

              {/* Preço por Unidade */}
              <div className="bg-success/10 border border-success/30 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-success" />
                    <span className="text-sm font-medium text-foreground">Preço por Unidade</span>
                  </div>
                  <span className="text-2xl font-bold text-success">
                    {formatCurrency(calculations.unitFinalPrice)}
                  </span>
                </div>
              </div>

              {/* Detalhamento de Taxas */}
              {hasMarketplace && (
                <div className="space-y-3">
                  <div className="bg-secondary/50 rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Preço Base</span>
                      <span className="text-sm font-semibold text-foreground">
                        {formatCurrency(basePrice * Math.max(1, quantity))}
                      </span>
                    </div>
                  </div>

                  <div className="bg-warning/10 rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <Store className="w-4 h-4 text-warning" />
                        <span className="text-sm text-warning">Total de Taxas</span>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-semibold text-warning">
                          +{formatCurrency(calculations.totalFees)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {formatCurrency(calculations.unitFees)}/un
                        </div>
                      </div>
                    </div>
                  </div>

                  {calculations.commission > 0 && (
                    <div className="bg-secondary/30 rounded-lg p-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Comissão</span>
                        <span className="font-medium text-foreground">
                          {formatCurrency(calculations.commission)}
                        </span>
                      </div>
                    </div>
                  )}

                  {calculations.fixedFees > 0 && (
                    <div className="bg-secondary/30 rounded-lg p-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Taxa Fixa</span>
                        <span className="font-medium text-foreground">
                          {formatCurrency(calculations.fixedFees)}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {!hasMarketplace && (
                <div className="text-center py-8 text-muted-foreground">
                  <Store className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">Selecione um marketplace para simular as taxas</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <UpgradePlanModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        onUpgrade={() => {
          setShowUpgradeModal(false);
          navigate('/upgrade');
        }}
        message="Faça o upgrade para acessar simulação de marketplace."
      />
    </AppLayout>
  );
};

export default Marketplace;
