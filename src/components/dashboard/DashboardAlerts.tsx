import React, { useMemo } from 'react';
import { AlertTriangle, XCircle, TrendingDown, Percent, Bell, CheckCircle, Lock, Sparkles } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface DashboardAlertsProps {
  netProfit: number;
  netMargin: number;
  totalFees: number;
  finalSellingPrice: number;
  productionCost: number;
  hasCouponApplied?: boolean;
  couponProfit?: number;
  isPro: boolean;
  onShowUpgrade?: () => void;
}

interface AlertItem {
  id: string;
  type: 'critical' | 'warning' | 'info' | 'success';
  icon: React.ReactNode;
  title: string;
  description: string;
}

const DashboardAlerts: React.FC<DashboardAlertsProps> = ({
  netProfit,
  netMargin,
  totalFees,
  finalSellingPrice,
  productionCost,
  hasCouponApplied = false,
  couponProfit = 0,
  isPro,
  onShowUpgrade,
}) => {
  const alerts = useMemo(() => {
    const result: AlertItem[] = [];
    const feeImpact = finalSellingPrice > 0 ? (totalFees / finalSellingPrice) * 100 : 0;

    // Alerta crítico: prejuízo
    if (netProfit < 0) {
      result.push({
        id: 'loss',
        type: 'critical',
        icon: <XCircle className="w-4 h-4" />,
        title: 'Operação com Prejuízo',
        description: 'O preço de venda não cobre os custos. Aumente a margem ou reduza custos.',
      });
    }

    // Alerta crítico: cupom zerando lucro
    if (hasCouponApplied && couponProfit <= 0) {
      result.push({
        id: 'coupon-loss',
        type: 'critical',
        icon: <XCircle className="w-4 h-4" />,
        title: 'Cupom Eliminando Lucro',
        description: 'O desconto atual está zerando ou gerando prejuízo. Reduza o percentual.',
      });
    }

    // Alerta: margem muito baixa
    if (netProfit >= 0 && netMargin < 10 && netMargin >= 0) {
      result.push({
        id: 'very-low-margin',
        type: 'warning',
        icon: <TrendingDown className="w-4 h-4" />,
        title: 'Margem Muito Baixa',
        description: `Margem de ${netMargin.toFixed(1)}% é arriscada. Recomendado mínimo de 20%.`,
      });
    } else if (netMargin >= 10 && netMargin < 20) {
      result.push({
        id: 'low-margin',
        type: 'warning',
        icon: <AlertTriangle className="w-4 h-4" />,
        title: 'Margem Abaixo do Ideal',
        description: `Margem de ${netMargin.toFixed(1)}% está no limite. Considere aumentar.`,
      });
    }

    // Alerta: taxas consumindo lucro
    if (feeImpact > 30 && totalFees > 0) {
      result.push({
        id: 'high-fees',
        type: 'warning',
        icon: <Percent className="w-4 h-4" />,
        title: 'Taxas Muito Elevadas',
        description: `Taxas representam ${feeImpact.toFixed(1)}% do preço final. Avalie outros canais.`,
      });
    } else if (feeImpact > 20 && feeImpact <= 30 && totalFees > 0) {
      result.push({
        id: 'medium-fees',
        type: 'info',
        icon: <Percent className="w-4 h-4" />,
        title: 'Taxas Moderadas',
        description: `Taxas representam ${feeImpact.toFixed(1)}% do preço. Considere na precificação.`,
      });
    }

    // Alerta positivo: tudo bem
    if (netProfit > 0 && netMargin >= 30 && feeImpact <= 20) {
      result.push({
        id: 'healthy',
        type: 'success',
        icon: <CheckCircle className="w-4 h-4" />,
        title: 'Precificação Saudável',
        description: 'Sua margem e custos estão equilibrados. Operação financeiramente segura.',
      });
    }

    return result;
  }, [netProfit, netMargin, totalFees, finalSellingPrice, hasCouponApplied, couponProfit]);

  // Versão bloqueada
  if (!isPro) {
    return (
      <div className="relative bg-secondary/30 border border-border rounded-xl p-4 overflow-hidden">
        <div className="absolute inset-0 bg-background/60 backdrop-blur-[1px] z-10 flex flex-col items-center justify-center gap-2">
          <Lock className="w-5 h-5 text-muted-foreground" />
          <Badge variant="outline" className="text-xs bg-background/80">
            <Sparkles className="w-3 h-3 mr-1" />
            Disponível no plano PRO
          </Badge>
          <Button size="sm" onClick={onShowUpgrade} className="mt-2 text-xs">
            Fazer upgrade
          </Button>
        </div>

        <div className="opacity-40 pointer-events-none select-none">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Bell className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground">Alertas e Riscos</h3>
              <p className="text-xs text-muted-foreground">Monitoramento em tempo real</p>
            </div>
          </div>
          <div className="space-y-2">
            <div className="h-12 bg-secondary/50 rounded-lg" />
            <div className="h-12 bg-secondary/50 rounded-lg" />
          </div>
        </div>
      </div>
    );
  }

  if (alerts.length === 0) {
    return (
      <div className="bg-secondary/30 border border-border rounded-xl p-4">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Bell className="w-4 h-4 text-primary" />
          </div>
          <h3 className="text-sm font-semibold text-foreground">Alertas e Riscos</h3>
        </div>
        <p className="text-xs text-muted-foreground">
          Preencha os dados do cálculo para monitorar riscos.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-secondary/30 border border-border rounded-xl p-4">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
          <Bell className="w-4 h-4 text-primary" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-foreground">Alertas e Riscos</h3>
          <p className="text-xs text-muted-foreground">
            {alerts.filter(a => a.type === 'critical' || a.type === 'warning').length} alerta(s) ativo(s)
          </p>
        </div>
      </div>

      <div className="space-y-2">
        {alerts.map((alert) => (
          <Alert
            key={alert.id}
            variant={alert.type === 'critical' ? 'destructive' : 'default'}
            className={cn(
              'py-2',
              alert.type === 'critical' && 'bg-destructive/10 border-destructive/30',
              alert.type === 'warning' && 'bg-warning/10 border-warning/30',
              alert.type === 'info' && 'bg-primary/5 border-primary/20',
              alert.type === 'success' && 'bg-success/10 border-success/30'
            )}
          >
            <div className={cn(
              alert.type === 'critical' && 'text-destructive',
              alert.type === 'warning' && 'text-warning',
              alert.type === 'info' && 'text-primary',
              alert.type === 'success' && 'text-success'
            )}>
              {alert.icon}
            </div>
            <div>
              <AlertTitle className={cn(
                'text-sm',
                alert.type === 'critical' && 'text-destructive',
                alert.type === 'warning' && 'text-warning',
                alert.type === 'info' && 'text-primary',
                alert.type === 'success' && 'text-success'
              )}>
                {alert.title}
              </AlertTitle>
              <AlertDescription className="text-xs text-muted-foreground">
                {alert.description}
              </AlertDescription>
            </div>
          </Alert>
        ))}
      </div>
    </div>
  );
};

export default DashboardAlerts;
