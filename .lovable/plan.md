# Plano: Ordens de Produção (estender módulos atuais) + ajuste em /perfil

## Decisões importantes (antes de implementar)

O sistema já possui:
- Tabela `orders` (com `status`, `kanban_position`, `tracking_token`, `order_number`, vínculo com `quotes` e `clients`).
- Página `/producao` com Kanban arrastável (7 colunas) e KPIs.
- Página `/pedidos` (listagem).
- Trigger que **cria a ordem automaticamente** quando o orçamento é aprovado (via `respond_to_quote_by_token`).
- Consumo automático de insumos do estoque na aprovação do orçamento (`consume_supplies_for_order`).

O pedido do usuário propõe uma **nova tabela `orders` duplicada** + nova página `/ordens`. Isso entraria em conflito direto com o que já existe e quebraria fluxos do orçamento → pedido → estoque → financeiro.

**Decisão:** vou **estender** a estrutura atual em vez de duplicar. Mantenho `/producao` como a tela principal de Kanban e adiciono uma nova rota `/ordens` que é uma **visão executiva** das mesmas ordens (lista + calendário + alertas + painel de detalhes com stepper e histórico). Sem tabela duplicada, sem quebrar fluxos.

---

## Parte 1 — Remoção em Configurações (rápido)

Em `src/pages/Perfil.tsx` (linhas ~297-330), remover o bloco "Pré-visualização (PDF / link de aprovação)" com os controles de zoom. Manter o upload do logotipo e o salvamento de `logo_scale` (que já é aplicado no PDF e no link de aprovação) — apenas a caixa de pré-visualização é removida.

---

## Parte 2 — Ordens de Produção (módulo)

### 2.1 Banco de dados (migration)

Adicionar **somente** o que falta. Não criar tabela `orders` nova.

```sql
-- novas colunas em orders
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS title TEXT,
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS priority TEXT NOT NULL DEFAULT 'normal'
    CHECK (priority IN ('normal','urgent','critical')),
  ADD COLUMN IF NOT EXISTS delivery_type TEXT NOT NULL DEFAULT 'pickup'
    CHECK (delivery_type IN ('pickup','delivery','correios')),
  ADD COLUMN IF NOT EXISTS delivery_address TEXT,
  ADD COLUMN IF NOT EXISTS tracking_code TEXT,
  ADD COLUMN IF NOT EXISTS internal_notes TEXT,
  ADD COLUMN IF NOT EXISTS start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  ADD COLUMN IF NOT EXISTS due_date DATE,
  ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS responsible_name TEXT;

CREATE INDEX IF NOT EXISTS idx_orders_due_date ON public.orders(due_date);
CREATE INDEX IF NOT EXISTS idx_orders_priority ON public.orders(priority);

-- order_history (log imutável)
CREATE TABLE IF NOT EXISTS public.order_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  action TEXT NOT NULL,
  from_stage TEXT,
  to_stage TEXT,
  actor_name TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.order_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "order_history owner select" ON public.order_history
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "order_history owner insert" ON public.order_history
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- view de resumo
CREATE OR REPLACE VIEW public.orders_summary AS
SELECT user_id,
  COUNT(*) FILTER (WHERE status NOT IN ('delivered','cancelled')) AS total_in_progress,
  COUNT(*) FILTER (WHERE status NOT IN ('delivered','cancelled')
                   AND due_date IS NOT NULL AND due_date < CURRENT_DATE) AS total_delayed,
  COUNT(*) FILTER (WHERE status = 'delivered'
                   AND delivered_at::date = CURRENT_DATE) AS delivered_today,
  COUNT(*) FILTER (WHERE status NOT IN ('delivered','cancelled')
                   AND due_date = CURRENT_DATE) AS due_today,
  COUNT(*) FILTER (WHERE status NOT IN ('delivered','cancelled')
                   AND due_date = CURRENT_DATE + 1) AS due_tomorrow,
  COUNT(*) FILTER (WHERE priority IN ('urgent','critical')
                   AND status NOT IN ('delivered','cancelled')) AS urgent_count
FROM public.orders
GROUP BY user_id;

-- view de etapas paradas (>2h sem update)
CREATE OR REPLACE VIEW public.orders_stalled AS
SELECT o.id, o.user_id, o.order_number, o.title, o.status AS current_stage,
       o.due_date, o.priority,
       EXTRACT(EPOCH FROM (now() - o.updated_at))/3600 AS hours_stalled
FROM public.orders o
WHERE o.status NOT IN ('delivered','cancelled')
  AND o.updated_at < now() - INTERVAL '2 hours';

-- RPC para avançar etapa + log
CREATE OR REPLACE FUNCTION public.advance_order_stage(
  p_order_id UUID, p_to_stage TEXT,
  p_actor_name TEXT DEFAULT NULL, p_notes TEXT DEFAULT NULL
) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_user UUID; v_from TEXT;
BEGIN
  SELECT user_id, status INTO v_user, v_from FROM public.orders WHERE id = p_order_id;
  IF v_user IS NULL OR v_user <> auth.uid() THEN RAISE EXCEPTION 'access denied'; END IF;
  UPDATE public.orders
     SET status = p_to_stage,
         delivered_at = CASE WHEN p_to_stage = 'delivered' THEN now() ELSE delivered_at END,
         updated_at = now()
   WHERE id = p_order_id;
  INSERT INTO public.order_history(order_id, user_id, action, from_stage, to_stage, actor_name, notes)
  VALUES (p_order_id, v_user, 'Etapa avançada', v_from, p_to_stage, p_actor_name, p_notes);
END; $$;
```

Observação: as 5 etapas do escopo (`art/print/finishing/packaging/delivered`) serão **mapeadas para as colunas Kanban já existentes** (`creating_art`→Arte, `in_production`→Impressão+Acabamento, `packing`→Embalagem, `in_transit`+`delivered`→Entregue). Não inventamos status novos para não quebrar o Kanban atual.

### 2.2 Hook

Estender `src/hooks/useOrders.ts` (não criar paralelo):
- adicionar campos novos (`priority`, `due_date`, `delivery_type`, etc.) à interface `Order`;
- adicionar queries `useOrdersSummary()` e `useStalledOrders()`;
- adicionar `useOrderHistory(orderId)`;
- adicionar mutation `advanceStage` chamando o RPC `advance_order_stage` e invalidando `['orders']`.

### 2.3 Página `/ordens`

Nova rota protegida `src/pages/OrdensPedido.tsx` (item no `AppSidebar` com ícone `ClipboardList` logo após "Pedidos"). Estrutura:

1. **Header**: título + mês/ano + botões "Filtrar" e "+ Nova ordem" (Sheets).
2. **4 cards de resumo** lendo `orders_summary` (Em produção / Entregues hoje / Atrasados / Vencem em 24h).
3. **Alertas inteligentes** (ordens atrasadas + etapas paradas de `orders_stalled`). Clicar → abre painel.
4. **Tabs**: Lista | Calendário | (link para Kanban → `/producao`, evitando duplicar UI).
   - **Lista**: tabela ordenável (Nº, Cliente, Produto, Etapa, Prioridade, Entrega, Status, Ações).
   - **Calendário**: grade mensal com pills por `due_date` (cor por status).
5. **Painel de detalhes** (abre abaixo ao clicar): número OP-XXXX, cliente, orçamento vinculado, datas, prioridade, forma de entrega, responsável, observações, **stepper horizontal de 5 etapas** (Palette/Printer/Scissors/Package/Truck), botão "Avançar etapa" (popover com responsável + observação → `advance_order_stage`) e **histórico** de `order_history`.
6. **Sheet "Nova ordem"**: campos do escopo (cliente, produto, quantidade, valor, prioridade, datas, forma de entrega condicional, observações, vincular orçamento aprovado opcional). Salva em `orders` + linha em `order_history`.
7. **Sheet "Filtros"**: status, etapa, prioridade, período de entrega.

### 2.4 Componente `SmartAlerts`

Adicionar três alertas extras (atrasada / parada há 2h+ / urgente vencendo hoje). Clique → `navigate('/ordens?orderId=...')` e o painel abre automaticamente via query string.

### 2.5 Integrações

- **Orçamento aprovado** já cria ordem (fluxo atual mantido). Em `AprovacaoOrcamento.tsx` adicionar toast: "Ordem de produção OP-XXXX criada automaticamente." (lendo `order_number` retornado).
- **Estoque**: o consumo já ocorre na aprovação (mantém). Não duplicar no avanço de etapa.
- **Financeiro**: ao mover para `delivered`, marcar `receivables` vinculados (já existem via `order_id`) como pagos somente se já houver pagamento confirmado — caso contrário apenas toast informativo ("Entrega confirmada"). Sem mexer em recebíveis pendentes para não criar pagamento fantasma.

### 2.6 Formatação

- `OP-XXXX` com `order_number.toString().padStart(4,'0')`.
- Datas `dd/MM/yyyy` (`date-fns` pt-BR).
- Moeda `Intl.NumberFormat('pt-BR', { style:'currency', currency:'BRL' })`.

---

## Como aproveitar ao máximo

- Aprove orçamentos → a ordem nasce sozinha em `/producao` e `/ordens`.
- Use `/producao` para operação diária (arrasta cards). Use `/ordens` para gestão (lista, calendário, alertas, histórico, prioridades, prazos).
- Defina `due_date` e `priority` na criação para os alertas e cards de resumo funcionarem.
- Em "Forma de entrega = Correios", preencha o `tracking_code` para aparecer no portal público do cliente.

---

## Arquivos afetados (resumo)

- Migration (nova).
- `src/pages/Perfil.tsx` — remover bloco de pré-visualização.
- `src/hooks/useOrders.ts` — estender.
- `src/pages/OrdensPedido.tsx` — nova.
- `src/components/AppSidebar.tsx` — novo item de menu.
- `src/components/SmartAlerts.tsx` — alertas novos.
- `src/pages/AprovacaoOrcamento.tsx` — toast com nº da OP.
- `src/App.tsx` — rota `/ordens`.
