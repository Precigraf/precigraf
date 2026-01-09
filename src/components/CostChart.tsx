import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

interface CostChartProps {
  rawMaterialsCost: number;
  operationalCost: number;
  profit: number;
  marketplaceFees: number;
}

const CostChart: React.FC<CostChartProps> = ({
  rawMaterialsCost,
  operationalCost,
  profit,
  marketplaceFees,
}) => {
  const total = rawMaterialsCost + operationalCost + profit + marketplaceFees;
  
  if (total <= 0) return null;

  const data = [
    { name: 'Matéria-prima', value: rawMaterialsCost, color: 'hsl(var(--primary))' },
    { name: 'Operacional', value: operationalCost, color: 'hsl(var(--muted-foreground))' },
    { name: 'Lucro', value: profit, color: 'hsl(var(--success))' },
  ];

  if (marketplaceFees > 0) {
    data.push({ name: 'Taxas', value: marketplaceFees, color: 'hsl(var(--warning))' });
  }

  // Filtrar itens com valor 0
  const filteredData = data.filter(item => item.value > 0);

  if (filteredData.length === 0) return null;

  const formatPercent = (value: number) => {
    return ((value / total) * 100).toFixed(1);
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-card border border-border rounded-lg p-2 shadow-lg">
          <p className="text-sm font-medium text-foreground">{data.name}</p>
          <p className="text-sm text-muted-foreground">
            {formatPercent(data.value)}%
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-secondary/30 rounded-xl p-4">
      <h4 className="text-sm font-medium text-foreground mb-4 text-center">
        Composição do Preço
      </h4>
      
      <div className="h-32">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={filteredData}
              cx="50%"
              cy="50%"
              innerRadius={30}
              outerRadius={50}
              paddingAngle={2}
              dataKey="value"
            >
              {filteredData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="flex flex-wrap justify-center gap-3 mt-3">
        {filteredData.map((item, index) => (
          <div key={index} className="flex items-center gap-1.5">
            <div 
              className="w-2 h-2 rounded-full" 
              style={{ backgroundColor: item.color }}
            />
            <span className="text-xs text-muted-foreground">
              {item.name} ({formatPercent(item.value)}%)
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CostChart;
