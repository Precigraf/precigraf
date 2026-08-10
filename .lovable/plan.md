# Terceirização no painel de Resultado

Adicionar um card de "Terceirização" logo abaixo de "Custo Produção", no mesmo estilo dos demais cards do resumo.

## Comportamento
- Valor grande à direita: total da terceirização (valor por unidade x quantidade do lote).
- Linha menor abaixo: valor por unidade, no formato `R$ 0,00/un`.
- O card aparece sempre que houver quantidade informada; quando não há serviços cadastrados, mostra R$ 0,00 (mesmo comportamento visual de Custo Produção).

## Detalhes técnicos
- `src/components/ResultPanel.tsx`: novo bloco entre o card "Custo Produção" (linhas 177-192) e o card "Lucro", usando `outsourcingCost` (total) e a nova prop `unitOutsourcingCost` já disponível no componente.
- Nenhuma alteração na fórmula de cálculo: terceirização continua como repasse puro, sem margem.
- A linha existente de "Terceirização" no detalhamento dos custos permanece inalterada.
