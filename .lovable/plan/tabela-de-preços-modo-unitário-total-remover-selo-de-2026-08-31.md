# Tabela de preços: modo unitário/total + remover selo de %

## Objetivo
1. Deixar clara e funcional a escolha entre **preço por unidade** e **preço total (cheio)** na tabela de preços do Construtor de Catálogo.
2. Remover o **selo de % de desconto**, mantendo os preços promocionais (antigo riscado + oferta).

## Mudanças

### 1. Modo de valores (unitário OU total) — editor
Arquivo: `src/components/catalogos/sections/PricingSection.tsx`
- O seletor já existe; será promovido para **acima das linhas de preço** e renomeado para ficar evidente:
  - "Preço por unidade" → exibe "/un." no catálogo (interruptor existente mantido).
  - "Preço total (pacote)" → exibe apenas o valor, sem "/un.".
- O placeholder da coluna de preço muda conforme o modo ("Valor un." vs "Valor total").

### 2. Template clássico reflete o modo
Arquivo: `src/components/catalogos/templates/ClassicCatalog.tsx`
- Modo `unit`: comportamento atual ("/un." quando habilitado).
- Modo `total`: garantir que nenhum sufixo "/un." apareça (inclusive na linha promocional) — já é o comportamento; será validado.

### 3. Remover o selo de % de desconto
- `ClassicCatalog.tsx`: remover o cálculo `off` e o badge `-{off}%`; manter preço antigo riscado + preço promocional em destaque.
- `PricingSection.tsx`: remover o indicador `-%` ao lado do campo promocional; ajustar o texto do interruptor para "Mostra o preço atual riscado e o valor da oferta.".

## Detalhes técnicos
- Nenhuma mudança de schema/tipos: `pricing.type` ('unit' | 'total'), `showUnitLabel`, `showDiscount` e `promoPrice` já existem em `src/lib/catalogBuilder/types.ts`.
- Autosave, preview e exportação (PNG/JPG/PDF) passam a refletir as mudanças automaticamente por usarem o mesmo template.
