# Plano combinado: Variações de Produto + Sincronização em tempo real da Área do Cliente

---

## Parte 1 — Variações de Quantidade/Preço por Produto

### Objetivo
Permitir que cada produto tenha **múltiplas variações** (faixas de quantidade × preço de venda × custo) cadastradas em uma única ficha. Ao adicionar o produto a um orçamento, o usuário escolhe qual variação usar — sem precisar cadastrar produtos duplicados.

### Diagnóstico atual
- A coluna `products.price_tiers` (JSONB) já existe e armazena `[{ quantity, price, cost }]`.
- O formulário (`ProductForm.tsx`) só cria **uma** entrada — apenas linha única para qtd/preço/custo.
- O editor de orçamento (`OrcamentoEditor.tsx`, linhas 145–167) já lê `price_tiers`, mas só procura um tier que case com `default_quantity`. Não há seleção de variação.

### Mudanças

**1. `src/components/gestao/ProductForm.tsx` — múltiplas variações**
- Substituir os 3 inputs únicos por uma **lista dinâmica** de variações:
  - Cada linha: Quantidade · Preço de Venda · Custo · botão remover.
  - Botão **"+ Adicionar variação"** abaixo da lista.
  - Mínimo 1 variação obrigatória.
- Estado interno: `tiers: PriceTier[]` em vez de strings separadas.
- No submit: `price_tiers` recebe o array; `default_quantity`, `unit_price`, `cost` são preenchidos a partir da **primeira variação** (compatibilidade com listagens legadas).
- Ao editar, hidratar a lista a partir de `initialData.price_tiers` (fallback para a tupla antiga se vazio).
- Validação: cada variação precisa qtd ≥ 1 e preço > 0; quantidades não podem repetir.

**2. `src/pages/Produtos.tsx` — exibir variações**
- Quando houver mais de 1 variação, mostrar resumo:
  `100un · R$ 120,00 | 250un · R$ 270,00 | 500un · R$ 480,00`
- Quando só 1, manter exibição atual.

**3. `src/pages/OrcamentoEditor.tsx` — seleção de variação**
- Em `addProduct(p)`:
  - 1 variação → adiciona direto.
  - 2+ variações → abrir popover/dialog listando cada faixa (ex.: "100un — R$ 120,00"). Ao clicar, item é inserido com `quantity` e `unit_value = price/quantity` da variação escolhida.
- Se o usuário editar manualmente a quantidade do item, **re-procurar** automaticamente um tier compatível e atualizar o `unit_value`.

### Migração de dados
- Nenhuma — `price_tiers` já é JSONB. Produtos antigos seguem funcionando.

---

## Parte 2 — Sincronização em tempo real da Área do Cliente

### Objetivo
Ao mudar o status do pedido no sistema (Kanban / painel interno), a página pública `/pedido/:token` deve atualizar **instantaneamente** — sem o atraso de até 30s do polling atual.

### Diagnóstico atual
- `src/pages/RastreioPedido.tsx` busca via RPC `get_order_by_tracking_token` e usa `setInterval` de 30s como fallback. Não há subscription Realtime.
- Tabela `orders` já está habilitada na publicação `supabase_realtime`.
- Página é acessada **sem autenticação** (chave anônima). RLS atual só permite o dono ver a linha — então `postgres_changes` filtrado por token não chegaria ao anônimo.

### Solução escolhida: Broadcast por trigger
Em vez de afrouxar a RLS, usaremos **canal Broadcast** disparado por trigger no banco. Broadcast não passa por RLS de tabela e só expõe o payload que escolhermos.

### O que será feito

**1. Backend — função + trigger (migração SQL)**
- Criar função `notify_order_status_change()` que usa `realtime.send()` para emitir no tópico `order:<tracking_token>` o payload `{ status, updated_at }`.
- Criar trigger `AFTER UPDATE OF status ON public.orders` chamando a função.
- Conceder `SELECT`/execute necessários para o role `anon` no schema `realtime` apenas para receber broadcasts (sem acesso à tabela).

**2. Frontend — `src/pages/RastreioPedido.tsx`**
- Após o primeiro `fetchData()` bem-sucedido, abrir canal:
  ```ts
  supabase.channel(`order:${token}`)
    .on('broadcast', { event: 'status_change' }, () => fetchData())
    .subscribe();
  ```
- Reduzir `setInterval` de 30s para **60s** como fallback de segurança (caso WebSocket caia).
- Cleanup: `supabase.removeChannel(channel)` + `clearInterval` no return do `useEffect`.

### Resumo técnico Parte 2
- **Frontend:** apenas `src/pages/RastreioPedido.tsx`.
- **Backend:** uma migração com função `notify_order_status_change()` + trigger em `public.orders`.
- **Sem mudanças de RLS** em tabelas.

### Resultado esperado
Ao mover o pedido no Kanban interno, a Área do Cliente reflete o novo status em **menos de 1 segundo**, sem recarregar a página.

---

## Resumo geral de arquivos
- `src/components/gestao/ProductForm.tsx` — lista dinâmica de variações.
- `src/pages/Produtos.tsx` — exibir resumo das variações.
- `src/pages/OrcamentoEditor.tsx` — seletor de variação ao adicionar produto + recálculo automático.
- `src/pages/RastreioPedido.tsx` — subscription broadcast + polling reduzido.
- **Migração SQL** — função `notify_order_status_change()` + trigger `AFTER UPDATE OF status ON orders`.
