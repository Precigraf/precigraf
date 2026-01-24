import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  ArrowLeft, 
  RefreshCw, 
  Sparkles, 
  Lock,
  TrendingUp
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Header from '@/components/Header';
import OverviewCards from '@/components/dashboard/OverviewCards';
import PriceHealthScore from '@/components/dashboard/PriceHealthScore';
import CouponComparison from '@/components/dashboard/CouponComparison';
import DashboardAlerts from '@/components/dashboard/DashboardAlerts';
import StrategicSuggestions from '@/components/dashboard/StrategicSuggestions';
import PriceEvolutionChart from '@/components/dashboard/PriceEvolutionChart';
import UpgradePlanModal from '@/components/UpgradePlanModal';
import { useUserPlan } from '@/hooks/useUserPlan';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { logError } from '@/lib/logger';

interface CalculationData {
  id: string;
  product_name: string;
  sale_price: number;
  profit: number;
  margin_percentage: number;
  total_cost: number;
  unit_price: number;
  lot_quantity: number;
  created_at: string;
}

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { plan, loading: planLoading } = useUserPlan();
  const isPro = plan === 'pro';
  
  const [calculations, setCalculations] = useState<CalculationData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  // Buscar cálculos do usuário
  const fetchCalculations = useCallback(async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('calculations')
        .select('id, product_name, sale_price, profit, margin_percentage, total_cost, unit_price, lot_quantity, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) {
        logError('Error fetching calculations:', error);
        return;
      }

      setCalculations(data || []);
    } catch (err) {
      logError('Error in fetchCalculations:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchCalculations();
  }, [fetchCalculations]);

  // Usar o cálculo mais recente para os cards de visão geral
  const latestCalculation = calculations[0];

  // Calcular métricas do dashboard
  const metrics = useMemo(() => {
    if (!latestCalculation) {
      return {
        healthScore: 0,
        healthLevel: 'warning' as const,
        unitProfit: 0,
        currentMargin: 0,
        finalPrice: 0,
        quantity: 0,
        netMargin: 0,
        netProfit: 0,
        totalFees: 0,
        productionCost: 0,
        totalCost: 0,
      };
    }

    const quantity = latestCalculation.lot_quantity || 1;
    const unitProfit = quantity > 0 ? latestCalculation.profit / quantity : 0;
    const netMargin = latestCalculation.sale_price > 0 
      ? (latestCalculation.profit / latestCalculation.sale_price) * 100 
      : 0;

    // Calcular health score
    let healthScore = 100;
    let healthLevel: 'excellent' | 'good' | 'warning' | 'critical' = 'excellent';

    if (netMargin < 0) {
      healthScore = 20;
      healthLevel = 'critical';
    } else if (netMargin < 10) {
      healthScore = 35;
      healthLevel = 'critical';
    } else if (netMargin < 20) {
      healthScore = 55;
      healthLevel = 'warning';
    } else if (netMargin < 30) {
      healthScore = 70;
      healthLevel = 'good';
    } else {
      healthScore = 90;
      healthLevel = 'excellent';
    }

    return {
      healthScore,
      healthLevel,
      unitProfit,
      currentMargin: latestCalculation.margin_percentage || 0,
      finalPrice: latestCalculation.sale_price || 0,
      quantity,
      netMargin,
      netProfit: latestCalculation.profit || 0,
      totalFees: 0, // Seria calculado se tivéssemos os dados de marketplace
      productionCost: latestCalculation.total_cost || 0,
      totalCost: latestCalculation.total_cost || 0,
    };
  }, [latestCalculation]);

  const handleApplyMargin = (margin: number) => {
    // Redirecionar para a calculadora com a margem sugerida
    navigate('/', { state: { suggestedMargin: margin } });
  };

  const handleShowUpgrade = () => {
    setShowUpgradeModal(true);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-6">
        {/* Header do Dashboard */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/')}
              className="h-9 w-9"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <div className="flex items-center gap-2">
                <LayoutDashboard className="w-5 h-5 text-primary" />
                <h1 className="text-xl font-bold text-foreground">Dashboard de Precificação</h1>
                {isPro && (
                  <Badge variant="outline" className="text-xs bg-primary/10 border-primary/30 text-primary">
                    <Sparkles className="w-3 h-3 mr-1" />
                    PRO
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground mt-0.5">
                Visão estratégica dos seus cálculos
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchCalculations}
              disabled={loading}
            >
              <RefreshCw className={`w-4 h-4 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
            {!isPro && (
              <Button size="sm" onClick={handleShowUpgrade}>
                <Lock className="w-4 h-4 mr-1.5" />
                Desbloquear PRO
              </Button>
            )}
          </div>
        </div>

        {/* Banner para usuários FREE */}
        {!isPro && !planLoading && (
          <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10 border border-primary/20 rounded-xl p-4 mb-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                <div>
                  <p className="text-sm font-medium text-foreground">
                    Desbloqueie o Dashboard Completo
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Acesse Score de Saúde, Sugestões Estratégicas e Histórico de Evolução
                  </p>
                </div>
              </div>
              <Button 
                size="sm" 
                className="sm:ml-auto"
                onClick={handleShowUpgrade}
              >
                <Sparkles className="w-4 h-4 mr-1.5" />
                Fazer upgrade
              </Button>
            </div>
          </div>
        )}

        {/* Cards de Visão Geral */}
        <div className="mb-6">
          <OverviewCards
            healthScore={metrics.healthScore}
            healthLevel={metrics.healthLevel}
            unitProfit={metrics.unitProfit}
            currentMargin={metrics.currentMargin}
            finalPrice={metrics.finalPrice}
            quantity={metrics.quantity}
            isPro={isPro}
          />
        </div>

        {/* Grid Principal */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Coluna Esquerda */}
          <div className="space-y-6">
            {/* Score de Saúde (PRO) */}
            {isPro ? (
              <PriceHealthScore
                netMargin={metrics.netMargin}
                netProfit={metrics.netProfit}
                totalFees={metrics.totalFees}
                productionCost={metrics.productionCost}
                finalSellingPrice={metrics.finalPrice}
              />
            ) : (
              <div className="relative bg-secondary/30 border border-border rounded-xl p-4 overflow-hidden">
                <div className="absolute inset-0 bg-background/60 backdrop-blur-[1px] z-10 flex flex-col items-center justify-center gap-2">
                  <Lock className="w-5 h-5 text-muted-foreground" />
                  <Badge variant="outline" className="text-xs bg-background/80">
                    <Sparkles className="w-3 h-3 mr-1" />
                    Score de Saúde PRO
                  </Badge>
                  <Button size="sm" onClick={handleShowUpgrade} className="mt-2 text-xs">
                    Fazer upgrade
                  </Button>
                </div>
                <div className="opacity-40 pointer-events-none h-48" />
              </div>
            )}

            {/* Comparação de Cupom */}
            <CouponComparison
              finalSellingPrice={metrics.finalPrice}
              unitPrice={metrics.unitProfit}
              quantity={metrics.quantity}
              totalCost={metrics.totalCost}
              profit={metrics.netProfit}
              isPro={isPro}
              onShowUpgrade={handleShowUpgrade}
            />
          </div>

          {/* Coluna Direita */}
          <div className="space-y-6">
            {/* Alertas e Riscos */}
            <DashboardAlerts
              netProfit={metrics.netProfit}
              netMargin={metrics.netMargin}
              totalFees={metrics.totalFees}
              finalSellingPrice={metrics.finalPrice}
              productionCost={metrics.productionCost}
              isPro={isPro}
              onShowUpgrade={handleShowUpgrade}
            />

            {/* Sugestões Estratégicas */}
            <StrategicSuggestions
              netMargin={metrics.netMargin}
              netProfit={metrics.netProfit}
              totalFees={metrics.totalFees}
              productionCost={metrics.productionCost}
              finalSellingPrice={metrics.finalPrice}
              currentMarginPercent={metrics.currentMargin}
              isPro={isPro}
              onApplyMargin={handleApplyMargin}
              onShowUpgrade={handleShowUpgrade}
            />
          </div>
        </div>

        {/* Gráfico de Evolução (PRO) */}
        <PriceEvolutionChart
          calculations={calculations}
          isPro={isPro}
          onShowUpgrade={handleShowUpgrade}
        />
      </main>

      {/* Footer */}
      <footer className="border-t border-border mt-16 py-8">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm text-muted-foreground">
            © 2026 PreciGraf. Dashboard de Precificação.
          </p>
        </div>
      </footer>

      {/* Modal de Upgrade */}
      <UpgradePlanModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        onUpgrade={() => {
          setShowUpgradeModal(false);
          navigate('/upgrade');
        }}
      />
    </div>
  );
};

export default Dashboard;
