## Objetivo

Ao clicar em **Cadastrar produto** na calculadora:
1. Se já existir um produto vinculado ao **mesmo nome** do usuário, a nova quantidade/preço vira **mais uma variação** (price tier) do produto — sem duplicar.
2. Se o **nome do produto for diferente**, cria um novo produto.
3. Preços gravados e exibidos com **2 casas decimais** (ex.: `55,66`), sem arredondar o cálculo interno.

## Comportamento detalhado

**Regra de vínculo (calc → produto):**

```text
salvar cálculo (novo ou edição)
        │
        ▼
existe produto do usuário com mesmo nome (case-insensitive, trim)?
   ├── SIM → adiciona/atualiza tier {quantity, price, cost} em price_tiers
   │         • se já existe tier com a mesma quantity → substitui preço/custo
   │         • senão → adiciona novo tier e reordena por quantity ASC
   │         • atualiza unit_price/cost/default_quantity com o menor tier
   │         • se o produto ainda não tem calculation_id, vincula ao cálculo atual
   ├── NÃO → cria novo produto (fluxo atual) com o tier inicial
```

**Edição de cálculo existente:**
- Se o nome não mudou → atualiza o tier daquela quantidade no produto vinculado.
- Se o nome mudou → desvincula do produto antigo e aplica a mesma regra acima com o novo nome (achar por nome ou criar novo).

**Arredondamento (apenas apresentação/gravação de preço):**
- `unit_price`, `cost` e cada `price_tiers[i].price / cost` são gravados via `Math.round(v * 100) / 100` (2 casas).
- O cálculo em memória da calculadora **não muda** — só o valor persistido no produto.
- Lista de Produtos (`src/pages/Produtos.tsx`) já usa `formatCurrency` (Intl BRL) → exibição fica `R$ 55,66` automaticamente após a gravação correta.

## Arquivos afetados

- `src/components/SaveCalculationButton.tsx`
  - Nova função `mergeTier(existingTiers, newTier)` que substitui por `quantity` ou adiciona e ordena.
  - Nova função `round2(v)`.
  - `buildProductPayload` passa a arredondar `unit_price`, `cost` e o tier.
  - `handleSave` (após salvar o cálculo):
    1. Busca produto do usuário por `calculation_id` (compatibilidade) **ou** `LOWER(name) = LOWER(nome_do_calc)`.
    2. Se achar: `UPDATE` mesclando o novo tier e recalculando `unit_price/cost/default_quantity` a partir do menor tier; garante `calculation_id` preenchido.
    3. Se não achar: `INSERT` novo produto (com 1 tier).
  - Mensagens de toast atualizadas: "Variação adicionada ao produto" quando faz merge; "Produto cadastrado" quando cria; "Produto atualizado" quando edita tier existente.

Sem migração de banco: o campo `price_tiers` (jsonb) já existe e o `products.calculation_id` também.

## Fora de escopo

- Alterar a lista de Produtos, o formulário de Produto ou a UI da calculadora.
- Sincronizar variações do lado do Produto de volta para a calculadora (fluxo continua unidirecional).
- Migrar produtos antigos já duplicados por nome.
