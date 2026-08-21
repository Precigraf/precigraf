import React from 'react';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  CatalogConfig,
  TYPOGRAPHY_PRESETS,
  TypographyPreset,
  PhotoBorder,
  CornerStyle,
} from '@/lib/catalogBuilder/types';
import { ColorField } from '../EditorFields';
import { cn } from '@/lib/utils';

interface Props {
  config: CatalogConfig;
  update: (fn: (c: CatalogConfig) => CatalogConfig) => void;
}

const AppearanceSection: React.FC<Props> = ({ config, update }) => {
  const a = config.appearance;
  const set = (patch: Partial<typeof a>) =>
    update((c) => ({ ...c, appearance: { ...c.appearance, ...patch } }));

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <ColorField id="c-primary" label="Cor principal" value={a.primaryColor} onChange={(v) => set({ primaryColor: v })} />
        <ColorField id="c-secondary" label="Cor secundária" value={a.secondaryColor} onChange={(v) => set({ secondaryColor: v })} />
        <ColorField id="c-text" label="Cor do texto" value={a.textColor} onChange={(v) => set({ textColor: v })} />
        <ColorField id="c-bg" label="Cor do fundo" value={a.backgroundColor} onChange={(v) => set({ backgroundColor: v })} />
      </div>

      <div className="space-y-2">
        <Label className="text-xs">Moldura da fotografia</Label>
        <RadioGroup
          value={a.photoBorder}
          onValueChange={(v) => set({ photoBorder: v as PhotoBorder })}
          className="flex gap-4"
        >
          {([
            ['primary', 'Principal'],
            ['secondary', 'Secundária'],
            ['none', 'Sem moldura'],
          ] as const).map(([value, label]) => (
            <div key={value} className="flex items-center gap-1.5">
              <RadioGroupItem value={value} id={`pb-${value}`} />
              <Label htmlFor={`pb-${value}`} className="text-xs font-normal">{label}</Label>
            </div>
          ))}
        </RadioGroup>
      </div>

      <div className="space-y-2">
        <Label className="text-xs">Cantos</Label>
        <RadioGroup
          value={a.corners}
          onValueChange={(v) => set({ corners: v as CornerStyle })}
          className="flex gap-4"
        >
          {([
            ['straight', 'Retos'],
            ['rounded', 'Arredondados'],
          ] as const).map(([value, label]) => (
            <div key={value} className="flex items-center gap-1.5">
              <RadioGroupItem value={value} id={`cn-${value}`} />
              <Label htmlFor={`cn-${value}`} className="text-xs font-normal">{label}</Label>
            </div>
          ))}
        </RadioGroup>
      </div>

      <div className="space-y-2">
        <Label className="text-xs">Tipografia</Label>
        <div className="grid grid-cols-2 gap-2">
          {(Object.keys(TYPOGRAPHY_PRESETS) as TypographyPreset[]).map((key) => {
            const preset = TYPOGRAPHY_PRESETS[key];
            const active = a.typography === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => set({ typography: key })}
                aria-pressed={active}
                className={cn(
                  'rounded-md border p-2.5 text-left transition-colors hover:bg-accent',
                  active ? 'border-primary bg-accent' : 'border-border',
                )}
              >
                <span
                  className="block text-sm leading-tight"
                  style={{
                    fontFamily: preset.heading,
                    fontWeight: preset.headingWeight,
                    letterSpacing: preset.tracking,
                  }}
                >
                  {preset.label}
                </span>
                <span className="block text-[10px] text-muted-foreground" style={{ fontFamily: preset.body }}>
                  Aa Bb 123
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default AppearanceSection;
