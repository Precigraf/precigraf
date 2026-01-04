import React from 'react';
import { Trash2, Package, Calendar, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCalculations, Calculation } from '@/hooks/useCalculations';

const SavedCalculations: React.FC = () => {
  const { calculations, loading, deleteCalculation, remainingCalculations, canSaveMore } = useCalculations();

  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="glass-card p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-secondary rounded w-1/3"></div>
          <div className="h-20 bg-secondary rounded"></div>
          <div className="h-20 bg-secondary rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-bold text-foreground">Cálculos Salvos</h3>
          <p className="text-sm text-muted-foreground">
            {calculations.length} de 5 no plano gratuito
          </p>
        </div>
        <div className={`text-xs px-3 py-1 rounded-full ${canSaveMore ? 'bg-success/20 text-success' : 'bg-destructive/20 text-destructive'}`}>
          {remainingCalculations} restantes
        </div>
      </div>

      {calculations.length === 0 ? (
        <div className="text-center py-8">
          <Package className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
          <p className="text-muted-foreground">Nenhum cálculo salvo ainda</p>
          <p className="text-sm text-muted-foreground/70 mt-1">
            Use o botão "Salvar" para guardar seus orçamentos
          </p>
        </div>
      ) : (
        <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
          {calculations.map((calc) => (
            <CalculationCard
              key={calc.id}
              calculation={calc}
              onDelete={() => deleteCalculation(calc.id)}
              formatCurrency={formatCurrency}
              formatDate={formatDate}
            />
          ))}
        </div>
      )}
    </div>
  );
};

interface CalculationCardProps {
  calculation: Calculation;
  onDelete: () => void;
  formatCurrency: (value: number) => string;
  formatDate: (date: string) => string;
}

const CalculationCard: React.FC<CalculationCardProps> = ({
  calculation,
  onDelete,
  formatCurrency,
  formatDate,
}) => {
  return (
    <div className="bg-secondary/50 rounded-xl p-4 hover:bg-secondary/70 transition-colors group">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-foreground truncate">
            {calculation.product_name}
          </h4>
          <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Package className="w-3 h-3" />
              {calculation.lot_quantity} un
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {formatDate(calculation.created_at)}
            </span>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive hover:bg-destructive/10"
          onClick={onDelete}
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
      
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/50">
        <div className="flex items-center gap-1 text-sm text-muted-foreground">
          <DollarSign className="w-3 h-3" />
          Custo: {formatCurrency(calculation.total_cost)}
        </div>
        <div className="font-bold text-primary">
          {formatCurrency(calculation.sale_price)}
        </div>
      </div>
    </div>
  );
};

export default SavedCalculations;
