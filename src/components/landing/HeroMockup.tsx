import React from 'react';
import { Card } from '@/components/ui/card';
import { TrendingUp, DollarSign, Percent, Package, Sparkles } from 'lucide-react';

const Row: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="flex items-center justify-between text-xs sm:text-sm py-2 border-b border-border/60 last:border-0">
    <span className="text-muted-foreground">{label}</span>
    <span className="font-medium text-foreground tabular-nums">{value}</span>
  </div>
);

// Single source of truth — todos os valores derivam destas constantes
const COST_ITEMS: Array<{ label: string; value: number }> = [
  { label: 'Papel Offset 180g', value: 56.8 },
  { label: 'Alça', value: 11.0 },
  { label: 'Mão de obra', value: 9.25 },
  { label: 'Custos operacionais', value: 11.6 },
  { label: 'Acabamento (laminação)', value: 27.0 },
];
const TOTAL_COST = COST_ITEMS.reduce((s, i) => s + i.value, 0); // 115,65
// Final Price = Cost / (1 - Margin) — usamos margem real de 40%
const TARGET_MARGIN = 0.4;
const FINAL_PRICE = TOTAL_COST / (1 - TARGET_MARGIN); // 192,75
const PROFIT = FINAL_PRICE - TOTAL_COST;
const REAL_MARGIN_PCT = (PROFIT / FINAL_PRICE) * 100;

const fmtBRL = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const fmtPct = (v: number) =>
  `${v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`;

const HeroMockup: React.FC = () => {
  return (
    <div className="relative">
      {/* Glow */}
      <div className="absolute -inset-6 bg-foreground/5 blur-3xl rounded-full pointer-events-none" />

      <div className="relative grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Inputs card */}
        <Card className="lg:col-span-3 p-5 sm:p-6 bg-card border-border shadow-card">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-foreground/10 flex items-center justify-center">
              <Package className="w-4 h-4 text-foreground" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">Sacola Personalizada</p>
              <p className="text-xs text-muted-foreground">100 unidades</p>
            </div>
          </div>

          <div className="space-y-1">
            {COST_ITEMS.map((item) => (
              <Row key={item.label} label={item.label} value={fmtBRL(item.value)} />
            ))}
          </div>

          <div className="mt-5 flex items-center justify-between p-3 rounded-lg bg-muted/60">
            <span className="text-xs sm:text-sm font-medium text-foreground">Custo total</span>
            <span className="text-base font-bold text-foreground tabular-nums">{fmtBRL(TOTAL_COST)}</span>
          </div>
        </Card>

        {/* Result card */}
        <Card className="relative lg:col-span-2 p-6 sm:p-7 bg-foreground text-background border-foreground shadow-card flex flex-col justify-between min-h-[340px] overflow-hidden">
          {/* Decorative gradient orb */}
          <div className="pointer-events-none absolute -top-16 -right-16 w-48 h-48 rounded-full bg-background/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-20 -left-10 w-40 h-40 rounded-full bg-background/5 blur-3xl" />

          <div className="relative min-w-0">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-background/10 border border-background/15 text-[10px] uppercase tracking-wider text-background/80">
              <Sparkles className="w-3 h-3" />
              Sugestão inteligente
            </div>

            <div className="mt-5 min-w-0">
              <p className="text-xs text-background/60 flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5" />
                Preço final sugerido
              </p>
              <p className="font-bold tabular-nums leading-tight mt-2 tracking-tight whitespace-nowrap text-[clamp(1.75rem,5.2vw,2.75rem)]">
                {fmtBRL(FINAL_PRICE)}
              </p>
              <div className="mt-3 h-px w-16 bg-background/30" />
              <p className="text-xs text-background/70 mt-3">
                com margem real de{' '}
                <span className="font-semibold text-background">{fmtPct(REAL_MARGIN_PCT)}</span>
              </p>

              {/* Margem health bar */}
              <div className="mt-3 h-1.5 w-full rounded-full bg-background/10 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-background/60 to-background"
                  style={{ width: `${REAL_MARGIN_PCT}%` }}
                />
              </div>
            </div>
          </div>

          <div className="relative grid grid-cols-2 gap-3 mt-6 items-stretch">
            <div className="flex flex-col h-full min-w-0 rounded-xl bg-background/10 border border-background/15 p-3.5 hover:bg-background/15 transition-colors">
              <div className="flex items-center gap-1.5 text-[11px] text-background/70">
                <span className="w-5 h-5 rounded-md bg-background/15 flex items-center justify-center shrink-0">
                  <Percent className="w-3 h-3" />
                </span>
                <span>Margem</span>
              </div>
              <p className="text-base sm:text-lg font-bold mt-2 tabular-nums truncate">
                {fmtPct(REAL_MARGIN_PCT)}
              </p>
            </div>
            <div className="flex flex-col h-full min-w-0 rounded-xl bg-background/10 border border-background/15 p-3.5 hover:bg-background/15 transition-colors">
              <div className="flex items-center gap-1.5 text-[11px] text-background/70">
                <span className="w-5 h-5 rounded-md bg-background/15 flex items-center justify-center shrink-0">
                  <DollarSign className="w-3 h-3" />
                </span>
                <span>Lucro</span>
              </div>
              <p className="text-base sm:text-lg font-bold mt-2 tabular-nums truncate">
                {fmtBRL(PROFIT)}
              </p>
            </div>
          </div>

          <div className="relative flex items-center gap-2 mt-5 text-[10px] text-background/60">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-70 animate-ping" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
            </span>
            Recalculado em tempo real
          </div>
        </Card>
      </div>
    </div>
  );
};

export default HeroMockup;
