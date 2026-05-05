import { useEffect, useState } from 'react';
import { z } from 'zod';
import { LifeBuoy, MessageCircle, Mail, Send, Loader2 } from 'lucide-react';
import AppLayout from '@/components/AppLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

const ticketSchema = z.object({
  subject: z.string().trim().min(3, 'Mínimo 3 caracteres').max(120, 'Máximo 120 caracteres'),
  category: z.enum(['bug', 'duvida', 'sugestao', 'financeiro', 'outro']),
  priority: z.enum(['baixa', 'media', 'alta']),
  message: z.string().trim().min(10, 'Mínimo 10 caracteres').max(2000, 'Máximo 2000 caracteres'),
});

type Ticket = {
  id: string;
  subject: string;
  category: string;
  priority: string;
  status: string;
  created_at: string;
};

const WHATSAPP = '5574981209228';
const SUPPORT_EMAIL = 'suporte@precigraf.com.br';

const statusVariant: Record<string, 'default' | 'secondary' | 'outline'> = {
  aberto: 'default',
  em_andamento: 'secondary',
  resolvido: 'outline',
};

const statusLabel: Record<string, string> = {
  aberto: 'Aberto',
  em_andamento: 'Em andamento',
  resolvido: 'Resolvido',
};

export default function Suporte() {
  const { user } = useAuth();
  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState<'bug' | 'duvida' | 'sugestao' | 'financeiro' | 'outro'>('duvida');
  const [priority, setPriority] = useState<'baixa' | 'media' | 'alta'>('media');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loadingList, setLoadingList] = useState(true);

  const loadTickets = async () => {
    setLoadingList(true);
    const { data, error } = await supabase
      .from('support_tickets')
      .select('id, subject, category, priority, status, created_at')
      .order('created_at', { ascending: false })
      .limit(20);
    if (!error) setTickets((data || []) as Ticket[]);
    setLoadingList(false);
  };

  useEffect(() => {
    if (user) loadTickets();
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const parsed = ticketSchema.safeParse({ subject, category, priority, message });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.from('support_tickets').insert({
      user_id: user.id,
      email: user.email ?? '',
      ...parsed.data,
    });
    setSubmitting(false);
    if (error) {
      toast.error('Não foi possível enviar. Tente novamente.');
      return;
    }
    toast.success('Ticket enviado! Responderemos por email em breve.');
    setSubject('');
    setMessage('');
    setCategory('duvida');
    setPriority('media');
    loadTickets();
  };

  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto p-4 sm:p-6 space-y-6">
        <header className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <LifeBuoy className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Suporte</h1>
            <p className="text-sm text-muted-foreground">Como podemos ajudar você hoje?</p>
          </div>
        </header>

        {/* Canais diretos */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <a
            href={`https://wa.me/${WHATSAPP}?text=${encodeURIComponent('Olá! Preciso de ajuda no Precigraf.')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="block"
          >
            <Card className="hover:border-primary transition-colors h-full">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center">
                  <MessageCircle className="w-5 h-5 text-green-600" />
                </div>
                <div className="min-w-0">
                  <p className="font-semibold">WhatsApp</p>
                  <p className="text-xs text-muted-foreground truncate">+55 74 98120-9228</p>
                </div>
              </CardContent>
            </Card>
          </a>
          <a href={`mailto:${SUPPORT_EMAIL}`} className="block">
            <Card className="hover:border-primary transition-colors h-full">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Mail className="w-5 h-5 text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="font-semibold">Email</p>
                  <p className="text-xs text-muted-foreground truncate">{SUPPORT_EMAIL}</p>
                </div>
              </CardContent>
            </Card>
          </a>
        </div>

        {/* Formulário */}
        <Card>
          <CardHeader>
            <CardTitle>Abrir um ticket</CardTitle>
            <CardDescription>Descreva sua dúvida ou problema. Respondemos por email.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="subject">Assunto</Label>
                <Input
                  id="subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  maxLength={120}
                  placeholder="Resumo do que está acontecendo"
                  required
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Categoria</Label>
                  <Select value={category} onValueChange={(v) => setCategory(v as typeof category)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="duvida">Dúvida</SelectItem>
                      <SelectItem value="bug">Problema / Bug</SelectItem>
                      <SelectItem value="sugestao">Sugestão</SelectItem>
                      <SelectItem value="financeiro">Financeiro</SelectItem>
                      <SelectItem value="outro">Outro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Prioridade</Label>
                  <Select value={priority} onValueChange={(v) => setPriority(v as typeof priority)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="baixa">Baixa</SelectItem>
                      <SelectItem value="media">Média</SelectItem>
                      <SelectItem value="alta">Alta</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="message">Mensagem</Label>
                <Textarea
                  id="message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  maxLength={2000}
                  rows={6}
                  placeholder="Conte-nos os detalhes. Quanto mais informação, mais rápido conseguimos ajudar."
                  required
                />
                <p className="text-xs text-muted-foreground text-right">{message.length}/2000</p>
              </div>
              <Button type="submit" disabled={submitting} className="w-full sm:w-auto">
                {submitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
                Enviar ticket
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Histórico */}
        <Card>
          <CardHeader>
            <CardTitle>Meus tickets</CardTitle>
            <CardDescription>Histórico das suas solicitações.</CardDescription>
          </CardHeader>
          <CardContent>
            {loadingList ? (
              <div className="flex justify-center py-8"><Loader2 className="animate-spin text-muted-foreground" /></div>
            ) : tickets.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">Você ainda não abriu tickets.</p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Assunto</TableHead>
                      <TableHead className="hidden sm:table-cell">Categoria</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="hidden sm:table-cell">Data</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tickets.map((t) => (
                      <TableRow key={t.id}>
                        <TableCell className="font-medium max-w-[260px] truncate">{t.subject}</TableCell>
                        <TableCell className="hidden sm:table-cell capitalize">{t.category}</TableCell>
                        <TableCell>
                          <Badge variant={statusVariant[t.status] || 'default'}>{statusLabel[t.status] || t.status}</Badge>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell text-muted-foreground text-xs">
                          {new Date(t.created_at).toLocaleDateString('pt-BR')}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* FAQ */}
        <Card>
          <CardHeader>
            <CardTitle>Perguntas frequentes</CardTitle>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="q1">
                <AccordionTrigger>Como funciona o cálculo do preço final?</AccordionTrigger>
                <AccordionContent>
                  Preço Final = Custo Total ÷ (1 - Margem de Lucro %). Os custos incluem matéria-prima, mão de obra, custos operacionais e acabamentos. A margem é aplicada sobre o preço de venda, não sobre o custo.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="q2">
                <AccordionTrigger>Qual a diferença entre os planos Free e Pro?</AccordionTrigger>
                <AccordionContent>
                  O plano Free tem limite de cálculos e edições mensais. O Pro libera cálculos ilimitados, simulador de quantidades, custos operacionais avançados, marketplace, exportação e CRM completo.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="q3">
                <AccordionTrigger>Posso editar um cálculo já salvo?</AccordionTrigger>
                <AccordionContent>
                  Sim. No histórico, clique em "Editar" para restaurar todos os campos originais. Usuários Free têm um limite mensal de edições; Pro é ilimitado.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="q4">
                <AccordionTrigger>Como crio um pedido a partir de um orçamento?</AccordionTrigger>
                <AccordionContent>
                  Em Orçamentos, abra um orçamento aprovado e clique em "Converter em pedido". O cliente e os itens são copiados automaticamente, e o pedido aparece no Kanban de Produção.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="q5">
                <AccordionTrigger>Como funciona o módulo Marketplace?</AccordionTrigger>
                <AccordionContent>
                  O Marketplace calcula o preço final levando em conta as taxas da plataforma (Shopee, Mercado Livre, etc.) para que sua margem real seja preservada após os descontos.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="q6">
                <AccordionTrigger>Não recebi o email de confirmação. O que faço?</AccordionTrigger>
                <AccordionContent>
                  Verifique a caixa de spam. Se não encontrar, abra um ticket aqui ou nos chame no WhatsApp que reenviamos manualmente.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
