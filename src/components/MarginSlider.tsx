import React from 'react';
import { Slider } from '@/components/ui/slider';

interface MarginSliderProps {
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
}

const MarginSlider: React.FC<MarginSliderProps> = ({
  value,
  onChange,
  disabled = false,
}) => {
  const getMarginColor = () => {
    if (value < 30) return 'text-destructive';
    if (value < 50) return 'text-warning';
    return 'text-success';
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-secondary-foreground">
          Margem de lucro
        </label>
        <span className={`text-2xl font-bold ${disabled ? 'text-muted-foreground' : getMarginColor()}`}>
          {value}%
        </span>
      </div>
      <Slider
        value={[value]}
        onValueChange={(vals) => onChange(vals[0])}
        min={0}
        max={200}
        step={1}
        disabled={disabled}
        className={`${disabled ? 'opacity-50' : ''}`}
      />
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>0%</span>
        <span>100%</span>
        <span>200%</span>
      </div>
    </div>
  );
};

export default MarginSlider;
