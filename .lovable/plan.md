
## Plano de Implementação

### 1. Login → Dashboard (em vez de Calculadora)

**Arquivo**: `src/pages/Auth.tsx` (e qualquer outro ponto que redirecione para `/`)
- Alterar o redirecionamento pós-login de `/` para `/gestao` (rota do Dashboard).
- Manter `/` (Calculadora) acessível normalmente via menu lateral.
- O Dashboard já existe em `src/pages/Gestao.tsx`.

---

### 2. Link Público de Rastreamento de Pedidos

#### 2.1 Banco de Dados (migration)

**Tabela `orders`** — adicionar coluna:
- `tracking_token TEXT UNIQUE` — gerado automaticamente por trigger usando `gen_random_uuid()` no INSERT (token UUID, sem expor `id` interno).
- Backfill: gerar tokens únicos para todos os pedidos existentes.
- Índice em `tracking_token` para busca rápida.

**Função RPC pública** `get_order_by_tracking_token(p_token TEXT)`:
- `SECURITY DEFINER`, retorna apenas dados não sensíveis em JSON:
  - `order_number`, `status`, `created_at`
  - `client_name` (nome do cliente)
  - `seller_name` / `store_name` (de `profiles.store_name` ou `company_name`)
  - `items` (array com `name` e `quantity` apenas — sem valores)
- **NÃO** retorna: valores, custos, descontos, dados de contato.
- Concedida via `GRANT EXECUTE ... TO anon, authenticated`.

#### 2.2 Painel Interno — Seção "Link para Cliente Acompanhar"

**Arquivo**: `src/components/gestao/OrderDetailsModal.tsx`
- Nova seção (Card) dentro do modal:
  - Label: **"Link para Cliente Acompanhar"**
  - Input readonly com URL: `${window.location.origin}/pedido/${order.tracking_token}`
  - Botão **Copiar** ao lado direito (ícone `Copy` do lucide, com toast de confirmação).
  - Texto auxiliar: *"Envie este link ao cliente para ele acompanhar o status do pedido"*.
- Adicionar `tracking_token` ao `select` em `useOrders.ts` e ao tipo `Order`.

#### 2.3 Página Pública `/pedido/:token`

**Novo arquivo**: `src/pages/RastreioPedido.tsx`
- Rota pública (fora de `ProtectedRoute`) registrada em `src/App.tsx`.
- Busca dados via `supabase.rpc('get_order_by_tracking_token', { p_token })`.
- Layout responsivo (mobile-first), sem sidebar, com header próprio.

**Estrutura visual**:

1. **Cabeçalho**
   - Logo/Título: **"Área do Cliente"**
   - Subtítulo: nome do vendedor/loja

2. **Card — Status do Pedido**
   - Topo: `Pedido #N` à esquerda, **Badge de status** à direita
   - Saudação: `Olá, {nome do cliente}!`
   - **Timeline horizontal** com 5 etapas (ajuste do briefing que listou 4+1):
     1. Pedido Recebido (`approved`)
     2. Criando Arte (`creating_art`)
     3. Aguardando Aprovação (`awaiting_client_approval`)
     4. Em Transporte (`in_transit` — agrupa também `in_production`)
     5. Entregue (`delivered`)
   - Estados visuais: **concluída** (check verde) / **atual** (destaque colorido + pulse) / **futura** (cinza inativo)
   - Conector entre ícones muda de cor conforme progresso
   - Rodapé: `Pedido realizado em: {data formatada em pt-BR}`

3. **Card — Itens do Pedido**
   - Título: **"Itens do Pedido"**
   - Lista: `nome do produto` × `quantidade` (sem valores)

**Estados de erro/loading**:
- Loading: skeleton.
- Token inválido: mensagem amigável "Pedido não encontrado".

#### 2.4 Realtime (opcional, recomendado)
- Inscrever `postgres_changes` na página pública filtrando pelo `order_id` retornado, para refletir mudanças de status em tempo real.

---

### Resumo de Arquivos

**Criados**:
- `src/pages/RastreioPedido.tsx`
- Migration: adicionar `tracking_token` em `orders` + função RPC pública

**Editados**:
- `src/pages/Auth.tsx` — redirect pós-login para `/gestao`
- `src/App.tsx` — registrar rota pública `/pedido/:token`
- `src/components/gestao/OrderDetailsModal.tsx` — seção do link
- `src/hooks/useOrders.ts` — incluir `tracking_token` no tipo e select

**Segurança**:
- Token UUID v4 (não enumerável)
- RPC retorna apenas dados não sensíveis
- Sem exposição de `order.id`, valores ou custos
- RLS de `orders` permanece intacta (acesso público apenas via RPC controlada)
