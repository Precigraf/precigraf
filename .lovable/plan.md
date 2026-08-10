# Custo de Terceirização na Calculadora

## O que será criado

Uma nova seção **Terceirização** na calculadora, para lançar serviços que você contrata de terceiros (laminação, corte especial, bordado, plotagem, acabamento, etc.).

Regras confirmadas:
- Cobrança **por unidade** — você informa o valor unitário e o sistema multiplica pela quantidade do lote.
- **Repasse puro** — o custo do terceiro não recebe sua margem de lucro. Você repassa exatamente o que paga.

## Como vai funcionar na tela

Bloco com lista de itens (mesmo padrão visual de "Outros Insumos"), cada item com:

| Campo | Exemplo |
|---|---|
| Nome do serviço | Laminação fosca |
| Fornecedor (opcional) | Gráfica Silva |
| Valor por unidade | R$ 0,80 |
| Qtd. por produto | 1 |

Cada linha mostra o custo unitário e o custo total daquele serviço no lote. No rodapé do bloco, o total de terceirização.

Limite de 10 itens, igual aos outros blocos.

## Impacto no cálculo

A terceirização entra **fora** do bloco que recebe margem:

```text
Custo de produção      = matéria-prima + operacional        (recebe margem)
Lucro desejado         = custo de produção x margem %
Preço base             = custo de produção + lucro
Terceirização          = valor unitário x qtd por produto   (SEM margem)
Preço antes de taxas   = preço base + terceirização
Preço final            = preço antes de taxas x (1 + taxas %)
```

Detalhe importante: a terceirização **entra na base de taxas/impostos**. Se você paga 3,5% de maquininha, esse percentual incide sobre o total cobrado — incluir a terceirização na base garante que você receba líquido exatamente o valor que precisa pagar ao terceiro. Sem isso, a taxa sairia do seu bolso.

O **lucro líquido** não muda com a terceirização: ela entra como custo e sai como receita na mesma proporção.

## Onde aparece

- **Painel de resultado / Detalhamento de preço**: nova linha "Terceirização (repasse)" separada dos custos com margem, deixando claro que é repasse.
- **Gráfico de custos**: nova fatia "Terceirização".
- **Simulador de quantidades (Pro)**: recalcula corretamente, já que é linear por unidade.
- **PDF do orçamento**: incluído no valor do produto (sem linha separada, para não expor seu fornecedor ao cliente).

## Persistência e edição

- Os itens são salvos em `raw_inputs.outsourcingItems` no histórico de cálculos — mesmo mecanismo já usado por "Outros Insumos" e "Material por rolo".
- Ao editar um cálculo salvo, os itens de terceirização voltam preenchidos.
- Para compatibilidade com o banco atual, o total de terceirização é somado ao campo `other_material_cost` da tabela `calculations` (que já agrega embalagem, outros insumos e rolo). Nenhuma migração de banco é necessária.
- Ao clicar em "Cadastrar produto", o custo de terceirização já está embutido no custo total e no preço, então os tiers de preço saem corretos.

## Detalhes técnicos

- Novo componente `src/components/OutsourcingInput.tsx`, exportando o tipo `OutsourcingItem` e o helper `calculateOutsourcingItemCost(item)` — mesmo padrão de `OtherMaterialsInput.tsx`.
- Em `src/components/CostCalculator.tsx`:
  - novo estado `outsourcingItems`;
  - `outsourcingTotalCost` via `useMemo`;
  - dentro de `calculations`, `unitBaseSellingPrice` passa a somar `unitOutsourcingCost` antes de aplicar `feesMultiplier`, mas **depois** de calcular `unitDesiredProfit` (que continua baseado só em `unitProductionCost`);
  - `netProfit` recalculado descontando a terceirização, para não inflar o lucro;
  - inclusão em `raw_inputs` no bloco de salvamento e no bloco de restauração de edição;
  - soma ao `saveDataValues.otherMaterials`.
- `PriceBreakdown.tsx` e `CostChart.tsx` recebem a nova parcela como prop.
- Cálculo sem arredondamento intermediário, seguindo a regra de precisão exata já adotada no projeto.

## Ordem de implementação

1. Criar `OutsourcingInput.tsx` com o helper de cálculo.
2. Integrar estado e fórmula no `CostCalculator.tsx`.
3. Exibir no `PriceBreakdown` e `CostChart`.
4. Persistir e restaurar em `raw_inputs`.
5. Validar com um caso real: 100 un., laminação R$ 0,80/un., conferir que o lucro líquido não subiu.
