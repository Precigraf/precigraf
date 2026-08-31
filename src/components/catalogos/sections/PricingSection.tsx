import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ArrowDown, ArrowUp, Plus, Star, Trash2 } from 'lucide-react';
import {
  CatalogConfig,
  MAX_PRICE_ROWS,
  TEXT_LIMITS,
  formatBRL,
  newId,
} from '@/lib/catalogBuilder/types';
import { BADGE_SUGGESTIONS, computePriceRow } from '@/lib/catalogBuilder/pricing';
import { LimitedInput, PriceInput } from '../EditorFields';

interface Props {
  config: CatalogConfig;
  update: (fn: (c: CatalogConfig) => CatalogConfig) => void;
  rowsError?: string | null;
}

const PricingSection: React.FC<Props> = ({ config, update, rowsError }) => {
  const { pricing } = config;
  const showTotals = pricing.showTotals !== false;
  const showSavings = pricing.showSavings !== false;

  const setRows = (rows: typeof pricing.rows) =>
    update((c) => ({ ...c, pricing: { ...c.pricing, rows } }));

  const patchRow = (id: string, p: Partial<(typeof pricing.rows)[number]>) =>
    setRows(pricing.rows.map((r) => (r.id === id ? { ...r, ...p } : r)));

  /** Apenas uma faixa em destaque por tabela. */
  const setFeatured = (id: string, value: boolean) =>
    setRows(pricing.rows.map((r) => ({ ...r, featured: value && r.id === id })));

  const move = (index: number, dir: -1 | 1) => {
    const next = [...pricing.rows];
    const target = index + dir;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    setRows(next);
  };

  return (
    <div className="space-y-4">
      <LimitedInput
        id="pricing-title"
        label="Título da tabela"
        value={pricing.title}
        maxLength={TEXT_LIMITS.pricingTitle}
        onChange={(v) => update((c) => ({ ...c, pricing: { ...c.pricing, title: v } }))}
      />

      <div className="space-y-2">
        <Label className="text-xs">Origem dos valores</Label>
        <RadioGroup
          value={pricing.source}
          onValueChange={(v) =>
            update((c) => ({ ...c, pricing: { ...c.pricing, source: v as typeof pricing.source } }))
          }
          className="gap-2"
        >
          <div className="flex items-center gap-2">
            <RadioGroupItem value="manual" id="src-manual" />
            <Label htmlFor="src-manual" className="text-xs font-normal">Inserir manualmente</Label>
          </div>
          <div className="flex items-center gap-2 opacity-50">
            <RadioGroupItem value="precigraf" id="src-precigraf" disabled />
            <Label htmlFor="src-precigraf" className="text-xs font-normal">
              Usar uma precificação do Precigraf (em breve)
            </Label>
          </div>
        </RadioGroup>
      </div>

      <datalist id="badge-suggestions">
        {BADGE_SUGGESTIONS.map((b) => (
          <option key={b} value={b} />
        ))}
      </datalist>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-xs">Faixas ({pricing.rows.length}/{MAX_PRICE_ROWS})</Label>
        </div>

        <div className="space-y-3">
          {pricing.rows.map((row, i) => {
            const c = computePriceRow(row, pricing);
            const promoInvalid =
              pricing.showDiscount &&
              typeof row.promoPrice === 'number' &&
              row.promoPrice > 0 &&
              row.promoPrice > row.price;

            return (
              <div
                key={row.id}
                className={`rounded-lg border p-3 space-y-2 ${
                  row.featured ? 'border-primary bg-primary/5' : 'border-border'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <Input
                    value={row.quantity}
                    maxLength={TEXT_LIMITS.quantity}
                    placeholder="100 unidades"
                    aria-label={`Quantidade da linha ${i + 1}`}
                    onChange={(e) => patchRow(row.id, { quantity: e.target.value })}
                    className="h-9 flex-1 min-w-0"
                  />
                  <div className="flex flex-col shrink-0">
                    <button
                      type="button"
                      aria-label={`Mover linha ${i + 1} para cima`}
                      disabled={i === 0}
                      onClick={() => move(i, -1)}
                      className="p-0.5 text-muted-foreground hover:text-foreground disabled:opacity-30"
                    >
                      <ArrowUp className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      aria-label={`Mover linha ${i + 1} para baixo`}
                      disabled={i === pricing.rows.length - 1}
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
                    aria-label={`Excluir linha ${i + 1}`}
                    onClick={() => setRows(pricing.rows.filter((r) => r.id !== row.id))}
                  >
                    <Trash2 className="w-3.5 h-3.5 text-destructive" />
                  </Button>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <span className="text-[11px] text-muted-foreground">
                      {pricing.type === 'total' ? 'Valor normal' : 'Preço normal por un.'}
                    </span>
                    <PriceInput
                      value={row.price}
                      ariaLabel={`Preço normal da linha ${i + 1}`}
                      onChange={(v) => patchRow(row.id, { price: v })}
                    />
                  </div>
                  {pricing.showDiscount && (
                    <div className="space-y-1">
                      <span className="text-[11px] text-muted-foreground">
                        {pricing.type === 'total' ? 'Valor atual' : 'Preço atual por un.'}
                      </span>
                      <PriceInput
                        value={row.promoPrice ?? 0}
                        ariaLabel={`Preço atual da linha ${i + 1}`}
                        onChange={(v) => patchRow(row.id, { promoPrice: v > 0 ? v : null })}
                      />
                    </div>
                  )}
                </div>

                {promoInvalid && (
                  <p className="text-[11px] text-destructive">
                    O preço atual precisa ser menor que o preço normal.
                  </p>
                )}

                <div className="flex items-center gap-2">
                  <Input
                    value={row.badge ?? ''}
                    list="badge-suggestions"
                    maxLength={24}
                    placeholder="Etiqueta (ex.: Mais vendido)"
                    aria-label={`Etiqueta da linha ${i + 1}`}
                    onChange={(e) => patchRow(row.id, { badge: e.target.value })}
                    className="h-9 flex-1 min-w-0"
                  />
                  <button
                    type="button"
                    onClick={() => setFeatured(row.id, !row.featured)}
                    aria-pressed={!!row.featured}
                    title="Destacar esta opção"
                    className={`h-9 px-2.5 rounded-md border text-[11px] font-medium inline-flex items-center gap-1 shrink-0 ${
                      row.featured
                        ? 'border-primary text-primary bg-primary/10'
                        : 'border-border text-muted-foreground'
                    }`}
                  >
                    <Star className={`w-3.5 h-3.5 ${row.featured ? 'fill-current' : ''}`} />
                    Destaque
                  </button>
                </div>

                {c.hasTotals ? (
                  <div className="text-[11px] text-muted-foreground space-y-0.5 tabular-nums">
                    {c.hasPromo && c.totalNormal !== null && (
                      <div>Total normal: {formatBRL(c.totalNormal)}</div>
                    )}
                    <div>Total atual: {formatBRL(c.totalCurrent!)}</div>
                    {c.unitCurrent !== null && <div>Por unidade: {formatBRL(c.unitCurrent)}</div>}
                  </div>
                ) : (
                  <p className="text-[11px] text-muted-foreground">
                    Inclua o número na quantidade (ex.: “100 unidades”) para calcular o valor total.
                  </p>
                )}
              </div>
            );
          })}
        </div>

        {rowsError && <p className="text-[11px] text-destructive">{rowsError}</p>}
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={pricing.rows.length >= MAX_PRICE_ROWS}
          onClick={() => setRows([...pricing.rows, { id: newId(), quantity: '', price: 0 }])}
        >
          <Plus className="w-3.5 h-3.5 mr-1.5" />
          Adicionar quantidade
        </Button>
      </div>

      <div className="space-y-3 pt-3 border-t border-border">
        <div className="flex items-center justify-between gap-3">
          <div>
            <Label htmlFor="show-discount" className="text-xs">Ativar preços promocionais</Label>
            <p className="text-[11px] text-muted-foreground">
              Mostra o valor anterior riscado e o valor atual em destaque.
            </p>
          </div>
          <Switch
            id="show-discount"
            checked={pricing.showDiscount}
            onCheckedChange={(v) =>
              update((c) => ({ ...c, pricing: { ...c.pricing, showDiscount: v } }))
            }
          />
        </div>

        <div className="flex items-center justify-between gap-3">
          <div>
            <Label htmlFor="show-totals" className="text-xs">Destacar valor total do pedido</Label>
            <p className="text-[11px] text-muted-foreground">
              O total vira a informação principal e o preço por unidade fica secundário.
            </p>
          </div>
          <Switch
            id="show-totals"
            checked={showTotals}
            onCheckedChange={(v) =>
              update((c) => ({ ...c, pricing: { ...c.pricing, showTotals: v } }))
            }
          />
        </div>
      </div>

      <div className="space-y-2 pt-2 border-t border-border">
        <Label className="text-xs">Os valores digitados representam</Label>
        <RadioGroup
          value={pricing.type}
          onValueChange={(v) =>
            update((c) => ({ ...c, pricing: { ...c.pricing, type: v as typeof pricing.type } }))
          }
          className="gap-2"
        >
          <div className="flex items-center gap-2">
            <RadioGroupItem value="unit" id="type-unit" />
            <Label htmlFor="type-unit" className="text-xs font-normal">Preço por unidade</Label>
          </div>
          <div className="flex items-center gap-2">
            <RadioGroupItem value="total" id="type-total" />
            <Label htmlFor="type-total" className="text-xs font-normal">Preço total</Label>
          </div>
        </RadioGroup>
        {pricing.type === 'unit' && !showTotals && (
          <div className="flex items-center justify-between pt-1">
            <Label htmlFor="show-unit" className="text-xs">Exibir “/un.” no catálogo</Label>
            <Switch
              id="show-unit"
              checked={pricing.showUnitLabel}
              onCheckedChange={(v) =>
                update((c) => ({ ...c, pricing: { ...c.pricing, showUnitLabel: v } }))
              }
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default PricingSection;
