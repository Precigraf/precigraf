import { useEffect, useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { callAdmin } from '@/lib/adminApi';
import { toast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

interface Employee {
  user_id: string;
  email?: string;
  name?: string;
  status?: string;
  roles: string[];
}

const ROLES = ['admin', 'moderator', 'support', 'finance'];

export default function AdminEmployees() {
  const [list, setList] = useState<Employee[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newUserId, setNewUserId] = useState('');
  const [newRole, setNewRole] = useState('support');
  const [search, setSearch] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const [emp, usr] = await Promise.all([
        callAdmin<{ employees: Employee[] }>('list_employees'),
        callAdmin<{ users: any[] }>('list_users'),
      ]);
      setList(emp.employees || []);
      setUsers(usr.users || []);
    } catch (e: any) {
      toast({ title: 'Erro', description: e.message, variant: 'destructive' });
    }
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const assign = async () => {
    if (!newUserId) return;
    try {
      await callAdmin('assign_role', { target_user_id: newUserId, role: newRole });
      toast({ title: 'Funcionário adicionado' });
      setNewUserId('');
      load();
    } catch (e: any) {
      toast({ title: 'Erro', description: e.message, variant: 'destructive' });
    }
  };

  const revoke = async (uid: string, role: string) => {
    try {
      await callAdmin('revoke_role', { target_user_id: uid, role });
      toast({ title: 'Permissão revogada' });
      load();
    } catch (e: any) {
      toast({ title: 'Erro', description: e.message, variant: 'destructive' });
    }
  };

  const filteredUsers = users.filter(u =>
    search && (u.email?.toLowerCase().includes(search.toLowerCase()) || u.name?.toLowerCase().includes(search.toLowerCase()))
  ).slice(0, 8);

  return (
    <AdminLayout title="Funcionários">
      <div className="space-y-4">
        <Card className="p-4 space-y-3">
          <h3 className="font-semibold">Adicionar funcionário</h3>
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="flex-1 relative">
              <Input
                placeholder="Buscar usuário por email..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setNewUserId(''); }}
              />
              {filteredUsers.length > 0 && !newUserId && (
                <div className="absolute z-10 mt-1 w-full bg-popover border rounded-md shadow-lg max-h-60 overflow-auto">
                  {filteredUsers.map(u => (
                    <button key={u.user_id} className="block w-full text-left px-3 py-2 hover:bg-accent text-sm"
                      onClick={() => { setNewUserId(u.user_id); setSearch(u.email); }}>
                      {u.email}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <Select value={newRole} onValueChange={setNewRole}>
              <SelectTrigger className="sm:w-40"><SelectValue /></SelectTrigger>
              <SelectContent>
                {ROLES.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
              </SelectContent>
            </Select>
            <Button onClick={assign} disabled={!newUserId}>Adicionar</Button>
          </div>
        </Card>

        <Card>
          {loading ? <div className="p-8 text-center"><Loader2 className="animate-spin mx-auto" /></div> : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Nome</TableHead>
                  <TableHead>Papéis</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {list.map(e => (
                  <TableRow key={e.user_id}>
                    <TableCell className="font-mono text-xs">{e.email}</TableCell>
                    <TableCell>{e.name || '—'}</TableCell>
                    <TableCell className="space-x-1">
                      {e.roles.map(r => <Badge key={r} variant={r === 'admin' ? 'destructive' : 'secondary'}>{r}</Badge>)}
                    </TableCell>
                    <TableCell className="text-right space-x-1">
                      {e.roles.map(r => (
                        <Button key={r} size="sm" variant="ghost" onClick={() => revoke(e.user_id, r)}>
                          Remover {r}
                        </Button>
                      ))}
                    </TableCell>
                  </TableRow>
                ))}
                {list.length === 0 && <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-8">Nenhum funcionário cadastrado</TableCell></TableRow>}
              </TableBody>
            </Table>
          )}
        </Card>
      </div>
    </AdminLayout>
  );
}
