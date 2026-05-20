# Mostrar descrição (especificações) dos itens no orçamento

Adicionar uma descrição opcional por item do orçamento, exibida no link de aprovação do cliente e nas exportações (PDF e WhatsApp).

## Mudanças

### 1) Editor de Orçamento (`src/pages/OrcamentoEditor.tsx`)
- Adicionar campo `description?: string` na interface `QuoteItem`.
- Ao inserir um produto do catálogo (`insertProductWithTier`), preencher automaticamente `description` com `product.description` (quando existir).
- Adicionar uma `Textarea` compacta (rows=2) abaixo de cada linha de item, rotulada "Especificações / Descrição (opcional)", editável.
- Persistência: nenhum schema novo — o campo já vai dentro do JSONB `quotes.items`.

### 2) Link público de aprovação (`src/pages/AprovacaoOrcamento.tsx`)
- Atualizar o tipo `QuoteData.items` para incluir `description?: string`.
- Renderizar a descrição em texto menor, cinza, abaixo do nome do item (somente quando preenchida), preservando quebras de linha (`whitespace-pre-wrap`).

### 3) Exportações (`src/pages/OrcamentoEditor.tsx`)
- Mensagem WhatsApp: incluir descrição em linha indentada após cada item, quando presente.
- PDF (`tableBody`): adicionar a descrição em itálico/cinza abaixo do nome do produto na mesma célula.

## Fora de escopo
- Nenhuma alteração no banco (campo cabe no JSONB existente).
- Sem alterar a função RPC `get_quote_by_token` — ela já devolve o array `items` íntegro.
