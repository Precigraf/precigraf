import React, { useState } from 'react';
import { Lightbulb, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { ProductPresetType } from './ProductPresets';

interface SuggestMarginButtonProps {
  productPreset: ProductPresetType;
  quantity: number;
  onSuggest: (margin: number) => void;
  disabled?: boolean;
}

// Margens sugeridas por tipo de produto e volume
const MARGIN_SUGGESTIONS: Record<ProductPresetType, { base: number; highVolume: number; lowVolume: number }> = {
  custom: { base: 30, highVolume: 25, lowVolume: 40 },
  business_card: { base: 40, highVolume: 30, lowVolume: 50 },
  paper_bag: { base: 35, highVolume: 25, lowVolume: 45 },
  sticker: { base: 50, highVolume: 35, lowVolume: 60 },
  jewelry_tag: { base: 45, highVolume: 35, lowVolume: 55 },
  custom_box: { base: 40, highVolume: 30, lowVolume: 50 },
};

// Limites de volume por tipo de produto
const VOLUME_THRESHOLDS: Record<ProductPresetType, { low: number; high: number }> = {
  custom: { low: 50, high: 500 },
  business_card: { low: 200, high: 2000 },
  paper_bag: { low: 50, high: 300 },
  sticker: { low: 100, high: 1000 },
  jewelry_tag: { low: 50, high: 500 },
  custom_box: { low: 30, high: 200 },
};

const SuggestMarginButton: React.FC<SuggestMarginButtonProps> = ({
  productPreset,
  quantity,
  onSuggest,
  disabled = false,
}) => {
  const [showAnimation, setShowAnimation] = useState(false);

  const calculateSuggestedMargin = (): number => {
    const margins = MARGIN_SUGGESTIONS[productPreset] || MARGIN_SUGGESTIONS.custom;
    const thresholds = VOLUME_THRESHOLDS[productPreset] || VOLUME_THRESHOLDS.custom;

    if (quantity <= 0) {
      return margins.base;
    }

    if (quantity <= thresholds.low) {
      // Baixo volume = margem mais alta
      return margins.lowVolume;
    } else if (quantity >= thresholds.high) {
      // Alto volume = margem mais baixa (escala)
      return margins.highVolume;
    } else {
      // Volume médio = margem base
      return margins.base;
    }
  };

  const getSuggestionReason = (): string => {
    const thresholds = VOLUME_THRESHOLDS[productPreset] || VOLUME_THRESHOLDS.custom;
    
    if (quantity <= 0) {
      return 'Margem padrão recomendada para o tipo de produto.';
    }

    if (quantity <= thresholds.low) {
      return `Para lotes pequenos (até ${thresholds.low} un), sugerimos margem maior para compensar custos fixos.`;
    } else if (quantity >= thresholds.high) {
      return `Para grandes volumes (+${thresholds.high} un), margem menor mantém preço competitivo.`;
    } else {
      return 'Margem equilibrada para volume médio de produção.';
    }
  };

  const handleClick = () => {
    setShowAnimation(true);
    const suggestedMargin = calculateSuggestedMargin();
    
    setTimeout(() => {
      onSuggest(suggestedMargin);
      setShowAnimation(false);
    }, 300);
  };

  const suggestedMargin = calculateSuggestedMargin();

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleClick}
            disabled={disabled}
            className={`
              gap-2 border-primary/30 text-primary hover:bg-primary/10 hover:border-primary/50 
              transition-all duration-300
              ${showAnimation ? 'scale-95 bg-primary/20' : ''}
            `}
          >
            {showAnimation ? (
              <Sparkles className="w-4 h-4 animate-spin" />
            ) : (
              <Lightbulb className="w-4 h-4" />
            )}
            Sugerir margem ({suggestedMargin}%)
          </Button>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs">
          <p className="text-sm">{getSuggestionReason()}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default SuggestMarginButton;
