import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ArrowDown, ArrowUp, Plus, Trash2 } from 'lucide-react';
import {
  CatalogConfig,
  MAX_PRICE_ROWS,
  TEXT_LIMITS,
  newId,
} from '@/lib/catalogBuilder/types';
import { LimitedInput, PriceInput } from '../EditorFields';

interface Props {
  config: CatalogConfig;
  update: (fn: (c: CatalogConfig) => CatalogConfig) => void;
  rowsError?: string | null;
}

const PricingSection: React.FC<Props> = ({ config, update, rowsError }) => {
  const { pricing } = config;

  const setRows = (rows: typeof pricing.rows) =>
    update((c) => ({ ...c, pricing: { ...c.pricing, rows } }));

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

      <div className="space-y-2">
        <Label className="text-xs">Os valores representam</Label>
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
            <Label htmlFor="type-total" className="text-xs font-normal">Preço total (pacote)</Label>
          </div>
        </RadioGroup>
        {pricing.type === 'unit' && (
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

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-xs">Linhas ({pricing.rows.length}/{MAX_PRICE_ROWS})</Label>
        </div>
        <div className="space-y-2">
          {pricing.rows.map((row, i) => (
            <div key={row.id} className="flex flex-wrap items-center gap-1.5">
              <Input
                value={row.quantity}
                maxLength={TEXT_LIMITS.quantity}
                placeholder="20 unidades"
                aria-label={`Quantidade da linha ${i + 1}`}
                onChange={(e) =>
                  setRows(pricing.rows.map((r) => (r.id === row.id ? { ...r, quantity: e.target.value } : r)))
                }
                className="h-9 flex-1 min-w-0"
              />
              <div className="w-28 shrink-0">
                <PriceInput
                  value={row.price}
                  placeholder={pricing.type === 'unit' ? 'Valor un.' : 'Valor total'}
                  ariaLabel={`Preço da linha ${i + 1}`}
                  onChange={(v) =>
                    setRows(pricing.rows.map((r) => (r.id === row.id ? { ...r, price: v } : r)))
                  }
                />
              </div>
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

              {pricing.showDiscount && (
                <div className="w-full flex items-center gap-2 pl-1">
                  <span className="text-[11px] text-muted-foreground shrink-0">Promocional</span>
                  <div className="w-28 shrink-0">
                    <PriceInput
                      value={row.promoPrice ?? 0}
                      ariaLabel={`Preço promocional da linha ${i + 1}`}
                      onChange={(v) =>
                        setRows(
                          pricing.rows.map((r) =>
                            r.id === row.id ? { ...r, promoPrice: v > 0 ? v : null } : r,
                          ),
                        )
                      }
                    />
                  </div>
                  <span className="text-[11px] font-medium text-primary tabular-nums">
                    {row.promoPrice && row.promoPrice > 0 && row.promoPrice < row.price
                      ? `-${Math.round(((row.price - row.promoPrice) / row.price) * 100)}%`
                      : ''}
                  </span>
                </div>
              )}
            </div>
          ))}
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

      <div className="space-y-2 pt-3 border-t border-border">
        <div className="flex items-center justify-between gap-3">
          <div>
            <Label htmlFor="show-discount" className="text-xs">Ativar preços promocionais</Label>
            <p className="text-[11px] text-muted-foreground">
              Mostra o preço atual riscado, o valor da oferta e o % de desconto.
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
      </div>

      <div className="space-y-2 pt-2 border-t border-border">
        <Label className="text-xs">Os valores representam</Label>
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
        {pricing.type === 'unit' && (
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
