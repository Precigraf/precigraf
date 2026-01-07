import React from 'react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useCalculations } from '@/hooks/useCalculations';
import { PieChart as PieChartIcon, BarChart3, TrendingUp } from 'lucide-react';

const Dashboard: React.FC = () => {
  const { calculations, loading } = useCalculations();

  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });
  };

  // Aggregate cost breakdown from all calculations
  const costBreakdown = React.useMemo(() => {
    if (calculations.length === 0) return [];

    const totals = calculations.reduce(
      (acc, calc) => {
        acc.materials += calc.paper_cost + calc.ink_cost + calc.varnish_cost + calc.other_material_cost;
        acc.operational += calc.labor_cost + calc.energy_cost + calc.equipment_cost + calc.rent_cost + calc.other_operational_cost;
        return acc;
      },
      { materials: 0, operational: 0 }
    );

    return [
      { name: 'Matéria-prima', value: totals.materials, color: 'hsl(45, 90%, 61%)' },
      { name: 'Operacional', value: totals.operational, color: 'hsl(200, 70%, 50%)' },
    ];
  }, [calculations]);

  // Prepare bar chart data - compare calculations
  const barChartData = React.useMemo(() => {
    return calculations.slice(0, 8).map((calc) => ({
      name: calc.product_name.length > 15 ? calc.product_name.slice(0, 12) + '...' : calc.product_name,
      custo: calc.total_cost,
      lucro: calc.profit,
      venda: calc.sale_price,
    }));
  }, [calculations]);

  // Detailed material breakdown pie chart
  const materialBreakdown = React.useMemo(() => {
    if (calculations.length === 0) return [];

    const totals = calculations.reduce(
      (acc, calc) => {
        acc.paper += calc.paper_cost;
        acc.ink += calc.ink_cost;
        acc.varnish += calc.varnish_cost;
        acc.other += calc.other_material_cost;
        return acc;
      },
      { paper: 0, ink: 0, varnish: 0, other: 0 }
    );

    return [
      { name: 'Papel', value: totals.paper, color: 'hsl(45, 90%, 61%)' },
      { name: 'Alça', value: totals.ink, color: 'hsl(25, 85%, 55%)' },
      { name: 'Tinta', value: totals.varnish, color: 'hsl(35, 80%, 50%)' },
      { name: 'Outros', value: totals.other, color: 'hsl(15, 75%, 45%)' },
    ].filter(item => item.value > 0);
  }, [calculations]);

  // Summary stats
  const stats = React.useMemo(() => {
    if (calculations.length === 0) {
      return { totalRevenue: 0, totalProfit: 0, avgMargin: 0 };
    }

    const totalRevenue = calculations.reduce((sum, calc) => sum + calc.sale_price, 0);
    const totalProfit = calculations.reduce((sum, calc) => sum + calc.profit, 0);
    const avgMargin = calculations.reduce((sum, calc) => sum + calc.margin_percentage, 0) / calculations.length;

    return { totalRevenue, totalProfit, avgMargin };
  }, [calculations]);

  if (loading) {
    return (
      <div className="glass-card p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-secondary rounded w-1/3"></div>
          <div className="h-64 bg-secondary rounded"></div>
        </div>
      </div>
    );
  }

  if (calculations.length === 0) {
    return (
      <div className="glass-card p-6">
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-bold text-foreground">Dashboard</h3>
        </div>
        <div className="text-center py-12">
          <PieChartIcon className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
          <p className="text-muted-foreground">Salve alguns cálculos para ver estatísticas</p>
          <p className="text-sm text-muted-foreground/70 mt-1">
            Os gráficos aparecerão quando você tiver dados salvos
          </p>
        </div>
      </div>
    );
  }

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card border border-border rounded-lg px-3 py-2 shadow-lg">
          <p className="text-sm font-medium text-foreground">{payload[0].name}</p>
          <p className="text-sm text-primary font-bold">{formatCurrency(payload[0].value)}</p>
        </div>
      );
    }
    return null;
  };

  const BarTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card border border-border rounded-lg px-3 py-2 shadow-lg">
          <p className="text-sm font-medium text-foreground mb-1">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-xs" style={{ color: entry.color }}>
              {entry.name}: {formatCurrency(entry.value)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-card p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-primary" />
            <span className="text-xs text-muted-foreground">Receita Total</span>
          </div>
          <p className="text-xl font-bold text-primary">{formatCurrency(stats.totalRevenue)}</p>
        </div>
        <div className="glass-card p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-success" />
            <span className="text-xs text-muted-foreground">Lucro Total</span>
          </div>
          <p className="text-xl font-bold text-success">{formatCurrency(stats.totalProfit)}</p>
        </div>
        <div className="glass-card p-4">
          <div className="flex items-center gap-2 mb-2">
            <PieChartIcon className="w-4 h-4 text-primary" />
            <span className="text-xs text-muted-foreground">Margem Média</span>
          </div>
          <p className="text-xl font-bold text-foreground">{stats.avgMargin.toFixed(1)}%</p>
        </div>
      </div>

      {/* Pie Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Cost Breakdown Pie */}
        <div className="glass-card p-6">
          <div className="flex items-center gap-2 mb-4">
            <PieChartIcon className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-bold text-foreground">Custos: Material vs Operacional</h3>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={costBreakdown}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={4}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {costBreakdown.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} stroke="transparent" />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-6 mt-4">
            {costBreakdown.map((item, index) => (
              <div key={index} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-sm text-muted-foreground">{item.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Material Breakdown Pie */}
        <div className="glass-card p-6">
          <div className="flex items-center gap-2 mb-4">
            <PieChartIcon className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-bold text-foreground">Detalhamento de Materiais</h3>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={materialBreakdown}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={4}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {materialBreakdown.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} stroke="transparent" />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap justify-center gap-4 mt-4">
            {materialBreakdown.map((item, index) => (
              <div key={index} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-sm text-muted-foreground">{item.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bar Chart - Comparison */}
      <div className="glass-card p-6">
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-bold text-foreground">Comparativo de Cálculos</h3>
        </div>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={barChartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
              <XAxis 
                dataKey="name" 
                stroke="hsl(var(--muted-foreground))"
                fontSize={11}
                angle={-45}
                textAnchor="end"
                height={60}
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
              />
              <YAxis 
                stroke="hsl(var(--muted-foreground))"
                fontSize={11}
                tickFormatter={(value) => `R$${(value / 1000).toFixed(0)}k`}
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
              />
              <Tooltip content={<BarTooltip />} />
              <Legend 
                wrapperStyle={{ paddingTop: '20px' }}
                formatter={(value) => <span style={{ color: 'hsl(var(--muted-foreground))' }}>{value}</span>}
              />
              <Bar dataKey="custo" name="Custo" fill="hsl(0, 0%, 40%)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="lucro" name="Lucro" fill="hsl(142, 76%, 45%)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="venda" name="Venda" fill="hsl(45, 90%, 61%)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
