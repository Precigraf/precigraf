## Boa notícia: a infraestrutura já existe

O fluxo que você descreve **já está implementado** no projeto. Só precisamos te orientar sobre como usar e fazer 2 ajustes pequenos para o fluxo ficar 100% claro.

## Como funciona hoje

```text
1. Estoque (/estoque)
   └─ usuário cadastra: papel, tinta, alça, cola, embalagem...
      (nome, tipo, unidade, quantidade, custo, alerta mínimo)

2. Produto (/gestao → Produtos → Editar)
   └─ seção "Insumos consumidos por unidade"
      ex.: Sacola Kraft → 1 sacola + 0,5g cola + 1 alça

3. Orçamento aprovado pelo cliente (link público)
   └─ trigger respond_to_quote_by_token → consume_supplies_for_order
      └─ para cada item: quantity_per_unit × item.quantity
      └─ registra saída em supply_movements + atualiza supply_stock
      └─ se cruzar min_alert: notificação automática
```

## Passo a passo para o usuário

1. **Cadastrar insumos em `/estoque`** — papel, tinta, embalagem etc. com quantidade inicial, unidade e alerta mínimo.
2. **Editar cada produto em `/gestao`** — usar a seção "Insumos consumidos por unidade" para vincular quanto cada produto consome de cada insumo (por unidade do produto).
3. **Pronto.** Quando o cliente aprovar pelo link público, o estoque desconta sozinho e o histórico aparece em `/estoque → Movimentações`.

## Ajustes que vou fazer

1. **Liberar a seção de insumos também na criação do produto** (hoje só aparece ao editar, porque precisa do `product_id`). Solução: salvar o produto, pegar o id e mostrar a seção em sequência — ou exibir aviso "Salve o produto antes de vincular insumos".
2. **Banner explicativo na página `/estoque`** com 3 passos (cadastrar → vincular ao produto → aprovar orçamento) para o usuário entender o fluxo na primeira visita.
3. **Mostrar resumo de insumos vinculados** no card/listagem de produto (ex.: "3 insumos vinculados") para o usuário saber rapidamente quais produtos já estão configurados.

## Fora de escopo (a confirmar depois, se quiser)

- **Consumo diferente por variação de preço (price tier)** — hoje o consumo é linear (`qty_per_unit × quantidade do pedido`). Se a tiragem de 1000 unidades usa uma chapa de papel diferente da de 100, precisaríamos de uma tabela `product_supplies_by_tier`. Posso implementar se for o caso — me avise.
- Reserva de estoque ao gerar orçamento (hoje só desconta na aprovação).

## Detalhes técnicos

- Tabela `product_supplies` (id, user_id, product_id, supply_id, quantity_per_unit) já criada com RLS owner-only.
- RPC `consume_supplies_for_order(order_id)` já chamada dentro de `respond_to_quote_by_token` quando `action='approved'`.
- View `supply_low_stock` com `security_invoker = true` + trigger `notify_supply_low_stock` ativos.
- Hook `useProductSupplies(productId)` em `src/hooks/useSupplyStock.ts` faz CRUD do vínculo.

Aprove e eu aplico os 3 ajustes acima.