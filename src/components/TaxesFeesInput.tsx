import React from 'react';
import { Percent, Plus, Trash2, CreditCard, Receipt, Landmark } from 'lucide-react';
import FormSection from './FormSection';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export interface OtherFee {
  id: string;
  name: string;
  percentage: number;
}

export interface TaxesFeesData {
  cardFee: number;          // %
  installmentInterest?: number; // deprecated — kept for backward compat
  taxes: number;            // %
  otherFees: OtherFee[];
}

export const DEFAULT_TAXES_FEES: TaxesFeesData = {
  cardFee: 0,
  taxes: 0,
  otherFees: [],
};

const sumOtherFees = (items: OtherFee[]) =>
  items.reduce((s, i) => s + (Number.isFinite(i.percentage) ? i.percentage : 0), 0);

export const totalFeesPercentage = (d: TaxesFeesData): number => {
  return (d.cardFee || 0) + (d.installmentInterest || 0) + (d.taxes || 0) + sumOtherFees(d.otherFees);
};

interface Props {
  data: TaxesFeesData;
  onChange: (data: TaxesFeesData) => void;
  basePrice: number;
}

const PctInput: React.FC<{
  label: string;
  icon: React.ReactNode;
  value: number;
  onChange: (v: number) => void;
  hint?: string;
}> = ({ label, icon, value, onChange, hint }) => (
  <div>
    <label className="text-sm font-medium text-secondary-foreground mb-2 flex items-center gap-2">
      <span className="w-7 h-7 rounded-md bg-primary/10 text-primary flex items-center justify-center">{icon}</span>
      {label}
    </label>
    <div className="relative">
      <Input
        type="number"
        min={0}
        max={100}
        step="0.01"
        value={value || ''}
        onChange={(e) => {
          const v = parseFloat(e.target.value);
          onChange(Number.isFinite(v) ? Math.max(0, Math.min(100, v)) : 0);
        }}
        placeholder="0,00"
        className="pr-10"
      />
      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">%</span>
    </div>
    {hint && <p className="text-xs text-muted-foreground mt-1">{hint}</p>}
  </div>
);

const TaxesFeesInput: React.FC<Props> = ({ data, onChange, basePrice }) => {
  const total = totalFeesPercentage(data);
  const acrescimo = basePrice * (total / 100);
  const fmt = (v: number) =>
    v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const addOther = () => {
    onChange({
      ...data,
      otherFees: [...data.otherFees, { id: crypto.randomUUID(), name: '', percentage: 0 }],
    });
  };
  const updateOther = (id: string, patch: Partial<OtherFee>) => {
    onChange({
      ...data,
      otherFees: data.otherFees.map((o) => (o.id === id ? { ...o, ...patch } : o)),
    });
  };
  const removeOther = (id: string) => {
    onChange({ ...data, otherFees: data.otherFees.filter((o) => o.id !== id) });
  };

  return (
    <FormSection
      title="Taxas e Impostos"
      icon={<Percent className="w-5 h-5 text-primary" />}
      subtitle="Acrescidos sobre o preço final (cliente paga)"
    >
      <div className="col-span-full grid grid-cols-1 md:grid-cols-2 gap-4">
        <PctInput
          label="Taxa de cartão"
          icon={<CreditCard className="w-3.5 h-3.5" />}
          value={data.cardFee}
          onChange={(v) => onChange({ ...data, cardFee: v })}
          hint="Ex: 3,5% da maquininha"
        />
        <PctInput
          label="Impostos"
          icon={<Landmark className="w-3.5 h-3.5" />}
          value={data.taxes}
          onChange={(v) => onChange({ ...data, taxes: v })}
          hint="Ex: Simples Nacional 6%"
        />
      </div>

      <div className="col-span-full space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-secondary-foreground flex items-center gap-2">
            <Receipt className="w-4 h-4 text-primary" /> Outras taxas
          </label>
          <Button type="button" size="sm" variant="outline" onClick={addOther}>
            <Plus className="w-4 h-4 mr-1" /> Adicionar
          </Button>
        </div>
        {data.otherFees.length === 0 && (
          <p className="text-xs text-muted-foreground">Nenhuma taxa adicional.</p>
        )}
        {data.otherFees.map((o) => (
          <div key={o.id} className="grid grid-cols-[1fr_120px_auto] gap-2 items-start">
            <Input
              placeholder="Nome (ex: Antecipação)"
              value={o.name}
              maxLength={50}
              onChange={(e) => updateOther(o.id, { name: e.target.value })}
            />
            <div className="relative">
              <Input
                type="number"
                min={0}
                max={100}
                step="0.01"
                value={o.percentage || ''}
                placeholder="0,00"
                onChange={(e) => {
                  const v = parseFloat(e.target.value);
                  updateOther(o.id, { percentage: Number.isFinite(v) ? Math.max(0, Math.min(100, v)) : 0 });
                }}
                className="pr-8"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">%</span>
            </div>
            <Button type="button" size="icon" variant="ghost" onClick={() => removeOther(o.id)}>
              <Trash2 className="w-4 h-4 text-destructive" />
            </Button>
          </div>
        ))}
      </div>

      {total > 0 && basePrice > 0 && (
        <div className="col-span-full p-3 rounded-lg bg-primary/5 border border-primary/20 flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            Acréscimo total ({total.toLocaleString('pt-BR', { maximumFractionDigits: 2 })}%)
          </span>
          <span className="font-semibold text-foreground">{fmt(acrescimo)}</span>
        </div>
      )}
    </FormSection>
  );
};

export default TaxesFeesInput;
