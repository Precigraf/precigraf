import React from 'react';
import { AlertTriangle, CheckCircle, Info, XCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface SmartAlertsProps {
  marginPercentage: number;
  netProfit: number;
  rawMaterialsCost: number;
  operationalCost: number;
  quantity: number;
}

const SmartAlerts: React.FC<SmartAlertsProps> = ({
  marginPercentage,
  netProfit,
  rawMaterialsCost,
  operationalCost,
  quantity,
}) => {
  const alerts: React.ReactNode[] = [];

  // Só mostrar alertas se houver dados válidos
  if (quantity <= 0) return null;

  // Alerta crítico: lucro zero ou negativo
  if (netProfit <= 0) {
    alerts.push(
      <Alert key="critical" className="bg-destructive/10 border-destructive/30">
        <XCircle className="w-4 h-4 text-destructive" />
        <AlertDescription className="text-destructive text-sm font-medium">
          Prejuízo detectado! Revise seus custos ou aumente a margem.
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
          Margem de {marginPercentage}% é baixa. Considere aumentar para 20%+.
        </AlertDescription>
      </Alert>
    );
  }
  // Feedback positivo: margem saudável
  else if (marginPercentage >= 30) {
    alerts.push(
      <Alert key="success" className="bg-success/10 border-success/30">
        <CheckCircle className="w-4 h-4 text-success" />
        <AlertDescription className="text-success text-sm">
          Margem saudável de {marginPercentage}%! Boa precificação.
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

  if (alerts.length === 0) return null;

  return (
    <div className="space-y-2">
      {alerts}
    </div>
  );
};

export default SmartAlerts;
