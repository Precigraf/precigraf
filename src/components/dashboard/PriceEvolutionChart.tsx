import React, { useMemo } from 'react';
import { TrendingUp, Calendar, Lock, Sparkles, LineChart as LineChartIcon } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface CalculationHistory {
  id: string;
  product_name: string;
  sale_price: number;
  profit: number;
  margin_percentage: number;
  created_at: string;
}

interface PriceEvolutionChartProps {
  calculations: CalculationHistory[];
  isPro: boolean;
  onShowUpgrade?: () => void;
}

const PriceEvolutionChart: React.FC<PriceEvolutionChartProps> = ({
  calculations,
  isPro,
  onShowUpgrade,
}) => {
  const chartData = useMemo(() => {
    if (!calculations || calculations.length === 0) return [];

    // Ordenar por data e pegar os últimos 10
    const sorted = [...calculations]
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
      .slice(-10);

    return sorted.map((calc, index) => ({
      name: `#${index + 1}`,
      date: new Date(calc.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
      preco: Math.round(calc.sale_price * 100) / 100,
      lucro: Math.round(calc.profit * 100) / 100,
      produto: calc.product_name || 'Sem nome',
    }));
  }, [calculations]);

  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  // Versão bloqueada
  if (!isPro) {
    return (
      <div className="relative bg-secondary/30 border border-border rounded-xl p-4 overflow-hidden">
        <div className="absolute inset-0 bg-background/60 backdrop-blur-[1px] z-10 flex flex-col items-center justify-center gap-2">
          <Lock className="w-5 h-5 text-muted-foreground" />
          <Badge variant="outline" className="text-xs bg-background/80">
            <Sparkles className="w-3 h-3 mr-1" />
            Disponível no plano PRO
          </Badge>
          <Button size="sm" onClick={onShowUpgrade} className="mt-2 text-xs">
            Fazer upgrade
          </Button>
        </div>

        <div className="opacity-40 pointer-events-none select-none">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <LineChartIcon className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground">Histórico de Evolução</h3>
              <p className="text-xs text-muted-foreground">Acompanhe seus cálculos ao longo do tempo</p>
            </div>
          </div>
          <div className="h-48 bg-secondary/50 rounded-lg flex items-center justify-center">
            <LineChartIcon className="w-12 h-12 text-muted-foreground/30" />
          </div>
        </div>
      </div>
    );
  }

  if (chartData.length === 0) {
    return (
      <div className="bg-secondary/30 border border-border rounded-xl p-4">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <LineChartIcon className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">Histórico de Evolução</h3>
            <p className="text-xs text-muted-foreground">Acompanhe seus cálculos ao longo do tempo</p>
          </div>
          <Badge variant="outline" className="ml-auto text-xs bg-primary/10 border-primary/30 text-primary">
            <Sparkles className="w-3 h-3 mr-1" />
            PRO
          </Badge>
        </div>
        <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">
          <div className="text-center">
            <Calendar className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>Nenhum cálculo salvo ainda.</p>
            <p className="text-xs">Salve cálculos para ver a evolução.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-primary/5 via-background to-primary/5 border border-primary/20 rounded-xl p-4">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
          <TrendingUp className="w-4 h-4 text-primary" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-foreground">Histórico de Evolução</h3>
          <p className="text-xs text-muted-foreground">Últimos {chartData.length} cálculos</p>
        </div>
        <Badge variant="outline" className="ml-auto text-xs bg-primary/10 border-primary/30 text-primary">
          <Sparkles className="w-3 h-3 mr-1" />
          PRO
        </Badge>
      </div>

      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
            <XAxis 
              dataKey="date" 
              tick={{ fontSize: 10 }}
              className="text-muted-foreground"
            />
            <YAxis 
              tick={{ fontSize: 10 }}
              tickFormatter={(value) => `R$${value}`}
              className="text-muted-foreground"
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div className="bg-popover border border-border rounded-lg p-3 shadow-lg text-sm">
                      <p className="font-medium text-foreground mb-1">{data.produto}</p>
                      <p className="text-xs text-muted-foreground mb-2">{data.date}</p>
                      <div className="space-y-1">
                        <p className="text-primary">
                          Preço: <span className="font-medium">{formatCurrency(data.preco)}</span>
                        </p>
                        <p className="text-success">
                          Lucro: <span className="font-medium">{formatCurrency(data.lucro)}</span>
                        </p>
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Legend 
              wrapperStyle={{ fontSize: '12px' }}
              formatter={(value) => (
                <span className="text-muted-foreground">
                  {value === 'preco' ? 'Preço' : 'Lucro'}
                </span>
              )}
            />
            <Line
              type="monotone"
              dataKey="preco"
              name="preco"
              stroke="hsl(var(--primary))"
              strokeWidth={2}
              dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2, r: 3 }}
              activeDot={{ r: 5 }}
            />
            <Line
              type="monotone"
              dataKey="lucro"
              name="lucro"
              stroke="hsl(var(--success))"
              strokeWidth={2}
              dot={{ fill: 'hsl(var(--success))', strokeWidth: 2, r: 3 }}
              activeDot={{ r: 5 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default PriceEvolutionChart;
