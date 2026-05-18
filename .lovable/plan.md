## Objetivo

Voltar a página `/orcamento/:token` (`src/pages/AprovacaoOrcamento.tsx`) para um layout em **cards** no mesmo padrão visual da página de Rastreio do Pedido (`src/pages/RastreioPedido.tsx`), e ajustar a cor do botão **Solicitar ajustes** para amarelo com fonte branca.

## Mudanças

### 1. `src/pages/AprovacaoOrcamento.tsx` — refatorar layout

Substituir o atual "documento estilo PDF" por uma estrutura em cards, mantendo:
- Tema claro forçado (já existente)
- Mesmos dados (vendedor, cliente, itens, totais, observações, validade)
- Mesma lógica de resposta (`respond_to_quote_by_token`) e estados (`loading`, `done`, `already_responded`)
- 3 botões: Aprovar / Solicitar ajustes / Recusar

Nova estrutura visual (semelhante a `RastreioPedido.tsx`):

```text
┌─ Header centralizado ─────────────────┐
│  Logo + Nome da empresa               │
│  "Orçamento ORC-123"                  │
└───────────────────────────────────────┘

┌─ Card: Dados do Cliente ──────────────┐
│  Nome, contato, data, validade,       │
│  badge de status                      │
└───────────────────────────────────────┘

┌─ Card: Itens do Orçamento ────────────┐
│  Lista divide-y (igual Rastreio):     │
│  Nome  ........... Qtd × Unit = Total │
└───────────────────────────────────────┘

┌─ Card: Resumo Financeiro ─────────────┐
│  Subtotal / Desconto / Frete / TOTAL  │
└───────────────────────────────────────┘

┌─ Card: Observações (se houver) ───────┐
└───────────────────────────────────────┘

┌─ Card: Sua resposta ──────────────────┐
│  [ Textarea comentário ]              │
│  [Aprovar] [Solicitar ajustes] [Recusar]│
└───────────────────────────────────────┘
```

- Container: `max-w-3xl mx-auto px-4 py-8 md:py-12`
- Cada bloco usa `<Card className="p-5 md:p-6 bg-white border-gray-200 shadow-sm">` (forçando claro, já que o componente Card respeita tema)
- Espaçamento `space-y-5` entre cards
- Mantém o tratamento de `done` e `already_responded` em um card final

### 2. Botão "Solicitar ajustes" — cor amarela com fonte branca

Trocar:
```tsx
className="border-gray-300 text-gray-900 hover:bg-gray-50"
```
Por:
```tsx
className="bg-yellow-500 hover:bg-yellow-600 text-white border-0"
```
(removendo `variant="outline"`)

## Arquivos afetados

- `src/pages/AprovacaoOrcamento.tsx` (refatoração visual completa, mesma lógica)

## Fora do escopo

- Não altera RPC, banco, rotas, ou comportamento de aprovação.
- Não altera tema global nem outros componentes.