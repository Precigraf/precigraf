import React, { useState, useEffect, useCallback } from 'react';
import AppLayout from '@/components/AppLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Users, BarChart3, CreditCard, Shield, Loader2, ChevronLeft, ChevronRight, Search } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

interface AdminUser {
  user_id: string;
  email: string;
  name: string;
  status: string;
  plan: string;
  plan_name: string;
  plan_id: string;
  trial_ends_at: string | null;
  subscription_status: string | null;
  company_name: string | null;
  last_login: string | null;
  created_at: string;
}

interface Plan {
  id: string;
  name: string;
}

interface SecurityLog {
  id: string;
  user_id: string | null;
  event_type: string;
  event_description: string | null;
  ip_address: string | null;
  created_at: string;
}

const adminAction = async (body: Record<string, unknown>) => {
  const { data, error } = await supabase.functions.invoke('admin-actions', {
    body,
  });
  if (error) throw error;
  if (data?.error) throw new Error(data.error);
  return data;
};

// ─── Users Tab ───
const UsersTab: React.FC = () => {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminAction({ action: 'list_users' });
      setUsers(data.users || []);
      setPlans(data.plans || []);
    } catch {
      toast({ title: 'Erro ao carregar usuários', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadUsers(); }, [loadUsers]);

  const handlePlanChange = async (userId: string, planName: string) => {
    try {
      await adminAction({ action: 'update_user_plan', target_user_id: userId, plan_name: planName });
      toast({ title: 'Plano alterado com sucesso' });
      loadUsers();
    } catch {
      toast({ title: 'Erro ao alterar plano', variant: 'destructive' });
    }
  };

  const handleToggleStatus = async (userId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'ativo' ? 'inativo' : 'ativo';
    try {
      await adminAction({ action: 'toggle_user_status', target_user_id: userId, new_status: newStatus });
      toast({ title: `Usuário ${newStatus === 'ativo' ? 'ativado' : 'bloqueado'}` });
      loadUsers();
    } catch {
      toast({ title: 'Erro ao alterar status', variant: 'destructive' });
    }
  };

  const filtered = users.filter(u =>
    u.name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  );

  const planLabel = (name: string) => {
    if (name === 'lifetime') return 'Pro Vitalício';
    if (name === 'pro_monthly') return 'Pro Mensal';
    return 'Free';
  };

  if (loading) {
    return <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-4">
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Buscar por nome ou e-mail..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>E-mail</TableHead>
              <TableHead>Plano</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Cadastro</TableHead>
              <TableHead>Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map(u => (
              <TableRow key={u.user_id}>
                <TableCell className="font-medium">{u.name}</TableCell>
                <TableCell className="text-muted-foreground text-xs">{u.email}</TableCell>
                <TableCell>
                  <Select defaultValue={u.plan_name} onValueChange={v => handlePlanChange(u.user_id, v)}>
                    <SelectTrigger className="w-[140px] h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {plans.map(p => (
                        <SelectItem key={p.id} value={p.name}>{planLabel(p.name)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell>
                  <Badge variant={u.status === 'ativo' ? 'default' : 'destructive'} className="text-xs">
                    {u.status === 'ativo' ? 'Ativo' : 'Inativo'}
                  </Badge>
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {new Date(u.created_at).toLocaleDateString('pt-BR')}
                </TableCell>
                <TableCell>
                  <Button size="sm" variant={u.status === 'ativo' ? 'outline' : 'default'} className="text-xs h-7"
                    onClick={() => handleToggleStatus(u.user_id, u.status)}>
                    {u.status === 'ativo' ? 'Bloquear' : 'Ativar'}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && (
              <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">Nenhum usuário encontrado</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <p className="text-xs text-muted-foreground">{filtered.length} usuário(s)</p>
    </div>
  );
};

// ─── Metrics Tab ───
const MetricsTab: React.FC = () => {
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const data = await adminAction({ action: 'get_metrics' });
        setMetrics(data);
      } catch {
        toast({ title: 'Erro ao carregar métricas', variant: 'destructive' });
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;
  }

  if (!metrics) return null;

  const cards = [
    { title: 'Total de Usuários', value: metrics.total_users ?? 0 },
    { title: 'Usuários Pro', value: metrics.pro_users ?? 0 },
    { title: 'Novos este mês', value: metrics.new_this_month ?? 0 },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {cards.map(c => (
          <Card key={c.title}>
            <CardHeader className="pb-2">
              <CardDescription className="text-xs">{c.title}</CardDescription>
              <CardTitle className="text-2xl">{c.value}</CardTitle>
            </CardHeader>
          </Card>
        ))}
      </div>

      {metrics.monthly_growth?.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Crescimento de Usuários</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={metrics.monthly_growth}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="month" className="text-xs" />
                  <YAxis allowDecimals={false} className="text-xs" />
                  <Tooltip />
                  <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

// ─── Plans Tab ───
const PlansTab: React.FC = () => {
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const data = await adminAction({ action: 'list_users' });
        const planCounts: Record<string, number> = {};
        (data.users || []).forEach((u: AdminUser) => {
          planCounts[u.plan_name] = (planCounts[u.plan_name] || 0) + 1;
        });
        setPlans((data.plans || []).map((p: Plan) => ({
          ...p,
          count: planCounts[p.name] || 0,
        })));
      } catch {
        toast({ title: 'Erro ao carregar planos', variant: 'destructive' });
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const planLabel = (name: string) => {
    if (name === 'lifetime') return 'Pro Vitalício';
    if (name === 'pro_monthly') return 'Pro Mensal';
    return 'Free';
  };

  if (loading) {
    return <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {plans.map((p: any) => (
        <Card key={p.id}>
          <CardHeader>
            <CardTitle className="text-base">{planLabel(p.name)}</CardTitle>
            <CardDescription className="text-xs font-mono">{p.name}</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{p.count}</p>
            <p className="text-xs text-muted-foreground">usuário(s)</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

// ─── Logs Tab ───
const LogsTab: React.FC = () => {
  const [logs, setLogs] = useState<SecurityLog[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [eventFilter, setEventFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const limit = 50;

  const loadLogs = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminAction({
        action: 'get_security_logs',
        page,
        limit,
        ...(eventFilter ? { event_type: eventFilter } : {}),
      });
      setLogs(data.logs || []);
      setTotal(data.total || 0);
    } catch {
      toast({ title: 'Erro ao carregar logs', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [page, eventFilter]);

  useEffect(() => { loadLogs(); }, [loadLogs]);

  const totalPages = Math.ceil(total / limit);

  const eventTypes = [
    '', 'user_created', 'session_active', 'calculation_created', 'calculation_blocked',
    'plan_changed', 'payment_completed', 'suspicious_device', 'rate_limit_exceeded',
    'admin_plan_change', 'admin_status_change',
  ];

  return (
    <div className="space-y-4">
      <div className="flex gap-2 items-center">
        <Select value={eventFilter} onValueChange={v => { setEventFilter(v); setPage(1); }}>
          <SelectTrigger className="w-[220px] h-9 text-xs">
            <SelectValue placeholder="Filtrar por tipo..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Todos os eventos</SelectItem>
            {eventTypes.filter(Boolean).map(t => (
              <SelectItem key={t} value={t}>{t}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="text-xs text-muted-foreground ml-auto">{total} registro(s)</span>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Evento</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Usuário</TableHead>
                <TableHead>Data</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.map(l => (
                <TableRow key={l.id}>
                  <TableCell>
                    <Badge variant="outline" className="text-xs font-mono">{l.event_type}</Badge>
                  </TableCell>
                  <TableCell className="text-xs max-w-[300px] truncate">{l.event_description}</TableCell>
                  <TableCell className="text-xs text-muted-foreground font-mono">{l.user_id?.slice(0, 8) || '—'}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {new Date(l.created_at).toLocaleString('pt-BR')}
                  </TableCell>
                </TableRow>
              ))}
              {logs.length === 0 && (
                <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-8">Nenhum log encontrado</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="text-xs text-muted-foreground">{page} / {totalPages}</span>
          <Button size="sm" variant="outline" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      )}
    </div>
  );
};

// ─── Main Admin Page ───
const Admin: React.FC = () => {
  return (
    <AppLayout>
      <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
        <div>
          <h1 className="text-xl font-bold text-foreground">Painel de Administração</h1>
          <p className="text-sm text-muted-foreground">Gerencie usuários, planos e monitore o sistema.</p>
        </div>

        <Tabs defaultValue="users">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="users" className="text-xs gap-1"><Users className="w-3.5 h-3.5" /> Usuários</TabsTrigger>
            <TabsTrigger value="metrics" className="text-xs gap-1"><BarChart3 className="w-3.5 h-3.5" /> Métricas</TabsTrigger>
            <TabsTrigger value="plans" className="text-xs gap-1"><CreditCard className="w-3.5 h-3.5" /> Planos</TabsTrigger>
            <TabsTrigger value="logs" className="text-xs gap-1"><Shield className="w-3.5 h-3.5" /> Logs</TabsTrigger>
          </TabsList>

          <TabsContent value="users"><UsersTab /></TabsContent>
          <TabsContent value="metrics"><MetricsTab /></TabsContent>
          <TabsContent value="plans"><PlansTab /></TabsContent>
          <TabsContent value="logs"><LogsTab /></TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
};

export default Admin;
