## Objetivo

Substituir o botão **"Salvar cálculo"** da calculadora por **"Cadastrar produto"**. Ao clicar, o sistema salva o cálculo no histórico (como hoje) **e** cria um produto vinculado em `products`. Editar o cálculo depois atualiza automaticamente o produto correspondente, mantendo preço de venda e custo sincronizados.

## Comportamento

1. **Calculadora → botão único "Cadastrar produto"**
   - Valida nome, quantidade e preço final (como hoje).
   - Salva o registro em `calculations` (histórico completo mantido).
   - Cria em `products` um novo produto vinculado com:
     - `name` = nome do produto do cálculo
     - `unit_price` = `unitPrice` (preço unitário de venda)
     - `cost` = `productionCost / quantity` (custo unitário)
     - `default_quantity` = quantidade do lote
     - `price_tiers` = `[{ quantity, price: finalSellingPrice, cost: productionCost }]`
     - `is_active` = true
     - `calculation_id` = id do cálculo recém-criado (vínculo)
   - Toast: "Produto cadastrado a partir do cálculo".
   - Botão fica desabilitado enquanto salva; ao concluir mostra "Cadastrado!".

2. **Edição do histórico sincroniza o produto**
   - Ao atualizar um cálculo já vinculado (mode `edit` no `SaveCalculationButton` / `EditCalculationModal`), depois do `UPDATE` em `calculations`, executa `UPDATE` em `products` onde `calculation_id = calc.id` com os novos `unit_price`, `cost`, `default_quantity`, `price_tiers` e, se o usuário mudou, `name`.
   - Se o produto vinculado tiver sido excluído manualmente, o update simplesmente não afeta linhas — nenhum erro.

3. **Duplicação de cálculo**
   - Duplicar não recria o produto (evita duplicidade). O cálculo duplicado nasce sem `product_id`; o usuário pode salvá-lo, e nesse fluxo um novo produto é criado.

4. **Regras de negócio preservadas**
   - Limites de plano (`canSaveCalculation`, trial) continuam bloqueando cadastros novos.
   - Toda a página **Produtos** continua funcionando: o produto criado aparece na lista com miniatura padrão (sem imagem inicialmente) e pode ser editado manualmente. Edições manuais no produto **não** voltam para o cálculo (fluxo unidirecional cálculo → produto), evitando loop de sincronização.

## Detalhes técnicos

**Migração (schema):**
- Adicionar `products.calculation_id UUID NULL` com `REFERENCES calculations(id) ON DELETE SET NULL` e índice único parcial `(calculation_id) WHERE calculation_id IS NOT NULL` para garantir 1:1.
- `products.image_url`/`image_path` permanecem opcionais (produto nasce sem imagem, usuário adiciona depois em Produtos).

**Arquivos a editar:**
- `src/components/SaveCalculationButton.tsx`
  - Renomear label para "Cadastrar produto" / "Atualizar produto" (quando `isEditing`).
  - Após `insert` em `calculations`, chamar `products.insert` com os campos derivados e `calculation_id`.
  - Após `update` em `calculations`, chamar `products.update ... where calculation_id = id`.
  - Invalidar cache `['products']` via `queryClient` (import `useQueryClient`).
  - Mensagens de toast ajustadas.
- `src/components/ResultPanel.tsx`
  - Nenhuma mudança de props; o botão renderizado ganha novo texto automaticamente.
- `src/components/EditCalculationModal.tsx` (verificar): garantir que ao editar um cálculo pela tela de histórico, o mesmo caminho de update no `products` seja acionado — se o modal usa `SaveCalculationButton`, herda automaticamente; se faz update direto, adicionar a mesma sincronização.
- `src/hooks/useProducts.ts`: sem mudança obrigatória (já expõe `products` via TanStack). Apenas garantir que `useProducts` invalida ao alterar via SQL externo — usaremos `queryClient.invalidateQueries(['products'])` no botão.

**Prevenção de erros de sincronização:**
- Vínculo unidirecional (cálculo é a fonte de verdade para produtos criados pela calculadora).
- `ON DELETE SET NULL` no FK: apagar o cálculo não quebra o produto; apagar o produto não quebra o cálculo.
- Índice único garante que um cálculo nunca gere dois produtos.
- Se o `insert` em `products` falhar (ex.: RLS), o cálculo permanece salvo e o toast alerta "Cálculo salvo, mas não foi possível cadastrar o produto" — o usuário pode tentar novamente pelo botão "Cadastrar produto" (idempotente: reusar `calculation_id` via upsert em turnos futuros, fora deste escopo).

## Não incluso (fora do escopo)

- Sincronização reversa (editar produto atualiza cálculo).
- Migrar cálculos antigos já salvos para virar produtos automaticamente (usuário faz manualmente reabrindo/editando).
- Imagem do produto na calculadora — segue sendo adicionada em Produtos.
