import { useEffect, useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { callAdmin } from '@/lib/adminApi';
import { toast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

export default function AdminPayments() {
  const [pending, setPending] = useState<any[]>([]);
  const [subs, setSubs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    callAdmin<any>('list_payments')
      .then((d) => { setPending(d.pending_payments); setSubs(d.subscriptions); })
      .catch((e) => toast({ title: 'Erro', description: e.message, variant: 'destructive' }))
      .finally(() => setLoading(false));
  }, []);

  return (
    <AdminLayout title="Pagamentos">
      {loading ? <Loader2 className="animate-spin mx-auto mt-12" /> : (
        <Tabs defaultValue="subs">
          <TabsList>
            <TabsTrigger value="subs">Assinaturas Stripe</TabsTrigger>
            <TabsTrigger value="pending">Pagamentos pendentes/lifetime</TabsTrigger>
          </TabsList>

          <TabsContent value="subs">
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Próxima cobrança</TableHead>
                    <TableHead>Cancelado em</TableHead>
                    <TableHead>Subscription ID</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {subs.map(s => (
                    <TableRow key={s.user_id}>
                      <TableCell className="font-mono text-xs">{s.email}</TableCell>
                      <TableCell><Badge variant={s.subscription_status === 'active' ? 'default' : 'secondary'}>{s.subscription_status}</Badge></TableCell>
                      <TableCell className="text-xs">{s.subscription_current_period_end ? new Date(s.subscription_current_period_end).toLocaleDateString('pt-BR') : '—'}</TableCell>
                      <TableCell className="text-xs">{s.subscription_canceled_at ? new Date(s.subscription_canceled_at).toLocaleDateString('pt-BR') : '—'}</TableCell>
                      <TableCell className="font-mono text-xs truncate max-w-[200px]">{s.stripe_subscription_id}</TableCell>
                    </TableRow>
                  ))}
                  {subs.length === 0 && <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">Nenhuma assinatura</TableCell></TableRow>}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          <TabsContent value="pending">
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User ID</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Provider ID</TableHead>
                    <TableHead>Criado</TableHead>
                    <TableHead>Concluído</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pending.map(p => (
                    <TableRow key={p.id}>
                      <TableCell className="font-mono text-xs truncate max-w-[160px]">{p.user_id}</TableCell>
                      <TableCell><Badge>{p.status}</Badge></TableCell>
                      <TableCell className="font-mono text-xs">{p.payment_provider_id || '—'}</TableCell>
                      <TableCell className="text-xs">{new Date(p.created_at).toLocaleDateString('pt-BR')}</TableCell>
                      <TableCell className="text-xs">{p.completed_at ? new Date(p.completed_at).toLocaleDateString('pt-BR') : '—'}</TableCell>
                    </TableRow>
                  ))}
                  {pending.length === 0 && <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">Nenhum pagamento</TableCell></TableRow>}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </AdminLayout>
  );
}
