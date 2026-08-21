import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowDown, ArrowUp, Plus, Trash2 } from 'lucide-react';
import { CatalogConfig, MAX_SPECS, TEXT_LIMITS, newId } from '@/lib/catalogBuilder/types';
import IconPicker from '../IconPicker';

interface Props {
  config: CatalogConfig;
  update: (fn: (c: CatalogConfig) => CatalogConfig) => void;
}

const SpecificationsSection: React.FC<Props> = ({ config, update }) => {
  const specs = config.specifications;
  const setSpecs = (next: typeof specs) => update((c) => ({ ...c, specifications: next }));

  const move = (index: number, dir: -1 | 1) => {
    const next = [...specs];
    const target = index + dir;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    setSpecs(next);
  };

  return (
    <div className="space-y-3">
      <Label className="text-xs">
        Características ({specs.length}/{MAX_SPECS})
      </Label>
      {specs.map((spec, i) => (
        <div key={spec.id} className="rounded-md border border-border p-2.5 space-y-2">
          <div className="flex items-center gap-1.5">
            <IconPicker
              value={spec.icon}
              onChange={(icon) => setSpecs(specs.map((s) => (s.id === spec.id ? { ...s, icon } : s)))}
            />
            <Input
              value={spec.label}
              maxLength={TEXT_LIMITS.specLabel}
              placeholder="Medida"
              aria-label={`Título da característica ${i + 1}`}
              onChange={(e) => setSpecs(specs.map((s) => (s.id === spec.id ? { ...s, label: e.target.value } : s)))}
              className="h-9 flex-1 min-w-0"
            />
            <div className="flex flex-col shrink-0">
              <button
                type="button"
                aria-label={`Mover característica ${i + 1} para cima`}
                disabled={i === 0}
                onClick={() => move(i, -1)}
                className="p-0.5 text-muted-foreground hover:text-foreground disabled:opacity-30"
              >
                <ArrowUp className="w-3 h-3" />
              </button>
              <button
                type="button"
                aria-label={`Mover característica ${i + 1} para baixo`}
                disabled={i === specs.length - 1}
                onClick={() => move(i, 1)}
                className="p-0.5 text-muted-foreground hover:text-foreground disabled:opacity-30"
              >
                <ArrowDown className="w-3 h-3" />
              </button>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-9 w-8 shrink-0"
              aria-label={`Excluir característica ${i + 1}`}
              onClick={() => setSpecs(specs.filter((s) => s.id !== spec.id))}
            >
              <Trash2 className="w-3.5 h-3.5 text-destructive" />
            </Button>
          </div>
          <Input
            value={spec.value}
            maxLength={TEXT_LIMITS.specValue}
            placeholder="10 x 12 x 4 cm"
            aria-label={`Valor da característica ${i + 1}`}
            onChange={(e) => setSpecs(specs.map((s) => (s.id === spec.id ? { ...s, value: e.target.value } : s)))}
            className="h-9"
          />
        </div>
      ))}
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={specs.length >= MAX_SPECS}
        onClick={() => setSpecs([...specs, { id: newId(), icon: 'star', label: '', value: '' }])}
      >
        <Plus className="w-3.5 h-3.5 mr-1.5" />
        Adicionar característica
      </Button>
    </div>
  );
};

export default SpecificationsSection;
