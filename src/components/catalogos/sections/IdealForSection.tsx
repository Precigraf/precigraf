import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowDown, ArrowUp, Plus, Trash2 } from 'lucide-react';
import { CatalogConfig, MAX_IDEAL_FOR, TEXT_LIMITS, newId } from '@/lib/catalogBuilder/types';
import { LimitedInput } from '../EditorFields';
import IconPicker from '../IconPicker';

interface Props {
  config: CatalogConfig;
  update: (fn: (c: CatalogConfig) => CatalogConfig) => void;
}

const IdealForSection: React.FC<Props> = ({ config, update }) => {
  const { idealFor } = config;
  const setItems = (items: typeof idealFor.items) =>
    update((c) => ({ ...c, idealFor: { ...c.idealFor, items } }));

  const move = (index: number, dir: -1 | 1) => {
    const next = [...idealFor.items];
    const target = index + dir;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    setItems(next);
  };

  return (
    <div className="space-y-4">
      <LimitedInput
        id="idealfor-title"
        label="Título da seção"
        value={idealFor.title}
        maxLength={TEXT_LIMITS.idealForTitle}
        onChange={(v) => update((c) => ({ ...c, idealFor: { ...c.idealFor, title: v } }))}
      />

      <div className="space-y-2">
        <Label className="text-xs">
          Indicações ({idealFor.items.length}/{MAX_IDEAL_FOR})
        </Label>
        {idealFor.items.map((item, i) => (
          <div key={item.id} className="flex items-center gap-1.5">
            <IconPicker
              value={item.icon}
              onChange={(icon) => setItems(idealFor.items.map((it) => (it.id === item.id ? { ...it, icon } : it)))}
            />
            <Input
              value={item.label}
              maxLength={TEXT_LIMITS.idealForLabel}
              placeholder="Joias e semijoias"
              aria-label={`Indicação ${i + 1}`}
              onChange={(e) =>
                setItems(idealFor.items.map((it) => (it.id === item.id ? { ...it, label: e.target.value } : it)))
              }
              className="h-9 flex-1 min-w-0"
            />
            <div className="flex flex-col shrink-0">
              <button
                type="button"
                aria-label={`Mover indicação ${i + 1} para cima`}
                disabled={i === 0}
                onClick={() => move(i, -1)}
                className="p-0.5 text-muted-foreground hover:text-foreground disabled:opacity-30"
              >
                <ArrowUp className="w-3 h-3" />
              </button>
              <button
                type="button"
                aria-label={`Mover indicação ${i + 1} para baixo`}
                disabled={i === idealFor.items.length - 1}
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
              aria-label={`Excluir indicação ${i + 1}`}
              onClick={() => setItems(idealFor.items.filter((it) => it.id !== item.id))}
            >
              <Trash2 className="w-3.5 h-3.5 text-destructive" />
            </Button>
          </div>
        ))}
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={idealFor.items.length >= MAX_IDEAL_FOR}
          onClick={() => setItems([...idealFor.items, { id: newId(), icon: 'star', label: '' }])}
        >
          <Plus className="w-3.5 h-3.5 mr-1.5" />
          Adicionar indicação
        </Button>
      </div>
    </div>
  );
};

export default IdealForSection;
