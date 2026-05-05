import { useEffect, useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { callAdmin } from '@/lib/adminApi';
import { toast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

const ROLES = ['admin', 'moderator', 'support', 'finance'] as const;
type Role = typeof ROLES[number];

export default function AdminPermissions() {
  const [users, setUsers] = useState<any[]>([]);
  const [roles, setRoles] = useState<{ user_id: string; role: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const [u, r] = await Promise.all([
        callAdmin<{ users: any[] }>('list_users'),
        callAdmin<{ roles: any[] }>('list_roles'),
      ]);
      setUsers(u.users || []);
      setRoles(r.roles || []);
    } catch (e: any) {
      toast({ title: 'Erro', description: e.message, variant: 'destructive' });
    }
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const has = (uid: string, role: Role) => roles.some(r => r.user_id === uid && r.role === role);

  const toggle = async (uid: string, role: Role, value: boolean) => {
    try {
      await callAdmin(value ? 'assign_role' : 'revoke_role', { target_user_id: uid, role });
      load();
    } catch (e: any) {
      toast({ title: 'Erro', description: e.message, variant: 'destructive' });
    }
  };

  const filtered = users.filter(u => !search || u.email?.toLowerCase().includes(search.toLowerCase())).slice(0, 100);

  return (
    <AdminLayout title="Permissões">
      <div className="space-y-4">
        <Input placeholder="Filtrar por email..." value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-sm" />
        <Card>
          {loading ? <div className="p-8"><Loader2 className="animate-spin mx-auto" /></div> : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Usuário</TableHead>
                  {ROLES.map(r => <TableHead key={r} className="text-center capitalize">{r}</TableHead>)}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(u => (
                  <TableRow key={u.user_id}>
                    <TableCell className="font-mono text-xs">{u.email}</TableCell>
                    {ROLES.map(r => (
                      <TableCell key={r} className="text-center">
                        <Checkbox
                          checked={has(u.user_id, r)}
                          onCheckedChange={(v) => toggle(u.user_id, r, !!v)}
                        />
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Card>
        <p className="text-xs text-muted-foreground">Mostrando até 100 usuários. Use o filtro para encontrar contas específicas.</p>
      </div>
    </AdminLayout>
  );
}
