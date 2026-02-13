import React, { forwardRef, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Download, Database, Users, HardDrive, FileCode, Shield, ScrollText, Copy, Check, Loader2, Table } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Header from '@/components/Header';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const TABLES = [
  { name: 'profiles', label: 'Profiles', icon: Users, description: 'Dados de perfis de usuários' },
  { name: 'users', label: 'Users', icon: Users, description: 'Dados de autenticação de usuários' },
  { name: 'calculations', label: 'Calculations', icon: Table, description: 'Cálculos salvos' },
  { name: 'subscription_plans', label: 'Subscription Plans', icon: Shield, description: 'Planos de assinatura' },
  { name: 'user_roles', label: 'User Roles', icon: Shield, description: 'Papéis de usuários' },
  { name: 'device_fingerprints', label: 'Device Fingerprints', icon: HardDrive, description: 'Impressões digitais de dispositivos' },
  { name: 'security_logs', label: 'Security Logs', icon: ScrollText, description: 'Logs de segurança' },
  { name: 'pending_payments', label: 'Pending Payments', icon: FileCode, description: 'Pagamentos pendentes' },
  { name: 'rate_limits', label: 'Rate Limits', icon: Shield, description: 'Limites de requisição' },
];

const SQL_SCHEMAS = `-- ================================================
-- ESQUEMA COMPLETO DO BANCO DE DADOS - PreciGraf
-- ================================================

-- Tabela: profiles
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  email TEXT,
  plan TEXT NOT NULL DEFAULT 'free',
  plan_id UUID REFERENCES public.subscription_plans(id),
  trial_ends_at TIMESTAMPTZ DEFAULT (now() + INTERVAL '1 day'),
  monthly_edits_count INTEGER NOT NULL DEFAULT 0,
  monthly_edits_reset_at TIMESTAMPTZ NOT NULL DEFAULT (date_trunc('month', now()) + INTERVAL '1 month'),
  profile_image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Tabela: users
CREATE TABLE public.users (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  email TEXT NOT NULL,
  name TEXT,
  status TEXT NOT NULL DEFAULT 'ativo',
  must_change_password BOOLEAN NOT NULL DEFAULT true,
  last_login TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Tabela: calculations
CREATE TABLE public.calculations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  product_name TEXT NOT NULL,
  cost_type TEXT NOT NULL DEFAULT 'lot',
  lot_quantity INTEGER NOT NULL DEFAULT 500,
  lot_cost NUMERIC NOT NULL DEFAULT 0,
  paper_cost NUMERIC NOT NULL DEFAULT 0,
  ink_cost NUMERIC NOT NULL DEFAULT 0,
  varnish_cost NUMERIC NOT NULL DEFAULT 0,
  other_material_cost NUMERIC NOT NULL DEFAULT 0,
  labor_cost NUMERIC NOT NULL DEFAULT 0,
  energy_cost NUMERIC NOT NULL DEFAULT 0,
  equipment_cost NUMERIC NOT NULL DEFAULT 0,
  rent_cost NUMERIC NOT NULL DEFAULT 0,
  other_operational_cost NUMERIC NOT NULL DEFAULT 0,
  margin_percentage NUMERIC NOT NULL DEFAULT 70,
  fixed_profit NUMERIC,
  total_cost NUMERIC NOT NULL,
  profit NUMERIC NOT NULL,
  sale_price NUMERIC NOT NULL,
  unit_price NUMERIC NOT NULL,
  is_favorite BOOLEAN NOT NULL DEFAULT false,
  duplicated_from UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.calculations ENABLE ROW LEVEL SECURITY;

-- Tabela: subscription_plans
CREATE TABLE public.subscription_plans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  max_calculations INTEGER NOT NULL,
  can_export BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;

-- Tabela: user_roles
CREATE TABLE public.user_roles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  role app_role NOT NULL DEFAULT 'user',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Tabela: device_fingerprints
CREATE TABLE public.device_fingerprints (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  fingerprint_hash TEXT NOT NULL UNIQUE,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.device_fingerprints ENABLE ROW LEVEL SECURITY;

-- Tabela: security_logs
CREATE TABLE public.security_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  event_type TEXT NOT NULL,
  event_description TEXT,
  ip_address TEXT,
  user_agent TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.security_logs ENABLE ROW LEVEL SECURITY;

-- Tabela: pending_payments
CREATE TABLE public.pending_payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  csrf_token TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  payment_provider_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '1 hour'),
  completed_at TIMESTAMPTZ
);
ALTER TABLE public.pending_payments ENABLE ROW LEVEL SECURITY;

-- Tabela: rate_limits
CREATE TABLE public.rate_limits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  identifier TEXT NOT NULL,
  action_type TEXT NOT NULL,
  request_count INTEGER DEFAULT 1,
  window_start TIMESTAMPTZ DEFAULT now(),
  blocked_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(identifier, action_type)
);
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

-- View: pending_payments_safe
CREATE VIEW public.pending_payments_safe AS
SELECT id, user_id, status, created_at, expires_at, completed_at
FROM public.pending_payments;

-- Enum
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');
`;

const AdminExport = forwardRef<HTMLDivElement>((_, ref) => {
  const navigate = useNavigate();
  const [loadingTable, setLoadingTable] = useState<string | null>(null);
  const [loadingAll, setLoadingAll] = useState(false);
  const [copied, setCopied] = useState(false);
  const [storageInfo, setStorageInfo] = useState<any[] | null>(null);
  const [loadingStorage, setLoadingStorage] = useState(false);

  const getAuthHeaders = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('Não autenticado');
    return {
      Authorization: `Bearer ${session.access_token}`,
      'Content-Type': 'application/json',
      apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
    };
  };

  const exportTable = async (tableName: string) => {
    setLoadingTable(tableName);
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/export-data?action=export&table=${tableName}`,
        { headers }
      );

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Erro ao exportar');
      }

      const csv = await res.text();
      if (!csv.trim()) {
        toast.info(`Tabela "${tableName}" está vazia`);
        return;
      }

      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${tableName}_${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(`"${tableName}" exportado com sucesso!`);
    } catch (error: any) {
      toast.error(error.message || 'Erro ao exportar tabela');
    } finally {
      setLoadingTable(null);
    }
  };

  const exportAll = async () => {
    setLoadingAll(true);
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/export-data?action=export-all`,
        { headers }
      );

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Erro ao exportar');
      }

      const allData = await res.json();

      for (const [table, rows] of Object.entries(allData)) {
        const data = rows as any[];
        if (!data.length) continue;

        const csvHeaders = Object.keys(data[0]);
        const csvRows = [
          csvHeaders.join(','),
          ...data.map((row: any) =>
            csvHeaders
              .map((h) => {
                const val = row[h];
                if (val === null || val === undefined) return '';
                const str = typeof val === 'object' ? JSON.stringify(val) : String(val);
                return `"${str.replace(/"/g, '""')}"`;
              })
              .join(',')
          ),
        ];

        const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${table}_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);
      }

      toast.success('Todas as tabelas exportadas!');
    } catch (error: any) {
      toast.error(error.message || 'Erro ao exportar');
    } finally {
      setLoadingAll(false);
    }
  };

  const loadStorage = async () => {
    setLoadingStorage(true);
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/export-data?action=storage`,
        { headers }
      );
      if (!res.ok) throw new Error('Erro ao carregar storage');
      const data = await res.json();
      setStorageInfo(data.storage || []);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoadingStorage(false);
    }
  };

  const copySQL = () => {
    navigator.clipboard.writeText(SQL_SCHEMAS);
    setCopied(true);
    toast.success('SQL copiado para a área de transferência!');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div ref={ref} className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-6 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>

        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <Database className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Exportação de Dados</h1>
          <p className="text-muted-foreground">
            Exporte os dados do sistema em CSV ou copie o esquema SQL
          </p>
        </div>

        <Tabs defaultValue="csv" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="csv">📊 Exportar CSV</TabsTrigger>
            <TabsTrigger value="storage">📁 Storage</TabsTrigger>
            <TabsTrigger value="sql">🗃️ Schema SQL</TabsTrigger>
          </TabsList>

          {/* CSV Export Tab */}
          <TabsContent value="csv" className="space-y-4">
            <div className="flex justify-end">
              <Button onClick={exportAll} disabled={loadingAll} variant="default" className="gap-2">
                {loadingAll ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                Exportar Tudo
              </Button>
            </div>

            <div className="grid gap-3">
              {TABLES.map((table) => (
                <Card key={table.name} className="bg-card border-border">
                  <CardContent className="flex items-center justify-between py-4 px-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <table.icon className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{table.label}</p>
                        <p className="text-sm text-muted-foreground">{table.description}</p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => exportTable(table.name)}
                      disabled={loadingTable === table.name}
                      className="gap-2"
                    >
                      {loadingTable === table.name ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Download className="w-4 h-4" />
                      )}
                      CSV
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Storage Tab */}
          <TabsContent value="storage" className="space-y-4">
            <div className="flex justify-end">
              <Button onClick={loadStorage} disabled={loadingStorage} variant="outline" className="gap-2">
                {loadingStorage ? <Loader2 className="w-4 h-4 animate-spin" /> : <HardDrive className="w-4 h-4" />}
                Carregar Info Storage
              </Button>
            </div>

            {storageInfo ? (
              <div className="space-y-4">
                {storageInfo.map((bucket: any) => (
                  <Card key={bucket.bucket} className="bg-card border-border">
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <HardDrive className="w-5 h-5 text-primary" />
                        {bucket.bucket}
                      </CardTitle>
                      <CardDescription>
                        {bucket.public ? 'Público' : 'Privado'} • {bucket.files?.length || 0} arquivos
                      </CardDescription>
                    </CardHeader>
                    {bucket.files?.length > 0 && (
                      <CardContent>
                        <div className="max-h-48 overflow-y-auto text-sm space-y-1">
                          {bucket.files.map((file: any, i: number) => (
                            <div key={i} className="flex justify-between text-muted-foreground py-1 border-b border-border/50">
                              <span>{file.name}</span>
                              <span>{file.metadata?.size ? `${(file.metadata.size / 1024).toFixed(1)} KB` : '-'}</span>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    )}
                  </Card>
                ))}
                {storageInfo.length === 0 && (
                  <p className="text-center text-muted-foreground py-8">Nenhum bucket encontrado</p>
                )}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">
                Clique em "Carregar Info Storage" para ver os buckets e arquivos
              </p>
            )}
          </TabsContent>

          {/* SQL Schema Tab */}
          <TabsContent value="sql" className="space-y-4">
            <div className="flex justify-end">
              <Button onClick={copySQL} variant="outline" className="gap-2">
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? 'Copiado!' : 'Copiar SQL'}
              </Button>
            </div>

            <Card className="bg-card border-border">
              <CardContent className="p-0">
                <pre className="p-6 text-sm text-foreground overflow-x-auto max-h-[600px] overflow-y-auto font-mono leading-relaxed whitespace-pre-wrap">
                  {SQL_SCHEMAS}
                </pre>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
});

AdminExport.displayName = 'AdminExport';

export default AdminExport;
