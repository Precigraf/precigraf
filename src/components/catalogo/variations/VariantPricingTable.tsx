import React from 'react';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Minus, Plus, Infinity as InfinityIcon } from 'lucide-react';

export interface VariantRow {
  id?: string;
  name: string;
  price: string;
  promo_price: string;
  is_active: boolean;
  stock_type: 'infinite' | 'limited';
  stock: string; // numeric string when stock_type='limited'
}

interface Props {
  label: string;
  rows: VariantRow[];
  onChange: (next: VariantRow[]) => void;
}

const MoneyInput: React.FC<{ value: string; onChange: (v: string) => void; disabled?: boolean }> = ({
  value, onChange, disabled,
}) => (
  <div className="relative">
    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">R$</span>
    <Input
      className="pl-8 h-9 text-sm"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder="0,00"
      inputMode="decimal"
      disabled={disabled}
    />
  </div>
);

export const VariantPricingTable: React.FC<Props> = ({ label, rows, onChange }) => {
  const patch = (i: number, p: Partial<VariantRow>) =>
    onChange(rows.map((r, idx) => (idx === i ? { ...r, ...p } : r)));

  const decStock = (i: number) => {
    const r = rows[i];
    if (r.stock_type === 'infinite') return;
    const n = Math.max(0, (parseInt(r.stock) || 0) - 1);
    patch(i, { stock: String(n) });
  };
  const incStock = (i: number) => {
    const r = rows[i];
    if (r.stock_type === 'infinite') {
      patch(i, { stock_type: 'limited', stock: '1' });
      return;
    }
    const n = (parseInt(r.stock) || 0) + 1;
    patch(i, { stock: String(n) });
  };
  const toggleInfinite = (i: number) => {
    const r = rows[i];
    if (r.stock_type === 'infinite') patch(i, { stock_type: 'limited', stock: '1' });
    else patch(i, { stock_type: 'infinite', stock: '' });
  };

  if (rows.length === 0) return null;

  return (
    <div className="border border-border rounded-lg overflow-hidden">
      {/* Desktop header */}
      <div className="hidden md:grid grid-cols-[1.5fr_60px_1fr_1fr_140px] gap-3 px-3 py-2 bg-muted/40 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
        <div>{label || 'Variações'}</div>
        <div className="text-center">Ativa</div>
        <div>Preço</div>
        <div>Preço promocional</div>
        <div className="text-center">Estoque</div>
      </div>

      <div className="divide-y divide-border">
        {rows.map((r, i) => (
          <div key={i} className="md:grid md:grid-cols-[1.5fr_60px_1fr_1fr_140px] md:gap-3 md:items-center md:px-3 md:py-2 p-3 space-y-3 md:space-y-0">
            {/* Mobile label */}
            <div className="flex items-center justify-between md:block">
              <div className="font-medium text-sm">{r.name}</div>
              <div className="md:hidden">
                <Switch checked={r.is_active} onCheckedChange={(v) => patch(i, { is_active: v })} />
              </div>
            </div>

            <div className="hidden md:flex md:justify-center">
              <Switch checked={r.is_active} onCheckedChange={(v) => patch(i, { is_active: v })} />
            </div>

            <div>
              <div className="md:hidden text-[11px] text-muted-foreground mb-1">Preço</div>
              <MoneyInput
                value={r.price}
                onChange={(v) => patch(i, { price: v })}
                disabled={!r.is_active}
              />
            </div>

            <div>
              <div className="md:hidden text-[11px] text-muted-foreground mb-1">Preço promocional</div>
              <MoneyInput
                value={r.promo_price}
                onChange={(v) => patch(i, { promo_price: v })}
                disabled={!r.is_active}
              />
            </div>

            <div>
              <div className="md:hidden text-[11px] text-muted-foreground mb-1">Estoque</div>
              <div className="inline-flex items-center border border-border rounded-md h-9 w-full md:w-auto justify-between">
                <button
                  type="button"
                  onClick={() => decStock(i)}
                  className="w-8 h-9 flex items-center justify-center hover:bg-muted disabled:opacity-40"
                  disabled={!r.is_active || r.stock_type === 'infinite'}
                  aria-label="Diminuir estoque"
                >
                  <Minus className="w-3 h-3" />
                </button>
                <button
                  type="button"
                  onClick={() => toggleInfinite(i)}
                  className="px-2 text-sm font-medium min-w-[40px] text-center hover:bg-muted h-9"
                  disabled={!r.is_active}
                  title={r.stock_type === 'infinite' ? 'Tornar estoque limitado' : 'Tornar estoque infinito'}
                >
                  {r.stock_type === 'infinite' ? (
                    <InfinityIcon className="w-4 h-4 inline" />
                  ) : (
                    <input
                      type="number"
                      min={0}
                      value={r.stock}
                      onChange={(e) => patch(i, { stock: e.target.value })}
                      onClick={(e) => e.stopPropagation()}
                      className="w-12 bg-transparent text-center text-sm outline-none"
                    />
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => incStock(i)}
                  className="w-8 h-9 flex items-center justify-center hover:bg-muted disabled:opacity-40"
                  disabled={!r.is_active}
                  aria-label="Aumentar estoque"
                >
                  <Plus className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default VariantPricingTable;
