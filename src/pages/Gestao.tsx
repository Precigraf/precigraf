import React, { useState, useMemo } from 'react';
import { Users, FileText, CheckCircle, XCircle, DollarSign, Calendar, Crown, Sparkles } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import AppLayout from '@/components/AppLayout';
import { useClients } from '@/hooks/useClients';
import { useQuotes } from '@/hooks/useQuotes';
import { useUserPlan } from '@/hooks/useUserPlan';
import { useRevenueChart } from '@/hooks/useRevenueChart';
import { useNavigate } from 'react-router-dom';
import PeriodFilter, { type PeriodKey, getDateRange } from '@/components/PeriodFilter';

const formatCurrency = (v: number) => (Number.isFinite(v) ? v : 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
      <p className="text-xs font-semibold text-foreground mb-1">{label}</p>
      {payload.map((p: any) => (
        <p key={p.dataKey} className="text-xs" style={{ color: p.color }}>
          {p.name}: {formatCurrency(p.value)}
        </p>
      ))}
    </div>
  );
};

const Gestao: React.FC = () => {
  const { clients } = useClients();
  const { quotes } = useQuotes();
  const { plan, isTrialActive, isTrialExpired, trialEndsAt, trialRemainingHours } = useUserPlan();
  const navigate = useNavigate();

  const [period, setPeriod] = useState<PeriodKey>('current_month');
  const [customStart, setCustomStart] = useState<Date | undefined>();
  const [customEnd, setCustomEnd] = useState<Date | undefined>();

  const range = useMemo(() => getDateRange(period, customStart, customEnd), [period, customStart, customEnd]);
  const { chartData, totals } = useRevenueChart(range.start, range.end);

  const approvedQuotes = quotes.filter(q => q.status === 'approved');
  const rejectedQuotes = quotes.filter(q => q.status === 'rejected');

  const isPro = plan === 'pro';
  const planName = isPro ? 'Plano Profissional' : 'Teste Grátis';
  const statusLabel = isPro ? 'Plano Ativo' : isTrialActive ? 'Período de Teste' : 'Expirado';
  const statusVariant = isPro ? 'default' : isTrialActive ? 'secondary' : 'destructive';
  const remainingDays = Math.max(0, Math.ceil(trialRemainingHours / 24));

  const metrics = [
    { label: 'Faturamento', value: formatCurrency(totals.faturamento), icon: DollarSign, color: 'text-green-500' },
    { label: 'Total de Clientes', value: clients.length, icon: Users, color: 'text-blue-500' },
    { label: 'Total de Orçamentos', value: quotes.length, icon: FileText, color: 'text-purple-500' },
    { label: 'Aprovados', value: approvedQuotes.length, icon: CheckCircle, color: 'text-green-500' },
    { label: 'Recusados', value: rejectedQuotes.length, icon: XCircle, color: 'text-red-500' },
  ];

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-6 max-w-5xl">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-sm text-muted-foreground">Visão geral do seu negócio</p>
        </div>

        {/* Painel "Meu Plano" */}
        <Card className="mb-6 p-5 bg-card border-border">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${isPro ? 'bg-primary/10' : 'bg-orange-500/10'}`}>
                {isPro ? <Crown className="w-5 h-5 text-primary" /> : <Sparkles className="w-5 h-5 text-orange-500" />}
              </div>
              <div className="min-w-0">
                <div className="text-xs text-muted-foreground uppercase tracking-wide">Meu Plano</div>
                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                  <h2 className="text-lg font-bold text-foreground">{planName}</h2>
                  <Badge variant={statusVariant as any} className={isTrialActive ? 'bg-orange-500/15 text-orange-600 border-orange-500/30' : ''}>
                    {statusLabel}
                  </Badge>
                </div>
              </div>
            </div>
            {!isPro && (
              <Button onClick={() => navigate('/upgrade')} className="shrink-0">
                <Crown className="w-4 h-4 mr-2" /> Fazer Upgrade
              </Button>
            )}
          </div>

          {!isPro && trialEndsAt && (
            <div className="mt-4 flex items-center gap-3 p-3 rounded-lg bg-muted/50 border border-border">
              <Calendar className="w-5 h-5 text-orange-500 shrink-0" />
              <div className="min-w-0 flex-1">
                <div className="text-xs text-muted-foreground">Teste expira em</div>
                <div className="text-sm font-semibold text-foreground">
                  {format(trialEndsAt, "d 'de' MMMM 'de' yyyy", { locale: ptBR })}
                </div>
              </div>
              <div className={`text-sm font-bold shrink-0 ${isTrialExpired ? 'text-destructive' : 'text-orange-500'}`}>
                {remainingDays} {remainingDays === 1 ? 'dia restante' : 'dias restantes'}
              </div>
            </div>
          )}
        </Card>

        {/* Métricas */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
          {metrics.map(m => (
            <Card key={m.label} className="p-4 bg-card border-border">
              <div className="flex items-center gap-3">
                <m.icon className={`w-5 h-5 ${m.color} shrink-0`} />
                <div>
                  <div className="text-xl font-bold text-foreground">{m.value}</div>
                  <div className="text-xs text-muted-foreground">{m.label}</div>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Gráfico de faturamento */}
        <Card className="p-5 bg-card border-border">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
            <div>
              <h2 className="text-lg font-bold text-foreground">Desempenho Financeiro</h2>
              <p className="text-xs text-muted-foreground">Faturamento, despesas e lucro no período</p>
            </div>
            <PeriodFilter
              value={period}
              onChange={setPeriod}
              customStart={customStart}
              customEnd={customEnd}
              onCustomStartChange={setCustomStart}
              onCustomEndChange={setCustomEnd}
            />
          </div>

          {/* Summary cards */}
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="rounded-lg bg-green-500/10 border border-green-500/20 p-3">
              <div className="text-xs text-muted-foreground">Faturamento Total</div>
              <div className="text-lg font-bold text-green-600">{formatCurrency(totals.faturamento)}</div>
            </div>
            <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-3">
              <div className="text-xs text-muted-foreground">Despesas Totais</div>
              <div className="text-lg font-bold text-red-500">{formatCurrency(totals.despesas)}</div>
            </div>
            <div className={`rounded-lg border p-3 ${totals.lucro >= 0 ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-red-500/10 border-red-500/20'}`}>
              <div className="text-xs text-muted-foreground">Lucro Líquido</div>
              <div className={`text-lg font-bold ${totals.lucro >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>{formatCurrency(totals.lucro)}</div>
            </div>
          </div>

          <div className="h-72">
            {chartData.length === 0 ? (
              <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                Sem dados para o período selecionado
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gradFat" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(142, 71%, 45%)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(142, 71%, 45%)" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gradDesp" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(0, 84%, 60%)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(0, 84%, 60%)" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gradLucro" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(160, 84%, 39%)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(160, 84%, 39%)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="label" tick={{ fontSize: 11 }} className="fill-muted-foreground" />
                  <YAxis tick={{ fontSize: 11 }} className="fill-muted-foreground" tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Area type="monotone" dataKey="faturamento" name="Faturamento" stroke="hsl(142, 71%, 45%)" fill="url(#gradFat)" strokeWidth={2} />
                  <Area type="monotone" dataKey="despesas" name="Despesas" stroke="hsl(0, 84%, 60%)" fill="url(#gradDesp)" strokeWidth={2} />
                  <Area type="monotone" dataKey="lucro" name="Lucro" stroke="hsl(160, 84%, 39%)" fill="url(#gradLucro)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>
      </div>
    </AppLayout>
  );
};

export default Gestao;
