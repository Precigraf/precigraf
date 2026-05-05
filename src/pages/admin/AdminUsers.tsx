import { useEffect, useMemo, useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { callAdmin } from '@/lib/adminApi';
import { toast } from '@/hooks/use-toast';

interface UserRow {
  user_id: string;
  email: string;
  name?: string;
  status?: string;
  plan: string;
  plan_name?: string;
  trial_ends_at?: string;
  created_at: string;
  subscription_status?: string;
}

export default function AdminUsers() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [plans, setPlans] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [planFilter, setPlanFilter] = useState<string>('all');

  const load = async () => {
    setLoading(true);
    try {
      const data = await callAdmin<{ users: UserRow[]; plans: any[] }>('list_users');
      setUsers(data.users || []);
      setPlans(data.plans || []);
    } catch (e: any) {
      toast({ title: 'Erro', description: e.message, variant: 'destructive' });
    }
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => users.filter(u => {
    const ok = !search || u.email?.toLowerCase().includes(search.toLowerCase()) || u.name?.toLowerCase().includes(search.toLowerCase());
    const okPlan = planFilter === 'all' || u.plan === planFilter;
    return ok && okPlan;
  }), [users, search, planFilter]);

  const updatePlan = async (user_id: string, plan_name: string) => {
    try {
      await callAdmin('update_user_plan', { target_user_id: user_id, plan_name });
      toast({ title: 'Plano atualizado' });
      load();
    } catch (e: any) {
      toast({ title: 'Erro', description: e.message, variant: 'destructive' });
    }
  };

  const toggleStatus = async (user_id: string, current?: string) => {
    const new_status = current === 'ativo' ? 'inativo' : 'ativo';
    try {
      await callAdmin('toggle_user_status', { target_user_id: user_id, new_status });
      toast({ title: `Usuário ${new_status}` });
      load();
    } catch (e: any) {
      toast({ title: 'Erro', description: e.message, variant: 'destructive' });
    }
  };

  return (
    <AdminLayout title="Usuários">
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-2">
          <Input placeholder="Buscar por email ou nome..." value={search} onChange={(e) => setSearch(e.target.value)} className="sm:max-w-sm" />
          <Select value={planFilter} onValueChange={setPlanFilter}>
            <SelectTrigger className="sm:w-48"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os planos</SelectItem>
              <SelectItem value="free">Free</SelectItem>
              <SelectItem value="pro">Pro</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={load}>Atualizar</Button>
        </div>

        <Card>
          {loading ? (
            <div className="flex justify-center p-12"><Loader2 className="animate-spin" /></div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Nome</TableHead>
                  <TableHead>Plano</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Criado</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((u) => (
                  <TableRow key={u.user_id}>
                    <TableCell className="font-mono text-xs">{u.email}</TableCell>
                    <TableCell>{u.name || '—'}</TableCell>
                    <TableCell>
                      <Badge variant={u.plan === 'pro' ? 'default' : 'secondary'}>{u.plan_name || u.plan}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={u.status === 'ativo' ? 'outline' : 'destructive'}>{u.status || 'ativo'}</Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {new Date(u.created_at).toLocaleDateString('pt-BR')}
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      <Select onValueChange={(v) => updatePlan(u.user_id, v)}>
                        <SelectTrigger className="w-32 inline-flex h-8"><SelectValue placeholder="Mudar plano" /></SelectTrigger>
                        <SelectContent>
                          {plans.map(p => <SelectItem key={p.id} value={p.name}>{p.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <Button size="sm" variant="ghost" onClick={() => toggleStatus(u.user_id, u.status)}>
                        {u.status === 'ativo' ? 'Desativar' : 'Ativar'}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {filtered.length === 0 && (
                  <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">Nenhum usuário encontrado</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </Card>
      </div>
    </AdminLayout>
  );
}
