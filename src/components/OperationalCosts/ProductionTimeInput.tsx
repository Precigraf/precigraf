import React from 'react';
import { Clock } from 'lucide-react';
import { Input } from '@/components/ui/input';
import TooltipLabel from '@/components/TooltipLabel';

interface ProductionTimeInputProps {
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
}

const ProductionTimeInput: React.FC<ProductionTimeInputProps> = ({
  value,
  onChange,
  disabled = false,
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    if (inputValue === '') {
      onChange(0);
      return;
    }
    const parsed = parseFloat(inputValue);
    if (!isNaN(parsed) && parsed >= 0) {
      onChange(Math.min(parsed, 9999));
    }
  };

  // Converter minutos para formato legível
  const formatTime = (minutes: number): string => {
    if (minutes <= 0) return '';
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    if (hours === 0) return `${mins}min`;
    if (mins === 0) return `${hours}h`;
    return `${hours}h ${mins}min`;
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Clock className="w-4 h-4 text-primary" />
        <TooltipLabel
          label="Tempo de Produção (minutos)"
          tooltip="Tempo total estimado para produzir o lote completo. Este valor será usado para calcular todos os custos operacionais proporcionais."
        />
      </div>
      <div className="relative">
        <Input
          type="number"
          value={value || ''}
          onChange={handleChange}
          placeholder="Ex: 120"
          disabled={disabled}
          min={0}
          max={9999}
          step={1}
          className="input-currency pr-16"
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">
          min
        </div>
      </div>
      {value > 0 && (
        <p className="text-xs text-muted-foreground">
          ≈ {formatTime(value)}
        </p>
      )}
      <p className="text-xs text-muted-foreground">
        Campo obrigatório para calcular os custos operacionais
      </p>
    </div>
  );
};

export default ProductionTimeInput;
