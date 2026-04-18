import React from 'react';
import { Users, FileText, CheckCircle, XCircle, DollarSign, Calendar, Crown, Sparkles } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import AppLayout from '@/components/AppLayout';
import { useClients } from '@/hooks/useClients';
import { useQuotes } from '@/hooks/useQuotes';
import { useUserPlan } from '@/hooks/useUserPlan';
import { useNavigate } from 'react-router-dom';

const Gestao: React.FC = () => {
  const { clients } = useClients();
  const { quotes } = useQuotes();
  const { plan, isTrialActive, isTrialExpired, trialEndsAt, trialRemainingHours } = useUserPlan();
  const navigate = useNavigate();

  const approvedQuotes = quotes.filter(q => q.status === 'approved');
  const rejectedQuotes = quotes.filter(q => q.status === 'rejected');
  const totalRevenue = approvedQuotes.reduce((sum, q) => sum + q.total_value, 0);

  const formatCurrency = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const isPro = plan === 'pro';
  const planName = isPro ? 'Plano Profissional' : 'Teste Grátis';
  const statusLabel = isPro ? 'Plano Ativo' : isTrialActive ? 'Período de Teste' : 'Expirado';
  const statusVariant = isPro ? 'default' : isTrialActive ? 'secondary' : 'destructive';
  const remainingDays = Math.max(0, Math.ceil(trialRemainingHours / 24));

  const metrics = [
    { label: 'Faturamento', value: formatCurrency(totalRevenue), icon: DollarSign, color: 'text-green-500' },
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

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
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
      </div>
    </AppLayout>
  );
};

export default Gestao;
