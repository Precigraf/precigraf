

# Plan: Módulo Completo de Gestão PreciGraf

## Overview
Transform PreciGraf from a pricing calculator into a full management system with Clients, Quotes, Orders (Kanban), and Dashboard — all integrated with the existing calculator.

## Database Schema (4 new tables + 1 migration)

### Table: `clients`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| user_id | uuid NOT NULL | Owner |
| name | text NOT NULL | |
| email | text | |
| whatsapp | text | |
| cpf | text | |
| cep | text | |
| address | text | |
| neighborhood | text | |
| address_number | text | |
| landmark | text | Ponto de referência |
| city | text | |
| state | text | |
| notes | text | Observações |
| created_at | timestamptz | DEFAULT now() |
| updated_at | timestamptz | DEFAULT now() |

### Table: `quotes` (Orçamentos)
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| user_id | uuid NOT NULL | |
| client_id | uuid FK → clients | NOT NULL |
| calculation_id | uuid FK → calculations | nullable, links to calculator |
| description | text | |
| total_value | numeric NOT NULL | |
| unit_value | numeric | |
| quantity | integer | |
| status | text | 'pending' / 'approved' / 'rejected' |
| raw_data | jsonb | Full calculator snapshot |
| created_at / updated_at | timestamptz | |

### Table: `orders` (Pedidos)
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| user_id | uuid NOT NULL | |
| client_id | uuid FK → clients | NOT NULL |
| quote_id | uuid FK → quotes | NOT NULL |
| status | text | Kanban column |
| kanban_position | integer | Sort order within column |
| created_at / updated_at | timestamptz | |

### Table: `order_status_history` (Log de movimentação)
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| order_id | uuid FK → orders | NOT NULL |
| user_id | uuid NOT NULL | |
| old_status | text | |
| new_status | text NOT NULL | |
| created_at | timestamptz | DEFAULT now() |

### RLS Policies
All 4 tables: `auth.uid() = user_id` for SELECT/INSERT/UPDATE/DELETE (authenticated only).

### Kanban Statuses (constants)
```
approved | creating_art | awaiting_client_approval | in_production | in_transit | delivered
```

## Navigation & Routing

Current header gets a nav bar with tabs:
- **Calculadora** → `/` (existing)
- **Gestão** → `/gestao` (dashboard)
- **Clientes** → `/clientes`
- **Orçamentos** → `/orcamentos`
- **Pedidos** → `/pedidos` (Kanban)

All protected routes.

## New Pages & Components

### 1. `/clientes` — Client Management
- **ClientsPage**: List with search/filter, add button
- **ClientForm**: Modal/dialog with all fields (name, email, whatsapp, cpf, cep, address, etc.)
- **ClientCard**: Row with actions (view, edit, delete, WhatsApp button → `https://wa.me/55{phone}`)
- CEP auto-fill via ViaCEP API (`fetch https://viacep.com.br/ws/{cep}/json/`)

### 2. `/orcamentos` — Quotes Management
- **QuotesPage**: List with status filters (pending/approved/rejected)
- **QuoteForm**: Select client (dropdown of registered clients), link calculator values or manual entry, description field
- **QuoteActions**: Approve (creates order automatically) / Reject buttons
- Integration: "Gerar Orçamento" button on ResultPanel that opens QuoteForm pre-filled with current calculator values

### 3. `/pedidos` — Kanban Board
- **OrdersKanban**: 7-column drag-and-drop board using `@dnd-kit/core` + `@dnd-kit/sortable`
- **OrderCard**: Client name, value, description, date, status badge
- Drag between columns updates status + logs to `order_status_history`
- Realtime updates via Supabase Realtime on `orders` table

### 4. `/gestao` — Dashboard
- **DashboardPage**: Grid of metric cards + charts
- Metrics: total clients, total quotes, approved/rejected quotes, orders in production, delivered orders
- Advanced: total revenue, average ticket, conversion rate (approved/total quotes)
- Uses aggregate queries on clients/quotes/orders tables

## Integration with Calculator

- **ResultPanel** gets a new "Gerar Orçamento" button (Pro feature)
- Clicking opens QuoteForm pre-filled with: product name, values, quantity, raw_inputs
- Quote stores a `raw_data` JSON snapshot of all calculator values
- When viewing a quote, user can see all original calculator data

## Implementation Order

**Step 1**: Database migration (4 tables + RLS + realtime on orders)
**Step 2**: Install `@dnd-kit/core` and `@dnd-kit/sortable` for Kanban
**Step 3**: Create shared types and API hooks (`useClients`, `useQuotes`, `useOrders`)
**Step 4**: Build Clients module (page + form + CRUD)
**Step 5**: Build Quotes module (page + form + approve/reject flow)
**Step 6**: Build Orders Kanban (drag-and-drop board + status history)
**Step 7**: Build Dashboard (metrics + charts)
**Step 8**: Update Header with navigation tabs
**Step 9**: Update App.tsx with new routes
**Step 10**: Add "Gerar Orçamento" integration to ResultPanel

## Technical Details

- All modules are Pro features (gated by `useUserPlan`)
- Kanban uses `@dnd-kit` for accessible drag-and-drop
- CEP lookup via `fetch('https://viacep.com.br/ws/${cep}/json/')`
- WhatsApp link: `https://wa.me/55${phone.replace(/\D/g, '')}`
- Order auto-creation on quote approval uses a single transaction (insert order + update quote status)
- Realtime subscription on `orders` table for live Kanban updates
- All dates displayed with `toLocaleDateString('pt-BR')`

## Files to Create
- `src/pages/Clientes.tsx`
- `src/pages/Orcamentos.tsx`
- `src/pages/Pedidos.tsx`
- `src/pages/Gestao.tsx`
- `src/components/gestao/ClientForm.tsx`
- `src/components/gestao/ClientCard.tsx`
- `src/components/gestao/QuoteForm.tsx`
- `src/components/gestao/QuoteCard.tsx`
- `src/components/gestao/OrderCard.tsx`
- `src/components/gestao/KanbanBoard.tsx`
- `src/components/gestao/KanbanColumn.tsx`
- `src/components/gestao/DashboardMetrics.tsx`
- `src/hooks/useClients.ts`
- `src/hooks/useQuotes.ts`
- `src/hooks/useOrders.ts`

## Files to Modify
- `src/App.tsx` — add routes
- `src/components/Header.tsx` — add navigation tabs
- `src/components/ResultPanel.tsx` — add "Gerar Orçamento" button

