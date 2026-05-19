## 1) Calculadora — Taxas, Juros e Impostos

Nova seção **"Taxas e Impostos"** no `CostCalculator.tsx`, abaixo da margem de lucro, com os campos:

- Taxa de cartão (%)
- Juros de parcelamento (%)
- Impostos (%)
- Outras taxas (lista livre: nome + %)

**Fórmula (Adicionar por cima do preço):**
```text
Preço Base   = Custo Total / (1 - Margem%)
Acréscimos%  = Cartão% + Juros% + Impostos% + Σ(Outras%)
Preço Final  = Preço Base × (1 + Acréscimos%)
Lucro Real   = Preço Final - Custo Total - (Preço Final × Acréscimos%)
```

No `ResultPanel.tsx` aparece a quebra: Preço Base, Acréscimos (detalhado), Preço Final e Lucro Real.

Persistência: novos campos em `raw_inputs` (jsonb já existente em `calculations`) — **sem migration**. Carregam de volta ao editar/duplicar.

## 2) Link de Aprovação — Status em PT-BR

Em `src/pages/AprovacaoOrcamento.tsx`, ampliar o `statusBadge` para cobrir os status reais do banco:

- `pending` → "Aguardando resposta"
- `sent` / `enviado` → "Aguardando resposta"
- `draft` → "Rascunho"
- `approved` / `aprovado` → "Aprovado"
- `rejected` / `recusado` → "Recusado"
- `changes_requested` → "Ajustes solicitados"
- `expired` → "Expirado"

Fallback genérico também em PT-BR ("Status indisponível") em vez do valor cru.

## 3) Upload do Logotipo — Acelerar

Em `useCompanyProfile.ts` + `Perfil.tsx`:

- **Preview imediato** via `URL.createObjectURL(file)` — usuário vê a imagem na hora, sem esperar upload.
- **Compressão client-side** antes do upload: redimensionar para máx. 512×512px e converter para WebP (~80% qualidade) usando `<canvas>`. Arquivos típicos caem de 1–5 MB para ~30–80 KB.
- **Upload em background**: não bloqueia a UI; toast de sucesso ao concluir.
- **Cache-busting**: anexar `?v=timestamp` à URL salva para a nova imagem aparecer sem refresh.
- Remover o `await updateProfile.mutateAsync` em série — fazer upload e update do perfil de forma otimizada (single round-trip).

Sem alterações de schema ou storage policies.

## Arquivos afetados

- `src/components/CostCalculator.tsx` (estado + cálculo + persistência)
- `src/components/ResultPanel.tsx` (exibição da quebra)
- `src/components/TaxesFeesInput.tsx` (novo — UI dos campos)
- `src/pages/AprovacaoOrcamento.tsx` (map de status PT-BR)
- `src/hooks/useCompanyProfile.ts` (compressão + upload otimizado)
- `src/pages/Perfil.tsx` (preview otimista com objectURL)

Fora de escopo: alterar a fórmula base do custo/margem, mudar storage bucket, novos campos no banco.