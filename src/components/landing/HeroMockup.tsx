import React from 'react';
import { Card } from '@/components/ui/card';
import { TrendingUp, DollarSign, Percent, Package } from 'lucide-react';

const Row: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="flex items-center justify-between text-xs sm:text-sm py-2 border-b border-border/60 last:border-0">
    <span className="text-muted-foreground">{label}</span>
    <span className="font-medium text-foreground tabular-nums">{value}</span>
  </div>
);

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
              <p className="text-sm font-semibold text-foreground">Cartão de visita 4x4</p>
              <p className="text-xs text-muted-foreground">1.000 unidades</p>
            </div>
          </div>

          <div className="space-y-1">
            <Row label="Papel couché 300g" value="R$ 84,00" />
            <Row label="Tinta CMYK" value="R$ 22,40" />
            <Row label="Mão de obra" value="R$ 35,00" />
            <Row label="Custos operacionais" value="R$ 18,60" />
            <Row label="Acabamento (laminação)" value="R$ 27,00" />
          </div>

          <div className="mt-5 flex items-center justify-between p-3 rounded-lg bg-muted/60">
            <span className="text-xs sm:text-sm font-medium text-foreground">Custo total</span>
            <span className="text-base font-bold text-foreground tabular-nums">R$ 187,00</span>
          </div>
        </Card>

        {/* Result card */}
        <Card className="lg:col-span-2 p-5 sm:p-6 bg-foreground text-background border-foreground shadow-card flex flex-col justify-between min-h-[260px]">
          <div>
            <div className="flex items-center gap-2 mb-1 text-background/60 text-xs uppercase tracking-wider">
              <TrendingUp className="w-3.5 h-3.5" />
              Preço final sugerido
            </div>
            <p className="text-4xl sm:text-5xl font-bold tabular-nums leading-none mt-3">
              R$ 374,00
            </p>
            <p className="text-xs text-background/60 mt-2">com margem real de 50%</p>
          </div>

          <div className="grid grid-cols-2 gap-3 mt-6">
            <div className="rounded-lg bg-background/10 p-3">
              <div className="flex items-center gap-1.5 text-[11px] text-background/60">
                <Percent className="w-3 h-3" /> Margem
              </div>
              <p className="text-base font-semibold mt-1">50%</p>
            </div>
            <div className="rounded-lg bg-background/10 p-3">
              <div className="flex items-center gap-1.5 text-[11px] text-background/60">
                <DollarSign className="w-3 h-3" /> Lucro
              </div>
              <p className="text-base font-semibold mt-1">R$ 187,00</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default HeroMockup;
