import React from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, Package } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useSupplyAlerts } from '@/hooks/useSupplyStock';

const StockAlerts: React.FC = () => {
  const { alerts } = useSupplyAlerts();
  if (!alerts.length) return null;

  const out = alerts.filter((a) => a.alert_type === 'out_of_stock');
  const low = alerts.filter((a) => a.alert_type === 'low');

  return (
    <Link to="/estoque" className="block">
      <Alert className="bg-warning/10 border-warning/30 hover:bg-warning/15 transition-colors cursor-pointer">
        <Package className="w-4 h-4 text-warning" />
        <AlertDescription className="text-warning text-sm flex items-center justify-between gap-2">
          <span>
            <strong>Estoque:</strong>{' '}
            {out.length > 0 && <>{out.length} zerado{out.length > 1 ? 's' : ''} · </>}
            {low.length > 0 && <>{low.length} baixo{low.length > 1 ? 's' : ''} · </>}
            <span className="underline">ver detalhes</span>
          </span>
          <AlertTriangle className="w-4 h-4 shrink-0" />
        </AlertDescription>
      </Alert>
    </Link>
  );
};

export default StockAlerts;
