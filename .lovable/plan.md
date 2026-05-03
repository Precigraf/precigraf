## Goal
Polish HeroMockup, refresh landing stats, redesign the budget PDF, split product cost into Produção/Operacional everywhere, and keep Financeiro fully in sync.

---

## 1. HeroMockup — final polish (`src/components/landing/HeroMockup.tsx`)
- Lower the price `clamp()` upper bound (e.g. `clamp(1.4rem, 7.5cqw, 2.25rem)`) and add `min-w-0` + `pr-1` to the price wrapper so the value never clips even on narrow containers.
- Replace the bottom 2-col grid with `grid grid-cols-2` + `auto-rows-fr` and apply `text-[clamp(0.85rem,5cqw,1.05rem)]` + `truncate-none` so "Margem" and "Lucro" always render full values.
- Increase internal padding to `p-6 sm:p-7`, raise card gap to `gap-5`, and tighten vertical rhythm: `space-y-5` between badge / price / bar / metric grid / live indicator.
- Add `text-balance` to labels and ensure tabular-nums on every number.
- No logic change — single-source-of-truth math stays.

## 2. Landing stats (`src/pages/LandingPage.tsx`)
Update array values to:
```
+100 usuários ativos
234 cálculos feitos
5/5 avaliação média
```

## 3. PDF do Orçamento (`src/pages/OrcamentoEditor.tsx → handleExportPDF`)
Rebuild the layout following the user spec:
1. **Header** — white background, company name bold (primary color), tagline, separator line, contact column (CNPJ, phone, email, address) on the left, logo image on the right.
2. **Identificação** — primary-tinted rounded badge `ORÇAMENTO Nº ###` left; data emissão / validade right.
3. **Cliente** — small "CLIENTE" label + name.
4. **Itens** — autoTable with primary-color header (Descrição / Qtd / Unitário / Total), zebra rows, bottom border.
5. **Totais** — right-aligned Subtotal/Desconto/Frete + filled primary box for Total.
6. **Painéis (lado a lado)** — left "Prazo de entrega" / right "Formas de pagamento". Both pull text from the existing `notes` field by parsing labeled lines (`Prazo de produção:`, `Entrega:`, `Formas de pagamento:`); fall back to "—" when not provided.
7. **Assinaturas** — two underline lines side-by-side: "Assinatura do Responsável" (company name) | "Assinatura do Cliente" (client name).
8. **Footer** — light band centered with contact + thank-you message.

All colors use `profile.system_color`.

## 4. Split product cost into Produção + Operacional
**No DB migration needed** — store both inside the existing `price_tiers` JSONB:
```json
{ "quantity": 100, "price": 192.75, "cost_production": 80, "cost_operational": 35 }
```
Keep legacy `cost` for backward compat: write `cost = cost_production + cost_operational`.

### 4a. ProductForm (`src/components/gestao/ProductForm.tsx`)
- Change tier grid to 4 columns: `Quantidade | Preço de Venda (R$) | Custo de produção | Custo Operacional` + delete button.
- State: replace `cost` with `costProduction` + `costOperational`; total cost = sum.
- Update validation, sort, and submit payload accordingly.

### 4b. useProducts types (`src/hooks/useProducts.ts`)
- Extend `PriceTier` with `cost_production?: number; cost_operational?: number`.
- When loading legacy tiers (only `cost`), default `cost_production = cost`, `cost_operational = 0`.

### 4c. SaveCalculationButton (`src/components/SaveCalculationButton.tsx`)
- Compute `unitCostProd = (paper+ink+varnish+other_material)/qty` and `unitCostOp = (labor+energy+equipment+rent+other_op)/qty`.
- Write `price_tiers: [{ quantity, price, cost_production: unitCostProd, cost_operational: unitCostOp }]` and `cost = unitCostProd + unitCostOp`.

### 4d. Quote → Order conversion (`OrcamentoEditor.handleConvertConfirm`)
- When summing `orderTotalCost`, use `cost_production + cost_operational` from the matching tier (fallback to legacy `cost`).
- Persist breakdown on the order via two new derived fields stored in `orders` — **no schema change**: reuse `total_cost` (sum) and add a JSON-less approach: split is recomputed from linked `quote.items` + `products.price_tiers` in Financeiro (same approach already used). No DB change required.

## 5. Financeiro (`src/pages/Financeiro.tsx`)
- Replace the heuristic operational-ratio block with a deterministic computation:
  - For each order, read its quote items, map to product tiers, sum `cost_production` and `cost_operational` directly.
  - KPIs become exact: Faturamento, Custo de produção, Custos operacionais, Lucro líquido, A receber.
- Variações de preço table: source rows from `products.price_tiers` (Quantidade | Custo de produção | Custo operacional | Preço de venda) — fully aligned with what the user filled in ProductForm/Calculator.

## Files touched
- `src/components/landing/HeroMockup.tsx`
- `src/pages/LandingPage.tsx`
- `src/pages/OrcamentoEditor.tsx` (PDF + cost reading on convert)
- `src/components/gestao/ProductForm.tsx`
- `src/hooks/useProducts.ts`
- `src/components/SaveCalculationButton.tsx`
- `src/pages/Financeiro.tsx`

No DB migration. All changes are backwards-compatible with existing rows.