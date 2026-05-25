import React from 'react';
import { ComposedChart, Bar, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';
import type { DailyBucket } from '@/hooks/useCashFlow';
import { format } from 'date-fns';

const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const CashFlowChart: React.FC<{ daily: DailyBucket[] }> = ({ daily }) => {
  const data = daily.map(d => ({
    date: format(new Date(d.date + 'T12:00:00'), 'dd/MM'),
    Entradas: d.in,
    Saídas: -d.out,
    Saldo: d.balance,
  }));

  if (data.length === 0) {
    return <div className="h-64 flex items-center justify-center text-muted-foreground text-sm">Sem dados no período.</div>;
  }

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer>
        <ComposedChart data={data} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={11} />
          <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickFormatter={(v) => (v / 1000).toFixed(0) + 'k'} />
          <Tooltip
            contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8 }}
            formatter={(v: number) => fmt(Math.abs(v))}
          />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Bar dataKey="Entradas" fill="hsl(142 71% 45%)" radius={[4, 4, 0, 0]} />
          <Bar dataKey="Saídas" fill="hsl(0 84% 60%)" radius={[4, 4, 0, 0]} />
          <Line type="monotone" dataKey="Saldo" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
};

export default CashFlowChart;
