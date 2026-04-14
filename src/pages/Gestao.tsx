import React from 'react';
import { Users, FileText, CheckCircle, XCircle, DollarSign, Crown, Clock } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import AppLayout from '@/components/AppLayout';
import { useClients } from '@/hooks/useClients';
import { useQuotes } from '@/hooks/useQuotes';
import { useUserPlan } from '@/hooks/useUserPlan';
import { useNavigate } from 'react-router-dom';

const Gestao: React.FC = () => {
  const { clients } = useClients();
  const { quotes } = useQuotes();
  const { plan, isTrialActive, trialRemainingHours } = useUserPlan();
  const navigate = useNavigate();

  const approvedQuotes = quotes.filter(q => q.status === 'approved');
  const rejectedQuotes = quotes.filter(q => q.status === 'rejected');
  const totalRevenue = approvedQuotes.reduce((sum, q) => sum + q.total_value, 0);

  const formatCurrency = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

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
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
            <p className="text-sm text-muted-foreground">Visão geral do seu negócio</p>
          </div>
          <PlanBadge plan={plan} onClick={() => navigate('/upgrade')} />
        </div>

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
