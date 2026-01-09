import React from 'react';
import { Tag, ChevronDown } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export type ProductPresetType = 
  | 'custom'
  | 'business_card'
  | 'paper_bag'
  | 'sticker'
  | 'jewelry_tag'
  | 'custom_box';

interface PresetConfig {
  label: string;
  paper: number;
  ink: number;
  varnish: number;
  otherMaterials: number;
  defaultQuantity: number;
}

export const PRODUCT_PRESETS: Record<ProductPresetType, PresetConfig> = {
  custom: {
    label: 'Personalizado',
    paper: 0,
    ink: 0,
    varnish: 0,
    otherMaterials: 0,
    defaultQuantity: 0,
  },
  business_card: {
    label: 'Cartão de Visita',
    paper: 0.15,
    ink: 0.05,
    varnish: 0.02,
    otherMaterials: 0,
    defaultQuantity: 500,
  },
  paper_bag: {
    label: 'Sacola de Papel',
    paper: 1.50,
    ink: 0.30,
    varnish: 0,
    otherMaterials: 0.20,
    defaultQuantity: 100,
  },
  sticker: {
    label: 'Adesivo',
    paper: 0.10,
    ink: 0.03,
    varnish: 0.02,
    otherMaterials: 0,
    defaultQuantity: 200,
  },
  jewelry_tag: {
    label: 'Tag para Joias',
    paper: 0.25,
    ink: 0.05,
    varnish: 0.03,
    otherMaterials: 0.10,
    defaultQuantity: 100,
  },
  custom_box: {
    label: 'Caixa Personalizada',
    paper: 2.00,
    ink: 0.50,
    varnish: 0,
    otherMaterials: 0.30,
    defaultQuantity: 50,
  },
};

interface ProductPresetsProps {
  value: ProductPresetType;
  onChange: (preset: ProductPresetType) => void;
}

const ProductPresets: React.FC<ProductPresetsProps> = ({ value, onChange }) => {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-medium text-secondary-foreground flex items-center gap-1.5">
        <Tag className="w-3.5 h-3.5" />
        Tipo de Produto (opcional)
      </label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="input-currency">
          <SelectValue placeholder="Selecione um preset" />
        </SelectTrigger>
        <SelectContent className="bg-card border-border z-50">
          {Object.entries(PRODUCT_PRESETS).map(([key, preset]) => (
            <SelectItem key={key} value={key}>
              {preset.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {value !== 'custom' && (
        <p className="text-xs text-muted-foreground">
          Valores sugeridos aplicados. Você pode editar livremente.
        </p>
      )}
    </div>
  );
};

export default ProductPresets;
