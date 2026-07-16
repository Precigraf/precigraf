
# Agenda de Entregas

Novo módulo "Agenda" com calendário mensal que mostra todos os pedidos (orçamentos aprovados convertidos) na data estimada de entrega, com cadastro da data no momento da aprovação e alertas de pedidos próximos ou atrasados.

## 1. Banco de dados

Adicionar 2 campos na tabela `orders`:
- `delivery_date` (date, nullable) — data estimada de entrega
- `delivery_notes` (text, nullable) — observações opcionais sobre a entrega

Sem alteração em RLS: o dono do pedido continua controlando via `user_id`.

## 2. Cadastro da data de entrega ao aprovar

Ao converter um orçamento em pedido (fluxo do `ConvertToOrderModal` no admin e o `respond_to_quote_by_token` quando o cliente aprova):

- **Admin (ConvertToOrderModal)**: adicionar campo "Data estimada de entrega" (date picker shadcn) + "Observações". Salvo em `orders.delivery_date` na criação.
- **Aprovação pelo cliente via link público**: o cliente não define prazo. Ao aprovar, o pedido é criado sem `delivery_date` e aparece como "Sem data" na Agenda — o usuário define depois pelo modal de detalhes.
- **OrderDetailsModal**: adicionar bloco "Entrega" com data + observações, editável a qualquer momento.

## 3. Página `/agenda`

Nova rota e item no sidebar (ícone `CalendarDays`), entre "Pedidos" e "Produção".

Layout:

```text
┌─────────────────────────────────────────────┐
│ Agenda de Entregas          [◀ Mês ▶ ] [Hoje]│
├─────────────────────────────────────────────┤
│ KPIs: Atrasados · Hoje · Próximos 7d · Mês  │
├─────────────────────────────────────────────┤
│ Seg  Ter  Qua  Qui  Sex  Sáb  Dom           │
│ ┌──┐┌──┐┌──┐┌──┐┌──┐┌──┐┌──┐               │
│ │15││16││17││18││19││20││21│  células       │
│ │● ││●●││  ││●││●●●│... com pills de       │
│ └──┘└──┘└──┘└──┘└──┘└──┘└──┘  pedidos       │
├─────────────────────────────────────────────┤
│ Lista lateral: pedidos do dia selecionado   │
└─────────────────────────────────────────────┘
```

- **Grade mensal**: cada célula lista até 3 pedidos como pills coloridas por status (mesmas cores do Kanban). Overflow com "+N mais".
- **Cores especiais**:
  - Vermelho: `delivery_date < hoje` e status ≠ `delivered`
  - Amarelo: entrega em ≤ 2 dias
  - Verde: entregue
- **Clique na célula**: abre painel/drawer com todos os pedidos do dia.
- **Clique no pedido**: abre o `OrderDetailsModal` existente.
- **Pedidos sem data**: seção "Sem data de entrega" abaixo do calendário com CTA para definir.
- **Filtro**: seletor de status (reutiliza `KANBAN_COLUMNS`).
- **Mobile**: cai para "Agenda list view" (lista agrupada por dia, sem grade), mantendo padrão responsivo do sistema.

## 4. Alertas

**Central de notificações** (tabela `notifications` já existente): novo tipo `order_delivery_due`.

Gatilho: função edge diária (`cron` via `pg_cron` ou trigger acionado ao abrir a Agenda com verificação `last_checked_at` em profile) que cria notificações para:
- Pedidos com `delivery_date = amanhã` → "Entrega amanhã: PED-X"
- Pedidos com `delivery_date < hoje` e status ≠ `delivered` → "Pedido atrasado: PED-X"

MVP simples: verificação client-side ao carregar a Agenda + `SmartAlerts` no Dashboard mostrando contadores (atrasados / hoje / próximos 3 dias) com link para `/agenda`.

## 5. Aproveitamento no restante do sistema

- **Dashboard (`/gestao`)**: novo card "Próximas entregas" com 5 mais próximas + contador de atrasados.
- **Kanban de Pedidos**: badge de data de entrega no `OrderCard` (com destaque vermelho se atrasado).
- **Página Pedidos**: nova coluna "Entrega" e filtro "Atrasados / Hoje / Esta semana".
- **Portal do cliente** (`/cliente/{token}`): mostrar previsão de entrega em cada pedido, aumentando transparência.
- **Rastreio público** (`/rastreio/{token}`): incluir "Previsão de entrega" além do status.
- **Produção**: pedidos podem ser ordenados por `delivery_date` (priorização automática).
- **Notificações WhatsApp** (futuro): D-1 automático ao cliente confirmando data.

## 6. Detalhes técnicos

Arquivos novos:
- `src/pages/Agenda.tsx` — grade mensal + lista lateral
- `src/components/agenda/CalendarGrid.tsx` — grade 7×N com células
- `src/components/agenda/DayCell.tsx` — célula com pills
- `src/components/agenda/DayOrdersDrawer.tsx` — detalhe do dia
- `src/hooks/useDeliverySchedule.ts` — query dos pedidos com data
- Migration adicionando colunas em `orders` + índice em `delivery_date`

Arquivos alterados:
- `src/App.tsx` — rota `/agenda`
- `src/components/AppSidebar.tsx` — item Agenda
- `src/components/AppLayout.tsx` — `ROUTE_TITLES`
- `src/components/gestao/ConvertToOrderModal.tsx` — campo data
- `src/components/gestao/OrderDetailsModal.tsx` — bloco entrega
- `src/components/gestao/OrderCard.tsx` — badge data
- `src/hooks/useOrders.ts` — tipos + mutação `updateOrderDelivery`
- `src/pages/Pedidos.tsx` — coluna e filtro entrega
- `src/pages/Gestao.tsx` — card próximas entregas

Padrão visual: shadcn `Calendar`, `Card`, `Badge`, tokens do design system (sem cores hardcoded), totalmente responsivo com layout mobile em lista.

## Pontos a confirmar

1. Quando o cliente aprova via link público, tudo bem o pedido nascer **sem** data (usuário define depois), ou você quer que apareça um campo opcional para o cliente sugerir prazo?
2. Alertas via **notificações internas** (sino) já cobrem o cenário, ou você também quer WhatsApp automático para o cliente D-1?
3. Regra de "atrasado" = `delivery_date < hoje` E status ≠ `delivered` — ok?
