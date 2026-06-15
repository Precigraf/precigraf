## Objetivo
No campo "Vida útil" da Depreciação de Equipamento (Calculadora → Custos Operacionais), permitir que o usuário informe o tempo em **meses** ou **anos**.

## Mudanças de UI
Em `EquipmentDepreciationInput.tsx` (e no equivalente usado dentro de `MultiEquipmentInput.tsx`):

- Substituir o input único "Vida útil (anos)" por:
  - Um `Input` numérico para o valor
  - Um `Select` ao lado com as opções **Anos** / **Meses**
- Limites:
  - Anos: 1 a 50
  - Meses: 1 a 600
- Placeholder dinâmico ("5" para anos, "60" para meses)
- Label passa a ser "Vida útil"

## Mudanças de dados / cálculo
Em `OperationalCosts/types.ts`:
- Adicionar campo opcional `usefulLifeUnit: 'years' | 'months'` em `EquipmentDepreciationData` (default `'years'` para retrocompatibilidade).

Em `OperationalCosts/calculations.ts` (`calculateEquipmentCostPerMinute`):
- Converter para meses internamente: `months = unit === 'months' ? usefulLifeYears : usefulLifeYears * 12`.
- Manter o restante da fórmula (custo/mês → custo/minuto) inalterado.
- Não renomear o campo `usefulLifeYears` para evitar quebrar cálculos/histórico salvo; ele passa a representar "quantidade na unidade escolhida".

## Persistência
Nenhuma migration necessária — os dados de operacional são salvos como JSON no histórico de cálculos. Cálculos antigos sem `usefulLifeUnit` continuam funcionando como "anos".

## Escopo fora
- Sem alterações em outras seções da calculadora, no catálogo, ou em backend.
