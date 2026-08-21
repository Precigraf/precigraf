import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

interface LimitedInputProps {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  maxLength: number;
  placeholder?: string;
  error?: string | null;
}

export const LimitedInput: React.FC<LimitedInputProps> = ({
  id,
  label,
  value,
  onChange,
  maxLength,
  placeholder,
  error,
}) => {
  const near = value.length >= maxLength - 3;
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <Label htmlFor={id} className="text-xs">{label}</Label>
        <span
          className={cn(
            'text-[10px] tabular-nums',
            near ? 'text-destructive' : 'text-muted-foreground',
          )}
        >
          {value.length} / {maxLength}
        </span>
      </div>
      <Input
        id={id}
        value={value}
        maxLength={maxLength}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={!!error}
        className="h-9"
      />
      {near && !error && (
        <p className="text-[10px] text-muted-foreground">Textos longos são reduzidos no catálogo.</p>
      )}
      {error && <p className="text-[11px] text-destructive">{error}</p>}
    </div>
  );
};

interface ColorFieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
}

export const ColorField: React.FC<ColorFieldProps> = ({ id, label, value, onChange }) => {
  const normalize = (v: string) => {
    const t = v.trim();
    return /^#?[0-9a-fA-F]{6}$/.test(t) ? (t.startsWith('#') ? t : `#${t}`) : null;
  };
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-xs">{label}</Label>
      <div className="flex items-center gap-2">
        <input
          id={id}
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          aria-label={`${label} — seletor de cor`}
          className="h-9 w-10 rounded border border-input bg-background p-1 cursor-pointer shrink-0"
        />
        <Input
          value={value.toUpperCase()}
          onChange={(e) => {
            const n = normalize(e.target.value);
            if (n) onChange(n);
          }}
          aria-label={`${label} — código HEX`}
          className="h-9 font-mono text-xs"
        />
      </div>
    </div>
  );
};

interface PriceInputProps {
  value: number;
  onChange: (v: number) => void;
  ariaLabel: string;
}

/** Entrada monetária no padrão brasileiro (R$ 3,50). */
export const PriceInput: React.FC<PriceInputProps> = ({ value, onChange, ariaLabel }) => {
  const [text, setText] = React.useState(() =>
    value ? value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '',
  );
  const [focused, setFocused] = React.useState(false);

  React.useEffect(() => {
    if (focused) return;
    setText(
      value ? value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '',
    );
  }, [value, focused]);

  const handleChange = (raw: string) => {
    const digits = raw.replace(/\D/g, '').slice(0, 11);
    if (!digits) {
      setText('');
      onChange(0);
      return;
    }
    const cents = parseInt(digits, 10);
    const amount = Math.round(cents) / 100;
    setText(amount.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
    onChange(amount);
  };

  return (
    <div className="relative">
      <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">
        R$
      </span>
      <Input
        value={text}
        inputMode="numeric"
        placeholder="0,00"
        aria-label={ariaLabel}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        onChange={(e) => handleChange(e.target.value)}
        className="h-9 pl-8 text-right"
      />
    </div>
  );
};
