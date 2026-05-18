import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  Loader2,
  FileText,
  Package,
  CreditCard,
  UploadCloud,
  Download,
  Copy,
  CheckCircle2,
  Clock,
  AlertCircle,
  FolderOpen,
  ExternalLink,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { buildQuoteApprovalUrl, buildOrderTrackingUrl } from '@/lib/publicUrl';

type PortalData = {
  client: { id: string; name: string; email: string | null; whatsapp: string | null; city: string | null; state: string | null };
  seller: {
    company_name: string;
    company_email: string | null;
    company_phone: string | null;
    whatsapp: string | null;
    logo_url: string | null;
    pix_key: string | null;
    system_color: string | null;
  } | null;
  orders: Array<{
    id: string; order_number: number | null; status: string; total_revenue: number;
    amount_pending: number; tracking_token: string; created_at: string;
  }>;
  quotes: Array<{
    id: string; quote_number: number | null; status: string; product_name: string | null;
    total_value: number; public_token: string; valid_until: string | null; created_at: string;
  }>;
  receivables: Array<{
    id: string; order_id: string; order_number: number | null; amount: number; amount_paid: number;
    due_date: string; paid_at: string | null; status: string; installment_number: number; installment_total: number;
  }>;
  summary: { orders_in_progress: number; orders_done: number; open_amount: number };
};

type FileItem = {
  id: string;
  order_id: string | null;
  uploaded_by: 'client' | 'owner';
  file_name: string;
  file_path: string;
  file_size: number;
  mime_type: string | null;
  created_at: string;
};

const fmt = (v: number) =>
  (Number.isFinite(v) ? v : 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const fmtDate = (s: string | null) =>
  s ? new Date(s.length === 10 ? s + 'T00:00:00' : s).toLocaleDateString('pt-BR') : '—';

const ORDER_STATUS: Record<string, { label: string; cls: string }> = {
  approved: { label: 'Aprovado', cls: 'bg-blue-100 text-blue-700 border-blue-200' },
  aprovado: { label: 'Aprovado', cls: 'bg-blue-100 text-blue-700 border-blue-200' },
  em_producao: { label: 'Em produção', cls: 'bg-amber-100 text-amber-700 border-amber-200' },
  producao: { label: 'Em produção', cls: 'bg-amber-100 text-amber-700 border-amber-200' },
  pronto: { label: 'Pronto', cls: 'bg-indigo-100 text-indigo-700 border-indigo-200' },
  entregue: { label: 'Entregue', cls: 'bg-green-100 text-green-700 border-green-200' },
  concluido: { label: 'Concluído', cls: 'bg-green-100 text-green-700 border-green-200' },
  cancelado: { label: 'Cancelado', cls: 'bg-red-100 text-red-700 border-red-200' },
};

const QUOTE_STATUS: Record<string, { label: string; cls: string }> = {
  pending: { label: 'Pendente', cls: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
  enviado: { label: 'Aguardando', cls: 'bg-blue-100 text-blue-700 border-blue-200' },
  approved: { label: 'Aprovado', cls: 'bg-green-100 text-green-700 border-green-200' },
  rejected: { label: 'Recusado', cls: 'bg-red-100 text-red-700 border-red-200' },
  ajustes_solicitados: { label: 'Ajustes solicitados', cls: 'bg-amber-100 text-amber-700 border-amber-200' },
};

const RECEIVABLE_STATUS: Record<string, { label: string; cls: string; icon: React.ReactNode }> = {
  pendente: { label: 'Pendente', cls: 'bg-yellow-100 text-yellow-700 border-yellow-200', icon: <Clock className="w-3 h-3" /> },
  pago: { label: 'Pago', cls: 'bg-green-100 text-green-700 border-green-200', icon: <CheckCircle2 className="w-3 h-3" /> },
  atrasado: { label: 'Atrasado', cls: 'bg-red-100 text-red-700 border-red-200', icon: <AlertCircle className="w-3 h-3" /> },
};

const PortalCliente: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<PortalData | null>(null);
  const [files, setFiles] = useState<FileItem[]>([]);
  const [uploading, setUploading] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<string>('');
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const root = document.documentElement;
    const prev = root.className;
    root.classList.remove('dark');
    root.classList.add('light');
    return () => { root.className = prev; };
  }, []);

  const load = useCallback(async () => {
    if (!token) return;
    const { data: portal, error } = await supabase.rpc('get_client_portal', { p_token: token });
    if (error || !portal || (portal as { error?: string }).error) {
      setData(null);
      setLoading(false);
      return;
    }
    setData(portal as unknown as PortalData);
    const filesRes = await supabase.rpc('list_client_portal_files', { p_token: token, p_order_id: null as unknown as string });
    if (!filesRes.error && Array.isArray(filesRes.data)) {
      setFiles(filesRes.data as unknown as FileItem[]);
    }
    setLoading(false);
  }, [token]);

  useEffect(() => { load(); }, [load]);

  const copyPix = async () => {
    if (!data?.seller?.pix_key) return;
    try {
      await navigator.clipboard.writeText(data.seller.pix_key);
      toast.success('Chave Pix copiada!');
    } catch {
      toast.error('Não foi possível copiar');
    }
  };

  const handleUploadClick = () => inputRef.current?.click();

  const handleFile = async (file: File) => {
    if (!token) return;
    if (file.size > 25 * 1024 * 1024) {
      toast.error('Arquivo maior que 25MB');
      return;
    }
    setUploading(true);
    const form = new FormData();
    form.append('token', token);
    form.append('file', file);
    if (selectedOrderId) form.append('order_id', selectedOrderId);
    try {
      const url = `https://${import.meta.env.VITE_SUPABASE_PROJECT_ID}.supabase.co/functions/v1/client-portal-upload`;
      const res = await fetch(url, {
        method: 'POST',
        body: form,
        headers: {
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string,
        },
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json?.success) {
        const msg = json?.error === 'file_too_large' ? 'Arquivo muito grande'
          : json?.error === 'unsupported_type' ? 'Tipo de arquivo não suportado'
          : json?.error === 'rate_limited' ? 'Muitas tentativas. Tente novamente em alguns minutos.'
          : 'Falha no envio';
        toast.error(msg);
      } else {
        toast.success('Arquivo enviado!');
        await load();
      }
    } catch {
      toast.error('Falha no envio');
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const download = async (file: FileItem) => {
    if (!token) return;
    try {
      const url = `https://${import.meta.env.VITE_SUPABASE_PROJECT_ID}.supabase.co/functions/v1/client-portal-file-url`;
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string,
        },
        body: JSON.stringify({ token, file_id: file.id }),
      });
      const json = await res.json();
      if (!res.ok || !json?.url) {
        toast.error('Não foi possível baixar');
        return;
      }
      window.open(json.url, '_blank');
    } catch {
      toast.error('Não foi possível baixar');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <Loader2 className="w-6 h-6 animate-spin text-gray-500" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
        <Card className="bg-white border-gray-200 p-8 text-center max-w-md shadow-sm">
          <FolderOpen className="w-10 h-10 text-gray-400 mx-auto mb-3" />
          <h1 className="text-lg font-semibold text-gray-900">Portal não encontrado</h1>
          <p className="text-sm text-gray-500 mt-2">O link pode ter expirado ou estar incorreto.</p>
        </Card>
      </div>
    );
  }

  const seller = data.seller;

  return (
    <div className="min-h-screen bg-gray-100 text-gray-900">
      <div className="max-w-4xl mx-auto px-4 py-8 md:py-12 space-y-5">
        {/* Header */}
        <header className="text-center">
          {seller?.logo_url ? (
            <img src={seller.logo_url} alt="logo" className="w-16 h-16 object-contain rounded mx-auto mb-3" />
          ) : (
            <div className="w-16 h-16 rounded bg-gray-900 text-white flex items-center justify-center text-xl font-bold mx-auto mb-3">
              {(seller?.company_name || 'L').charAt(0)}
            </div>
          )}
          <h1 className="text-xl md:text-2xl font-bold text-gray-900">{seller?.company_name || 'Loja'}</h1>
          <p className="text-sm text-gray-600 mt-2">Olá, <span className="font-semibold">{data.client.name}</span></p>
          {(seller?.whatsapp || seller?.company_phone || seller?.company_email) && (
            <p className="text-xs text-gray-500 mt-1 break-words">
              {[seller?.whatsapp || seller?.company_phone, seller?.company_email].filter(Boolean).join(' · ')}
            </p>
          )}
        </header>

        {/* Resumo */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <SummaryCard icon={<Package className="w-5 h-5" />} label="Em andamento" value={String(data.summary.orders_in_progress)} />
          <SummaryCard icon={<CheckCircle2 className="w-5 h-5" />} label="Concluídos" value={String(data.summary.orders_done)} />
          <SummaryCard icon={<CreditCard className="w-5 h-5" />} label="Em aberto" value={fmt(Number(data.summary.open_amount))} />
        </div>

        {/* Tabs */}
        <Tabs defaultValue="orders" className="w-full">
          <TabsList className="grid grid-cols-4 w-full bg-white border border-gray-200">
            <TabsTrigger value="orders">Pedidos</TabsTrigger>
            <TabsTrigger value="quotes">Orçamentos</TabsTrigger>
            <TabsTrigger value="finance">Financeiro</TabsTrigger>
            <TabsTrigger value="files">Arquivos</TabsTrigger>
          </TabsList>

          {/* Pedidos */}
          <TabsContent value="orders" className="mt-4">
            <Card className="bg-white border-gray-200 shadow-sm divide-y divide-gray-100">
              {data.orders.length === 0 && <EmptyRow text="Nenhum pedido registrado." />}
              {data.orders.map((o) => {
                const s = ORDER_STATUS[o.status] ?? { label: o.status, cls: 'bg-gray-100 text-gray-700 border-gray-200' };
                return (
                  <div key={o.id} className="p-4 flex flex-wrap items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-semibold text-gray-900">Pedido #{o.order_number ?? '—'}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{fmtDate(o.created_at)} · {fmt(Number(o.total_revenue))}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={`${s.cls} hover:${s.cls}`}>{s.label}</Badge>
                      <Button asChild variant="outline" size="sm" className="border-gray-300 text-gray-700">
                        <a href={buildOrderTrackingUrl(o.tracking_token)} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="w-3.5 h-3.5 mr-1" /> Acompanhar
                        </a>
                      </Button>
                    </div>
                  </div>
                );
              })}
            </Card>
          </TabsContent>

          {/* Orçamentos */}
          <TabsContent value="quotes" className="mt-4">
            <Card className="bg-white border-gray-200 shadow-sm divide-y divide-gray-100">
              {data.quotes.length === 0 && <EmptyRow text="Nenhum orçamento registrado." />}
              {data.quotes.map((q) => {
                const s = QUOTE_STATUS[q.status] ?? { label: q.status, cls: 'bg-gray-100 text-gray-700 border-gray-200' };
                const pending = q.status === 'pending' || q.status === 'enviado' || q.status === 'ajustes_solicitados';
                return (
                  <div key={q.id} className="p-4 flex flex-wrap items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-semibold text-gray-900">ORC-{q.quote_number ?? '—'} {q.product_name ? <span className="text-gray-500 font-normal">· {q.product_name}</span> : null}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{fmtDate(q.created_at)} · {fmt(Number(q.total_value))}{q.valid_until ? ` · válido até ${fmtDate(q.valid_until)}` : ''}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={`${s.cls} hover:${s.cls}`}>{s.label}</Badge>
                      {pending && (
                        <Button asChild size="sm" className="bg-gray-900 hover:bg-gray-800 text-white">
                          <a href={buildQuoteApprovalUrl(q.public_token)} target="_blank" rel="noopener noreferrer">
                            Responder
                          </a>
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </Card>
          </TabsContent>

          {/* Financeiro */}
          <TabsContent value="finance" className="mt-4 space-y-4">
            {seller?.pix_key && (
              <Card className="bg-white border-gray-200 shadow-sm p-4 flex flex-wrap items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs text-gray-500 uppercase font-semibold tracking-wide">Pagamento via Pix</p>
                  <p className="text-sm text-gray-900 font-mono break-all mt-1">{seller.pix_key}</p>
                </div>
                <Button onClick={copyPix} variant="outline" className="border-gray-300 text-gray-700">
                  <Copy className="w-4 h-4 mr-1" /> Copiar chave
                </Button>
              </Card>
            )}

            <Card className="bg-white border-gray-200 shadow-sm divide-y divide-gray-100">
              {data.receivables.length === 0 && <EmptyRow text="Nenhuma cobrança registrada." />}
              {data.receivables.map((r) => {
                const isLate = r.status !== 'pago' && new Date(r.due_date + 'T23:59:59') < new Date();
                const key = isLate ? 'atrasado' : r.status;
                const s = RECEIVABLE_STATUS[key] ?? { label: r.status, cls: 'bg-gray-100 text-gray-700 border-gray-200', icon: null };
                return (
                  <div key={r.id} className="p-4 flex flex-wrap items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-semibold text-gray-900">
                        Pedido #{r.order_number ?? '—'}
                        {r.installment_total > 1 && (
                          <span className="text-gray-500 font-normal"> · {r.installment_number}/{r.installment_total}</span>
                        )}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Vencimento {fmtDate(r.due_date)} · {fmt(Number(r.amount))}
                        {r.amount_paid > 0 && r.status !== 'pago' && ` · pago ${fmt(Number(r.amount_paid))}`}
                      </p>
                    </div>
                    <Badge className={`${s.cls} hover:${s.cls} gap-1`}>{s.icon}{s.label}</Badge>
                  </div>
                );
              })}
            </Card>
          </TabsContent>

          {/* Arquivos */}
          <TabsContent value="files" className="mt-4 space-y-4">
            <Card className="bg-white border-gray-200 shadow-sm p-4 space-y-3">
              <div>
                <p className="text-sm font-semibold text-gray-900">Enviar arquivo de arte</p>
                <p className="text-xs text-gray-500 mt-0.5">PDF, AI, CDR, PNG, JPG, ZIP — até 25MB.</p>
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <select
                  value={selectedOrderId}
                  onChange={(e) => setSelectedOrderId(e.target.value)}
                  className="flex-1 h-10 rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-900"
                >
                  <option value="">Não relacionar a um pedido</option>
                  {data.orders.map((o) => (
                    <option key={o.id} value={o.id}>Pedido #{o.order_number ?? '—'} ({fmtDate(o.created_at)})</option>
                  ))}
                </select>
                <Button onClick={handleUploadClick} disabled={uploading} className="bg-gray-900 hover:bg-gray-800 text-white">
                  {uploading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <UploadCloud className="w-4 h-4 mr-2" />}
                  Selecionar arquivo
                </Button>
                <input
                  ref={inputRef}
                  type="file"
                  className="hidden"
                  accept=".pdf,.png,.jpg,.jpeg,.webp,.zip,.ai,.eps,.cdr,.svg,.tif,.tiff"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleFile(f);
                  }}
                />
              </div>
            </Card>

            <Card className="bg-white border-gray-200 shadow-sm divide-y divide-gray-100">
              {files.length === 0 && <EmptyRow text="Nenhum arquivo enviado ainda." />}
              {files.map((f) => {
                const order = data.orders.find((o) => o.id === f.order_id);
                return (
                  <div key={f.id} className="p-4 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{f.file_name}</p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {f.uploaded_by === 'client' ? 'Enviado por você' : 'Enviado pela gráfica'}
                        {order ? ` · Pedido #${order.order_number ?? '—'}` : ''}
                        {' · '}{fmtDate(f.created_at)}
                        {' · '}{formatBytes(f.file_size)}
                      </p>
                    </div>
                    <Button onClick={() => download(f)} variant="outline" size="sm" className="border-gray-300 text-gray-700">
                      <Download className="w-3.5 h-3.5 mr-1" /> Baixar
                    </Button>
                  </div>
                );
              })}
            </Card>
          </TabsContent>
        </Tabs>

        <p className="text-center text-xs text-gray-400 mt-6">Portal seguro · {seller?.company_name || 'Loja'}</p>
      </div>
    </div>
  );
};

const SummaryCard: React.FC<{ icon: React.ReactNode; label: string; value: string }> = ({ icon, label, value }) => (
  <Card className="bg-white border-gray-200 shadow-sm p-4 flex items-center gap-3">
    <div className="w-10 h-10 rounded-lg bg-gray-100 text-gray-700 flex items-center justify-center shrink-0">{icon}</div>
    <div className="min-w-0">
      <p className="text-xs text-gray-500 uppercase font-semibold tracking-wide">{label}</p>
      <p className="text-base font-bold text-gray-900 mt-0.5 truncate">{value}</p>
    </div>
  </Card>
);

const EmptyRow: React.FC<{ text: string }> = ({ text }) => (
  <div className="p-6 text-center text-sm text-gray-500">{text}</div>
);

function formatBytes(b: number) {
  if (!b) return '0 KB';
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(0)} KB`;
  return `${(b / 1024 / 1024).toFixed(1)} MB`;
}

export default PortalCliente;
