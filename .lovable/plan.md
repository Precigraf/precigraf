## Plano de evolução

Vou implementar em três entregas independentes (você aprova e eu sigo na ordem) + um ajuste rápido na landing page agora.

---

### A. Ajuste imediato na Landing Page

Hoje o Hero usa um grid 2 colunas (texto à esquerda, mockup à direita). Vou reorganizar para:

- Bloco superior: título, subtítulo, CTAs e badge **centralizados** (texto, botões e disclaimer alinhados ao centro em todos os tamanhos).
- Bloco inferior: o `HeroMockup` (cards "Sacola Personalizada" + "Sugestão inteligente") em **layout horizontal** ocupando largura cheia, com os dois cards lado a lado em desktop e empilhados só no mobile.

Arquivos: `src/pages/LandingPage.tsx` (seção HERO) e pequenos ajustes no `HeroMockup.tsx` para garantir bom uso da largura total (manter `lg:grid-cols-5` 3+2 já existente, só remover a "moldura" estreita).

---

### 1. Retenção e engajamento (Fase 1)

**1.1 Central de notificações (in-app, tempo real)**
- Tabela `notifications` (`user_id`, `type`, `title`, `body`, `link`, `read_at`, `created_at`) com RLS por dono.
- Realtime habilitado na tabela.
- Componente `NotificationBell` no `Header` com badge de não lidas, popover com lista, marcar como lida e link.
- Eventos que geram notificação: nova mensagem de suporte (admin → usuário), orçamento aprovado pelo cliente, pedido movido no Kanban, lembrete de cobrança.

**1.2 Aprovação pública de orçamento**
- Coluna `public_token` (uuid) em `quotes` + tabela `quote_responses` (`quote_id`, `action: approved|changes_requested`, `comment`, `created_at`).
- Página `/orcamento/:token` (pública, sem login): mostra cliente, itens, totais, condições, e botões **Aprovar** / **Solicitar ajustes** (com campo de comentário).
- Trigger: ao aprovar → muda status do quote para `aprovado` e cria automaticamente o Pedido vinculado no Kanban (coluna inicial). Notifica o usuário.
- Botão "Copiar link de aprovação" na tela do orçamento.

**1.3 Lembretes automáticos**
- Edge function agendada (`pg_cron` diário) que varre orçamentos `enviado` há > N dias sem resposta e cria notificação "cobrar cliente"; idem para pedidos parados na mesma coluna.
- Configurável: dias de inatividade no `profiles` (default 5).

---

### 3. Profissionalização da saída comercial (Fase 2)

**3.1 PDF profissional de orçamento**
- Geração via `jspdf` + `jspdf-autotable` (client-side, sem edge function).
- Layout: cabeçalho com `logo_url` + dados do `profiles` (razão, CNPJ, telefone, email), bloco do cliente, tabela de itens (descrição/qtd/un/total), totais, condições de pagamento, validade, observações, rodapé com link público de aprovação + QR Code (`qrcode` lib).
- Botão "Baixar PDF" e "Visualizar" no `OrcamentoEditor` e na lista.

**3.2 Compartilhamento direto**
- Botões "Enviar por WhatsApp" (abre `wa.me` com mensagem pronta + link público) e "Enviar por email" (edge function com template branded usando o domínio custom já configurado).
- Registra envio em `quote_events` para auditoria.

---

### 4. Financeiro mais robusto (Fase 3)

**4.1 Contas a receber**
- Tabela `receivables` (`order_id`, `amount`, `due_date`, `paid_at`, `amount_paid`, `status: pendente|parcial|pago|atrasado`).
- Ao confirmar pedido → gera receivable(s) conforme condição (à vista / parcelado).
- Tela `/financeiro/receber` com filtros por status, vencimento, cliente. Ação "Marcar como pago" (com data e valor).

**4.2 Fluxo de caixa projetado**
- Card no `Dashboard` e tela dedicada: 30/60/90 dias.
- Entradas previstas = receivables pendentes + (orçamentos `enviado` × taxa histórica de aprovação do usuário).
- Saídas previstas = `expenses` recorrentes + lançamentos futuros.
- Gráfico de linha (saldo projetado) usando `recharts` (já no projeto).

**4.3 Categorização automática de despesas com IA**
- Botão "Sugerir categoria" em `expenses` usando Lovable AI (`google/gemini-2.5-flash`) — recebe descrição e retorna categoria entre as existentes do usuário.
- Endpoint via edge function `suggest-expense-category`.

---

### Detalhes técnicos relevantes

- Todas as tabelas novas: RLS forçado, policies por `auth.uid() = user_id`, sem acesso anônimo (exceto `quotes` via `public_token` que terá policy específica baseada no token).
- Pro CRM já é gate: receivables, aprovação pública e PDF profissional ficam atrás do `useUserPlan().isPro` (mantém regra existente).
- Realtime: `ALTER PUBLICATION supabase_realtime ADD TABLE notifications`.
- Sem novas dependências pesadas: apenas `jspdf`, `jspdf-autotable`, `qrcode` (leves, client-side).

---

### Ordem de execução proposta

1. Ajuste do Hero (agora, junto com a Fase 1).
2. Fase 1 — Retenção (notificações + aprovação pública + lembretes).
3. Fase 2 — PDF + envio.
4. Fase 3 — Financeiro (receivables + fluxo + IA categoria).

Confirma essa ordem? Se preferir paralelizar ou trocar prioridade, me diga antes de aprovar.