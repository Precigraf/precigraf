## Ajustes na página Pedidos

### 1. KPIs (substituir os 4 cards atuais)

**Arquivo:** `src/pages/Pedidos.tsx`

Nova ordem e conteúdo dos cards (da esquerda para a direita):

| KPI | Cálculo | Ícone | Cor |
|---|---|---|---|
| **Faturamento** | soma de `total_revenue` dos pedidos filtrados | `DollarSign` | emerald |
| **Total** | quantidade de pedidos filtrados | `Package` | blue |
| **Em andamento** | pedidos com status ≠ `delivered` | `Clock` | orange |
| **Aprovados** | pedidos com status = `approved` | `CheckCircle2` | green |

> Substitui o card "Entregues" por "Aprovados". A ordem segue exatamente a lista pedida pelo usuário.

---

### 2. Lista de pedidos (simplificar cada linha)

**Arquivo:** `src/pages/Pedidos.tsx`

Hoje cada `Card` tem: nº + badge status, cliente + whatsapp inline, produto, valor, **seletor de status**, botões visualizar/excluir.

Nova estrutura (da esquerda para a direita):

1. **Dados do cliente**: nº do pedido (PED-N) em pequeno + nome do cliente em destaque + telefone WhatsApp abaixo + data de criação.
2. **Botão WhatsApp** ao lado dos dados (ícone verde, abre `wa.me/55…`).
3. **Valor** (`total_revenue`) à direita; se houver `amount_pending > 0`, manter linha pequena "A receber".
4. **Status** como `Badge` (não mais seletor inline) — a alteração de status passa a ser feita **somente dentro do modal de visualização**.
5. **Botão Visualizar** (ícone `Eye`) — abre o `OrderDetailsModal` redesenhado.
6. **Botão Excluir** (ícone `Trash2`) com `AlertDialog` de confirmação (mantido).

Remover da linha:
- Coluna "produto" (`o.quotes?.product_name`).
- Seletor de status inline (`<Select>` com `KANBAN_COLUMNS`).

A busca textual continua filtrando por nome, número e produto (mesmo o produto não aparecendo).

---

### 3. Modal "Visualizar" estilo Orçamento

**Arquivo:** `src/components/gestao/OrderDetailsModal.tsx` (reescrita)

Replicar o layout visual de `src/pages/OrcamentoEditor.tsx` dentro do dialog:

**Cabeçalho do dialog**
- Título: `Pedido PED-{order_number}` + `Badge` do status atual.

**Bloco Cliente** (card com borda, igual ao editor de orçamento)
- Nome, WhatsApp (com botão para abrir conversa), e-mail e endereço completo (puxado de `order.clients`).

**Bloco Status**
- `Select` com `KANBAN_COLUMNS` (Aprovado, Criando arte, Aguardando aprovação, Em produção, Em transporte, Entregue) → dispara `updateOrderStatus.mutate(...)` ao trocar.

**Bloco Itens** (tabela igual ao orçamento)
- Cabeçalho: Produto | Qtd | Valor unit. | Subtotal.
- Linhas vindas de `order.quotes.items` (JSONB já carregado pelo hook).
- Caso vazio: mensagem "Nenhum item registrado".

**Bloco Resumo financeiro** (igual ao orçamento)
- Subtotal (soma dos itens).
- Desconto (`order.quotes.discount_value` / `discount_type`) — exibir como linha negativa quando existir.
- Frete (`order.quotes.shipping_value`) — exibir quando > 0.
- **Total** em destaque (usa `order.total_revenue`, que já reflete itens adicionados depois).
- Linha "A receber" em amarelo se `amount_pending > 0`.

**Bloco Adicionar novo item** (mantém lógica atual de confirmação)
- Select de produto + qtd + valor unit. + botão `+`.
- Confirmação inline mostrando "Adicionar X · Novo total Y" antes de chamar `addItemToOrder.mutate`.
- Após sucesso, o `total_revenue` recalculado já aparece no bloco Resumo.

**Sem mudanças em** `useOrders.ts` (todos os dados necessários já vêm via `order.quotes.*` e `order.clients.*`).

---

### Arquivos afetados

| Arquivo | Mudança |
|---|---|
| `src/pages/Pedidos.tsx` | Trocar KPIs (Faturamento/Total/Em andamento/Aprovados) e simplificar linhas (remover produto e seletor inline, manter badge + ações) |
| `src/components/gestao/OrderDetailsModal.tsx` | Reescrita visual para espelhar o layout de orçamento (cliente, itens em tabela, subtotal/desconto/frete/total, status, adicionar item) |

Sem migração de banco. Sem mudanças em rotas, sidebar ou outros módulos.