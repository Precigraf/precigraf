import React from 'react';
import { AlertTriangle, CheckCircle, Info, XCircle, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface SmartAlertsProps {
  marginPercentage: number;
  netProfit: number;
  rawMaterialsCost: number;
  operationalCost: number;
  quantity: number;
  hasOperationalCosts?: boolean;
  productionCost?: number;
  finalSellingPrice?: number;
}

const SmartAlerts: React.FC<SmartAlertsProps> = ({
  marginPercentage,
  netProfit,
  rawMaterialsCost,
  operationalCost,
  quantity,
  hasOperationalCosts = true,
  productionCost = 0,
  finalSellingPrice = 0,
}) => {
  const alerts: React.ReactNode[] = [];

  // Alerta crítico: quantidade = 0
  if (quantity === 0) {
    alerts.push(
      <Alert key="no-quantity" className="bg-warning/10 border-warning/30">
        <AlertCircle className="w-4 h-4 text-warning" />
        <AlertDescription className="text-warning text-sm">
          Informe a quantidade para ver os resultados do cálculo.
        </AlertDescription>
      </Alert>
    );
    return <div className="space-y-2">{alerts}</div>;
  }

  // Alerta crítico: nenhum custo informado
  if (rawMaterialsCost === 0 && operationalCost === 0) {
    alerts.push(
      <Alert key="no-costs" className="bg-warning/10 border-warning/30">
        <AlertCircle className="w-4 h-4 text-warning" />
        <AlertDescription className="text-warning text-sm">
          Informe os custos de matéria-prima ou operacionais para calcular o preço.
        </AlertDescription>
      </Alert>
    );
    return <div className="space-y-2">{alerts}</div>;
  }

  // Alerta crítico: prejuízo (preço final menor que custo total)
  if (productionCost > 0 && finalSellingPrice > 0 && finalSellingPrice < productionCost) {
    alerts.push(
      <Alert key="loss" className="bg-destructive/10 border-destructive/30">
        <XCircle className="w-4 h-4 text-destructive" />
        <AlertDescription className="text-destructive text-sm font-medium">
          ⚠️ Prejuízo! O preço final está menor que o custo de produção.
        </AlertDescription>
      </Alert>
    );
  }
  // Alerta crítico: lucro zero ou negativo
  else if (netProfit < 0 && quantity > 0) {
    alerts.push(
      <Alert key="critical" className="bg-destructive/10 border-destructive/30">
        <XCircle className="w-4 h-4 text-destructive" />
        <AlertDescription className="text-destructive text-sm font-medium">
          Prejuízo detectado! Revise seus custos ou aumente a margem.
        </AlertDescription>
      </Alert>
    );
  }
  // Alerta: margem zero
  else if (marginPercentage === 0 && netProfit === 0 && quantity > 0) {
    alerts.push(
      <Alert key="zero-margin" className="bg-warning/10 border-warning/30">
        <AlertTriangle className="w-4 h-4 text-warning" />
        <AlertDescription className="text-warning text-sm">
          Margem de lucro zerada. Você não terá lucro nesta venda.
        </AlertDescription>
      </Alert>
    );
  }
  // Alerta de risco: margem baixa
  else if (marginPercentage > 0 && marginPercentage < 20) {
    alerts.push(
      <Alert key="warning" className="bg-warning/10 border-warning/30">
        <AlertTriangle className="w-4 h-4 text-warning" />
        <AlertDescription className="text-warning text-sm">
          Margem de {marginPercentage}% é considerada baixa. Recomendamos 20%+.
        </AlertDescription>
      </Alert>
    );
  }
  // Feedback positivo: margem saudável
  else if (marginPercentage >= 30 && netProfit > 0) {
    alerts.push(
      <Alert key="success" className="bg-success/10 border-success/30">
        <CheckCircle className="w-4 h-4 text-success" />
        <AlertDescription className="text-success text-sm">
          Excelente! Margem de {marginPercentage}% é considerada saudável.
        </AlertDescription>
      </Alert>
    );
  }

  // Alerta informativo: custos operacionais não preenchidos
  if (!hasOperationalCosts && quantity > 0 && rawMaterialsCost > 0) {
    alerts.push(
      <Alert key="no-operational" className="bg-primary/5 border-primary/20">
        <Info className="w-4 h-4 text-primary" />
        <AlertDescription className="text-primary text-sm">
          Custos operacionais em branco. Considere incluir mão de obra, energia, etc.
        </AlertDescription>
      </Alert>
    );
  }

  // Alerta informativo: custos operacionais > matéria-prima
  if (operationalCost > rawMaterialsCost && rawMaterialsCost > 0) {
    alerts.push(
      <Alert key="info" className="bg-primary/5 border-primary/20">
        <Info className="w-4 h-4 text-primary" />
        <AlertDescription className="text-primary text-sm">
          Custos operacionais excedem matéria-prima. Avalie otimizações.
        </AlertDescription>
      </Alert>
    );
  }

  // Alerta: margem muito alta (possível erro de digitação)
  if (marginPercentage > 500) {
    alerts.push(
      <Alert key="high-margin" className="bg-warning/10 border-warning/30">
        <AlertTriangle className="w-4 h-4 text-warning" />
        <AlertDescription className="text-warning text-sm">
          Margem de {marginPercentage}% é muito alta. Verifique se não há erro.
        </AlertDescription>
      </Alert>
    );
  }

  if (alerts.length === 0) return null;

  return (
    <div className="space-y-2">
      {alerts}
    </div>
  );
};

export default SmartAlerts;
