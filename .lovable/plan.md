## Plano de implementação

### 1. Remover "A Receber" do menu lateral
- `src/components/AppSidebar.tsx`: remover o item `{ title: 'A Receber', url: '/financeiro/receber', icon: Receipt }` do array `navItems`.
- A rota `/financeiro/receber` permanece registrada em `App.tsx` (acessível via link direto), apenas escondida do menu — alinhado a "remover do menu".

### 2. Sincronizar custos no Financeiro ao aprovar via link público
Hoje a função `respond_to_quote_by_token` cria o pedido com `total_cost = 0`, por isso o Financeiro só mostra faturamento/lucro/a receber sem o custo real.

**Migração SQL** — atualizar `respond_to_quote_by_token` para calcular o custo real do pedido a partir dos `items` do orçamento, cruzando com a tabela `products` (mesma lógica do `handleConvertConfirm` no editor):
- Para cada item com `product_id`, buscar `products.cost`, `products.default_quantity` e `products.price_tiers`.
- Procurar tier com `quantity == item.quantity`; se existir usar `tier.cost`, senão usar `(product.cost / default_quantity) * item.quantity`.
- Somar tudo em `v_total_cost` e gravar em `orders.total_cost` ao inserir o pedido.
- Também criar uma linha em `receivables` (única parcela, vencimento hoje + 7 dias) para que apareça em Contas a Receber, espelhando o fluxo manual.

### 3. Status do orçamento em tempo real no editor
Quando o cliente aprova/recusa pelo link, a tela `/orcamentos/:id` aberta pelo dono deve refletir na hora.

- Migração: `ALTER PUBLICATION supabase_realtime ADD TABLE public.quotes;` e `ALTER TABLE public.quotes REPLICA IDENTITY FULL;`.
- `src/pages/OrcamentoEditor.tsx`: adicionar `useEffect` que abre canal `supabase.channel('quote-' + quoteId)` escutando `postgres_changes` em `public.quotes` filtrando por `id=eq.${quoteId}`. No callback, atualizar `status`, invalidar queries `quotes` e `orders` e mostrar toast ("Cliente aprovou o orçamento" / "Cliente solicitou ajustes" / "Cliente recusou").

### 4. Layout da página de aprovação igual ao PDF + tema claro + botão Recusar

**`src/pages/AprovacaoOrcamento.tsx` — reescrever o visual** para espelhar o PDF gerado em `OrcamentoEditor.handleExportPDF`:

```text
┌─────────────────────────────────────────┐
│ [LOGO]  COMPANY NAME (bold)             │
│         endereço · telefone · email     │
├─────────────────────────────────────────┤
│ Orçamento ORC-123          DD/MM/AAAA   │
│ Cliente: Nome  ·  WhatsApp · Email      │
│                                         │
│ ┌─ Itens ──────────────────────────┐    │
│ │ Produto      Qtd   Unit   Total  │    │
│ │ ...                              │    │
│ └──────────────────────────────────┘    │
│                Subtotal   R$ ...        │
│                Desconto  -R$ ...        │
│                Frete     +R$ ...        │
│                TOTAL      R$ ...        │
│ Observações: ...                        │
│ Válido até DD/MM/AAAA                   │
└─────────────────────────────────────────┘
[ Aprovar ] [ Solicitar ajustes ] [ Recusar ]
```

- Forçar tema claro: envolver a página em `<div className="light bg-white text-slate-900 min-h-screen">` e remover dependência do `ThemeProvider` global; usar paleta neutra fixa (slate/white/gray) ao invés de `bg-card/border-border`.
- Tabela de itens estilo PDF (linhas com borda inferior, cabeçalho cinza claro, valores tabulares à direita).
- Cabeçalho do vendedor com logo + nome em destaque + linha cinza separadora, idêntico ao PDF.
- **Novo botão "Recusar orçamento"** (vermelho destrutivo) ao lado de Aprovar/Solicitar ajustes. Comentário opcional, igual ao de ajustes mas obrigatório.

**Backend para Recusar** — atualizar `respond_to_quote_by_token`:
- Aceitar `p_action IN ('approved','changes_requested','rejected')`.
- Para `rejected`: setar `quotes.status = 'rejected'`, criar notificação `quote_rejected` (link `/orcamentos/:id`), **não criar pedido**.

### Detalhes técnicos

- Migrações criadas via tool de migração Supabase (uma única migration cobrindo: nova `respond_to_quote_by_token`, REPLICA IDENTITY FULL e publication realtime para `quotes`).
- A página `/orcamento/:token` continua pública (sem auth) e a RPC `get_quote_by_token` já retorna tudo necessário (logo_url, company_name, items, totais).
- O cálculo de custo na função SQL precisa lidar com `price_tiers jsonb` — usar `jsonb_array_elements` filtrando por `(elem->>'quantity')::int = item_quantity`.
- Toast em tempo real no editor via `sonner` já importado.

### Arquivos a editar
- `src/components/AppSidebar.tsx` (remover item)
- `src/pages/OrcamentoEditor.tsx` (subscription realtime)
- `src/pages/AprovacaoOrcamento.tsx` (reescrever UI claro + Recusar)
- 1 migration SQL nova
