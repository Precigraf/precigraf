import React, { useState, useMemo } from 'react';
import AppLayout from '@/components/AppLayout';
import MarketplaceSection, { MarketplaceType, ShopeeAccountType, calcShopeeCost } from '@/components/MarketplaceSection';

import CurrencyInput from '@/components/CurrencyInput';
import FormSection from '@/components/FormSection';
import { Store, DollarSign, TrendingUp, Package } from 'lucide-react';

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
  const [marketplace, setMarketplace] = useState<MarketplaceType>('none');
  const [shopeeAccountType, setShopeeAccountType] = useState<ShopeeAccountType>('cnpj');
  const [commissionPercentage, setCommissionPercentage] = useState(0);
  const [fixedFeePerItem, setFixedFeePerItem] = useState(0);

  const calculations = useMemo(() => {
    const safeBase = safeNumber(basePrice);
    const safeCommission = Math.min(safeNumber(commissionPercentage), 100);
    const safeFee = safeNumber(fixedFeePerItem);

    let marketplaceCommission = 0;
    let marketplaceFixedFees = 0;

    if (marketplace === 'shopee') {
      const shopee = calcShopeeCost(safeBase);
      marketplaceCommission = shopee.finalPrice - safeBase;
    } else if (marketplace === 'custom') {
      marketplaceCommission = safeBase * (safeCommission / 100);
      marketplaceFixedFees = safeFee;
    }

    const totalFees = marketplaceCommission + marketplaceFixedFees;
    const finalPrice = safeBase + totalFees;

    return {
      totalFees,
      finalPrice,
      commission: marketplaceCommission,
      fixedFees: marketplaceFixedFees,
    };
  }, [basePrice, marketplace, shopeeAccountType, commissionPercentage, fixedFeePerItem]);

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
            {/* Preço Base */}
            <FormSection
              title="Dados do Produto"
              icon={<Package className="w-5 h-5 text-primary" />}
              subtitle="Informe o preço base total do produto"
            >
              <CurrencyInput
                label="Preço Base Total do Produto"
                value={basePrice}
                onChange={setBasePrice}
                tooltip="Preço de venda total antes das taxas do marketplace"
              />
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
              lotQuantity={1}
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
                    {formatCurrency(calculations.finalPrice)}
                  </div>
                </div>
              </div>

              {/* Detalhamento de Taxas */}
              {hasMarketplace && (
                <div className="space-y-3">
                  <div className="bg-secondary/50 rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Preço Base</span>
                      <span className="text-sm font-semibold text-foreground">
                        {formatCurrency(basePrice)}
                      </span>
                    </div>
                  </div>

                  <div className="bg-warning/10 rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <Store className="w-4 h-4 text-warning" />
                        <span className="text-sm text-warning">Total de Taxas</span>
                      </div>
                      <span className="text-sm font-semibold text-warning">
                        +{formatCurrency(calculations.totalFees)}
                      </span>
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
