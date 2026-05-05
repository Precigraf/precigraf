import { useEffect, useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { callAdmin } from '@/lib/adminApi';
import { Loader2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface PlanRow {
  id: string;
  name: string;
  max_calculations: number;
  can_export: boolean;
  subscriber_count: number;
}

export default function AdminPlans() {
  const [plans, setPlans] = useState<PlanRow[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    callAdmin<{ plans: PlanRow[] }>('list_plans')
      .then((d) => setPlans(d.plans))
      .catch((e) => toast({ title: 'Erro', description: e.message, variant: 'destructive' }))
      .finally(() => setLoading(false));
  }, []);

  return (
    <AdminLayout title="Planos & Assinaturas">
      {loading ? <Loader2 className="animate-spin mx-auto mt-12" /> : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {plans.map((p) => (
            <Card key={p.id}>
              <CardHeader>
                <CardTitle className="capitalize">{p.name.replace('_', ' ')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Assinantes</span><span className="font-bold text-lg">{p.subscriber_count}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Cálculos máx.</span><span>{p.max_calculations ?? '∞'}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Export</span><span>{p.can_export ? 'Sim' : 'Não'}</span></div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </AdminLayout>
  );
}
