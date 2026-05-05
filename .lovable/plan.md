## Página de Contato/Suporte

Criar uma página interna `/suporte` onde o usuário envia tickets de ajuda, vê FAQ e canais diretos (WhatsApp/Email) — sem dependência de integrações externas (Zendesk/Intercom).

### O que será criado

1. **Tabela `support_tickets`** (Lovable Cloud)
   - Campos: `user_id`, `email`, `subject`, `category` (bug | dúvida | sugestão | financeiro | outro), `priority` (baixa | média | alta), `message`, `status` (aberto | em_andamento | resolvido), `created_at`, `updated_at`.
   - RLS: usuário só vê/insere os próprios tickets; admins (via `has_role`) podem ver todos.
   - Trigger de `updated_at`.

2. **Página `src/pages/Suporte.tsx`** (rota `/suporte`, protegida)
   - **Hero curto**: "Como podemos ajudar?"
   - **Cards de canais diretos**: WhatsApp (+55 74 98120-9228) e Email (suporte@precigraf.com.br) — ambos clicáveis.
   - **Formulário de ticket**: assunto, categoria, prioridade, mensagem. Validação com Zod (assunto 3–120 chars, mensagem 10–2000 chars). Toast de sucesso e reset.
   - **Histórico "Meus tickets"**: tabela com assunto, status (badge colorido), data — somente do usuário logado.
   - **FAQ accordion**: 5–6 perguntas frequentes sobre planos, cálculos, edição, marketplace.

3. **Navegação**
   - Adicionar item "Suporte" (ícone `LifeBuoy`) no `AppSidebar`.
   - Botão flutuante WhatsApp existente continua disponível na landing.

### Detalhes técnicos

- Stack: shadcn (Card, Input, Textarea, Select, Button, Accordion, Table, Badge), Zod, react-hook-form, sonner.
- Insert via `supabase.from('support_tickets').insert(...)` — RLS garante `user_id = auth.uid()`.
- Listagem com `useEffect` + filtro implícito por RLS.
- Sem edge functions necessárias nesta primeira versão (notificação por email pode ser adicionada depois com Resend).

### Arquivos

- **Migration**: criar tabela `support_tickets` + RLS + trigger.
- **Novo**: `src/pages/Suporte.tsx`.
- **Editar**: `src/App.tsx` (rota), `src/components/AppSidebar.tsx` (item de menu).