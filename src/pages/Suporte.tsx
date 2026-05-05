import { useEffect, useRef, useState } from 'react';
import { z } from 'zod';
import { LifeBuoy, MessageCircle, Mail, Send, Loader2, CheckCircle2, MessagesSquare, Trash2 } from 'lucide-react';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
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
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const ticketSchema = z.object({
  subject: z.string().trim().min(3, 'Mínimo 3 caracteres').max(120, 'Máximo 120 caracteres'),
  category: z.enum(['bug', 'duvida', 'sugestao', 'financeiro', 'outro']),
  priority: z.enum(['baixa', 'media', 'alta']),
  message: z.string().trim().min(10, 'Mínimo 10 caracteres').max(2000, 'Máximo 2000 caracteres'),
});

const messageSchema = z.string().trim().min(1, 'Escreva uma mensagem').max(4000, 'Máximo 4000 caracteres');

type Ticket = {
  id: string;
  subject: string;
  category: string;
  priority: string;
  status: string;
  created_at: string;
  updated_at?: string;
};

type TicketMessage = {
  id: string;
  ticket_id: string;
  user_id: string;
  author_role: 'user' | 'admin';
  message: string;
  created_at: string;
};

const WHATSAPP = '5574981209228';
const SUPPORT_EMAIL = 'precigraf@gmail.com';

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

  // Conversation dialog
  const [openTicket, setOpenTicket] = useState<Ticket | null>(null);
  const [messages, setMessages] = useState<TicketMessage[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [reply, setReply] = useState('');
  const [sending, setSending] = useState(false);
  const [closing, setClosing] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Ticket | null>(null);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    const { error } = await supabase.from('support_tickets').delete().eq('id', deleteTarget.id);
    setDeleting(false);
    if (error) {
      toast.error('Não foi possível excluir.');
      return;
    }
    toast.success('Ticket excluído.');
    setTickets((prev) => prev.filter((x) => x.id !== deleteTarget.id));
    if (openTicket?.id === deleteTarget.id) setOpenTicket(null);
    setDeleteTarget(null);
  };
  const scrollEndRef = useRef<HTMLDivElement | null>(null);

  const loadTickets = async () => {
    setLoadingList(true);
    const { data, error } = await supabase
      .from('support_tickets')
      .select('id, subject, category, priority, status, created_at, updated_at')
      .order('updated_at', { ascending: false })
      .limit(20);
    if (!error) setTickets((data || []) as Ticket[]);
    setLoadingList(false);
  };

  useEffect(() => {
    if (user) loadTickets();
  }, [user]);

  // Realtime: refresh own ticket list on changes
  useEffect(() => {
    if (!user) return;
    const ch = supabase
      .channel('support-tickets-list')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'support_tickets', filter: `user_id=eq.${user.id}` },
        () => loadTickets(),
      )
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user]);

  // Load messages when opening a ticket + realtime subscription
  useEffect(() => {
    if (!openTicket) return;
    let cancelled = false;
    setLoadingMessages(true);
    setMessages([]);
    (async () => {
      const { data, error } = await supabase
        .from('support_ticket_messages')
        .select('id, ticket_id, user_id, author_role, message, created_at')
        .eq('ticket_id', openTicket.id)
        .order('created_at', { ascending: true });
      if (!cancelled) {
        if (!error) setMessages((data || []) as TicketMessage[]);
        setLoadingMessages(false);
      }
    })();

    const ch = supabase
      .channel(`ticket:${openTicket.id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'support_ticket_messages', filter: `ticket_id=eq.${openTicket.id}` },
        (payload) => {
          const m = payload.new as TicketMessage;
          setMessages((prev) => (prev.some((x) => x.id === m.id) ? prev : [...prev, m]));
        },
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'support_tickets', filter: `id=eq.${openTicket.id}` },
        (payload) => {
          const t = payload.new as Ticket;
          setOpenTicket((cur) => (cur ? { ...cur, ...t } : cur));
        },
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(ch);
    };
  }, [openTicket?.id]);

  // auto-scroll to last message
  useEffect(() => {
    scrollEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const parsed = ticketSchema.safeParse({ subject, category, priority, message });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    setSubmitting(true);
    const d = parsed.data;
    const { data: inserted, error } = await supabase
      .from('support_tickets')
      .insert([{
        user_id: user.id,
        email: user.email ?? '',
        subject: d.subject,
        category: d.category,
        priority: d.priority,
        message: d.message,
      }])
      .select('id')
      .single();
    if (!error && inserted) {
      // also seed first conversation message
      await supabase.from('support_ticket_messages').insert([{
        ticket_id: inserted.id,
        user_id: user.id,
        message: d.message,
      }]);
    }
    setSubmitting(false);
    if (error) {
      toast.error('Não foi possível enviar. Tente novamente.');
      return;
    }
    toast.success('Ticket enviado! Acompanhe a conversa abaixo.');
    setSubject('');
    setMessage('');
    setCategory('duvida');
    setPriority('media');
    loadTickets();
  };

  const sendReply = async () => {
    if (!user || !openTicket) return;
    const parsed = messageSchema.safeParse(reply);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    setSending(true);
    const { error } = await supabase.from('support_ticket_messages').insert([{
      ticket_id: openTicket.id,
      user_id: user.id,
      message: parsed.data,
    }]);
    setSending(false);
    if (error) {
      toast.error('Falha ao enviar mensagem.');
      return;
    }
    setReply('');
  };

  const markResolved = async () => {
    if (!openTicket) return;
    setClosing(true);
    const { error } = await supabase
      .from('support_tickets')
      .update({ status: 'resolvido' })
      .eq('id', openTicket.id);
    setClosing(false);
    if (error) {
      toast.error('Não foi possível concluir o ticket.');
      return;
    }
    toast.success('Ticket marcado como concluído!');
    setOpenTicket((cur) => (cur ? { ...cur, status: 'resolvido' } : cur));
  };

  const reopen = async () => {
    if (!openTicket) return;
    setClosing(true);
    const { error } = await supabase
      .from('support_tickets')
      .update({ status: 'aberto' })
      .eq('id', openTicket.id);
    setClosing(false);
    if (error) {
      toast.error('Não foi possível reabrir.');
      return;
    }
    setOpenTicket((cur) => (cur ? { ...cur, status: 'aberto' } : cur));
  };

  const isResolved = openTicket?.status === 'resolvido';

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
            <CardDescription>Descreva sua dúvida ou problema. Você pode conversar com nossa equipe diretamente no ticket.</CardDescription>
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
            <CardDescription>Clique em um ticket para abrir a conversa.</CardDescription>
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
                      <TableHead className="hidden sm:table-cell">Atualizado</TableHead>
                      <TableHead className="text-right">Ação</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tickets.map((t) => (
                      <TableRow
                        key={t.id}
                        className="cursor-pointer hover:bg-muted/40"
                        onClick={() => setOpenTicket(t)}
                      >
                        <TableCell className="font-medium max-w-[260px] truncate">
                          <div className="flex items-center gap-2">
                            {t.status === 'resolvido' && <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />}
                            <span className="truncate">{t.subject}</span>
                          </div>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell capitalize">{t.category}</TableCell>
                        <TableCell>
                          <Badge variant={statusVariant[t.status] || 'default'}>{statusLabel[t.status] || t.status}</Badge>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell text-muted-foreground text-xs">
                          {new Date(t.updated_at || t.created_at).toLocaleString('pt-BR')}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); setOpenTicket(t); }}>
                              <MessagesSquare className="w-4 h-4 sm:mr-1" />
                              <span className="hidden sm:inline">Abrir</span>
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-destructive hover:text-destructive"
                              onClick={(e) => { e.stopPropagation(); setDeleteTarget(t); }}
                              aria-label="Excluir ticket"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
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

      {/* Conversation Dialog */}
      <Dialog open={!!openTicket} onOpenChange={(o) => !o && setOpenTicket(null)}>
        <DialogContent className="max-w-2xl p-0 gap-0 flex flex-col h-[85vh]">
          {openTicket && (
            <>
              <DialogHeader className="p-4 border-b space-y-2">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <DialogTitle className="truncate">{openTicket.subject}</DialogTitle>
                    <DialogDescription className="flex items-center gap-2 mt-1">
                      <Badge variant={statusVariant[openTicket.status] || 'default'}>
                        {openTicket.status === 'resolvido' && <CheckCircle2 className="w-3 h-3 mr-1" />}
                        {statusLabel[openTicket.status] || openTicket.status}
                      </Badge>
                      <span className="text-xs capitalize">{openTicket.category}</span>
                    </DialogDescription>
                  </div>
                  {isResolved ? (
                    <Button size="sm" variant="outline" onClick={reopen} disabled={closing}>
                      {closing ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Reabrir'}
                    </Button>
                  ) : (
                    <Button size="sm" onClick={markResolved} disabled={closing}>
                      {closing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
                      Marcar como concluído
                    </Button>
                  )}
                </div>
              </DialogHeader>

              <ScrollArea className="flex-1 p-4">
                {loadingMessages ? (
                  <div className="flex justify-center py-8"><Loader2 className="animate-spin text-muted-foreground" /></div>
                ) : messages.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">Nenhuma mensagem ainda.</p>
                ) : (
                  <div className="space-y-3">
                    {messages.map((m) => {
                      const mine = m.user_id === user?.id;
                      const isAdmin = m.author_role === 'admin';
                      return (
                        <div key={m.id} className={cn('flex', mine ? 'justify-end' : 'justify-start')}>
                          <div
                            className={cn(
                              'max-w-[80%] rounded-2xl px-4 py-2 text-sm whitespace-pre-wrap break-words shadow-sm',
                              mine
                                ? 'bg-primary text-primary-foreground rounded-br-sm'
                                : 'bg-muted text-foreground rounded-bl-sm',
                            )}
                          >
                            <div className="flex items-center gap-2 mb-1 text-[10px] uppercase tracking-wide opacity-80">
                              <span>{isAdmin ? 'Equipe Precigraf' : mine ? 'Você' : 'Usuário'}</span>
                              <span>·</span>
                              <span>{new Date(m.created_at).toLocaleString('pt-BR')}</span>
                            </div>
                            {m.message}
                          </div>
                        </div>
                      );
                    })}
                    <div ref={scrollEndRef} />
                  </div>
                )}
              </ScrollArea>

              <div className="border-t p-3">
                {isResolved ? (
                  <p className="text-xs text-center text-muted-foreground py-2">
                    Este ticket está concluído. Reabra para enviar novas mensagens.
                  </p>
                ) : (
                  <div className="flex gap-2 items-end">
                    <Textarea
                      value={reply}
                      onChange={(e) => setReply(e.target.value)}
                      placeholder="Escreva sua mensagem..."
                      rows={2}
                      maxLength={4000}
                      className="resize-none"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          sendReply();
                        }
                      }}
                    />
                    <Button onClick={sendReply} disabled={sending || !reply.trim()}>
                      {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    </Button>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
