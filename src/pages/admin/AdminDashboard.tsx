import { useEffect, useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, UserCheck, Crown, DollarSign, TrendingUp, Loader2 } from 'lucide-react';
import { callAdmin } from '@/lib/adminApi';
import { toast } from '@/hooks/use-toast';

interface Metrics {
  total_users: number;
  free_users: number;
  pro_users: number;
  active_monthly: number;
  lifetime_users: number;
  mrr: number;
  lifetime_revenue: number;
  total_subscription_revenue: number;
  new_this_month: number;
}

const fmtMoney = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export default function AdminDashboard() {
  const [m, setM] = useState<Metrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    callAdmin<Metrics>('get_dashboard')
      .then(setM)
      .catch((e) => toast({ title: 'Erro ao carregar', description: e.message, variant: 'destructive' }))
      .finally(() => setLoading(false));
  }, []);

  const kpis = [
    { label: 'Total de Usuários', value: m?.total_users ?? 0, icon: Users, color: 'text-blue-500' },
    { label: 'Usuários Free', value: m?.free_users ?? 0, icon: UserCheck, color: 'text-muted-foreground' },
    { label: 'Usuários Pro', value: m?.pro_users ?? 0, icon: Crown, color: 'text-amber-500' },
    { label: 'Receita Total (R$)', value: fmtMoney(m?.total_subscription_revenue ?? 0), icon: DollarSign, color: 'text-emerald-500' },
  ];

  return (
    <AdminLayout title="Dashboard">
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {kpis.map((k) => (
              <Card key={k.label}>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">{k.label}</CardTitle>
                  <k.icon className={`h-5 w-5 ${k.color}`} />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold tabular-nums">{k.value}</div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">MRR (Mensal)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xl font-semibold">{fmtMoney(m?.mrr ?? 0)}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {m?.active_monthly ?? 0} assinantes ativos
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Receita Lifetime</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xl font-semibold">{fmtMoney(m?.lifetime_revenue ?? 0)}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {m?.lifetime_users ?? 0} compras vitalícias
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" /> Novos no mês
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xl font-semibold">{m?.new_this_month ?? 0}</div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
