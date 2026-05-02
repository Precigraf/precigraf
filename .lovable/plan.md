## Plan

Five independent changes across landing, calculator, products, quotes PDF and financial dashboard.

---

### 1. Smart Suggestion card — fix overflow & responsiveness (`src/components/landing/HeroMockup.tsx`)

Rebuild the right-side result card so nothing clips at any width:

- Root card: `min-w-0`, `w-full`, remove `whitespace-nowrap` on price; rely on fluid scaling instead.
- Use `clamp()` driven by container queries (Tailwind `@container`) so font-size adapts to the card width, not viewport. Add `@container` to the card and `text-[clamp(1.5rem,9cqw,2.5rem)]` for the price.
- Replace `truncate` on Margem/Lucro values with fluid sizing `text-[clamp(0.95rem,4.5cqw,1.15rem)]` + `tabular-nums` + `leading-none`. No `truncate` (it was hiding content).
- Lower bottom-card grid to `grid-cols-2 gap-2.5`, internal padding `p-3` with consistent vertical rhythm; add a subtle icon-row + value-row layout that keeps icons small (`w-4 h-4`) so values get more space.
- Standardize spacing rhythm: `space-y-5` between sections (badge → price block → bar → bottom cards → live indicator).
- Increase card padding to `p-5 sm:p-6`, `rounded-2xl`, soften shadow with `shadow-[0_10px_40px_-12px_hsl(var(--foreground)/0.25)]`.
- Ensure both lower cards use `flex flex-col justify-between` and identical heights via `items-stretch`.
- Add `min-h-[360px]` only on `lg:` so mobile shrinks naturally.

Result: price and both metric values render in full from 320px upward.

---

### 2. Landing copy & stats (`src/pages/LandingPage.tsx`)

- Stats grid: replace items with `+189 usuários ativos`, `1753 cálculos feitos`, `5/5 avaliação média`, keep `99.9% disponibilidade`.
- Remove the `Feito para gráficas brasileiras` Badge above the H1 in the hero.

---

### 3. Quote PDF redesign (`src/pages/OrcamentoEditor.tsx` → `handleExportPDF`)

Rebuild the function to match the requested A4 layout. Primary color comes from `profile.system_color` (fallback `#6366f1`), parsed once into RGB.

Sections, top-to-bottom:

1. **Header band** (filled rectangle, primary color, ~38mm tall): company name (bold, white, 20pt), tagline line under name (white 70% opacity), thin white separator line, contact row (CNPJ • phone • email, 9pt). Logo aligned to the right inside the header (max 24mm box, white background rounded chip if logo has transparency).
2. **Quote ID strip**: pill badge `ORÇAMENTO Nº ORC-XXXX` left, `Emissão dd/mm/aaaa` and `Válido até dd/mm/aaaa` right, both 9pt muted.
3. **Client box**: light grey `#F4F4F6` rounded rectangle, label `CLIENTE` (8pt uppercase, primary color), client name 12pt bold below.
4. **Items table** via `autoTable`: head fill = primary color, white text; columns `Descrição do Produto | Qtd | Unitário | Total`; `alternateRowStyles.fillColor = [248,248,250]`; bottom border line after table.
5. **Totals block** right-aligned: Subtotal, Desconto (only if >0), Frete (only if >0). Then a filled rounded box with primary color background containing `TOTAL` label + value (bold, white, 14pt).
6. **Two info panels side-by-side** (each 50% width, light grey bg, rounded): left = `PRAZO DE ENTREGA` with sub-lines `Produção: X dias úteis` and `Envio: Y dias úteis` (pulled from `notes` parsed fields or sensible defaults if absent — show placeholders only if data missing); right = `FORMAS DE PAGAMENTO` listing `PIX`, `Cartão`, `Boleto` (+ pix key if `profile.pix_key`).
7. **Signature lines**: two horizontal rules side-by-side near bottom; left labelled `Assinatura do Responsável` with company name below, right labelled `Assinatura do Cliente` with client name below.
8. **Footer band**: filled rectangle (primary color) at page bottom, centered contact info + `Obrigado pela preferência!` (white 9pt).

Pagination: if items table overflows, autoTable handles it; re-draw header/footer bands using `didDrawPage` hook.

Helpers added inside the function:

- `hexToRgb(hex)` for primary color.
- `drawBand(y, height, rgb)` for header/footer rectangles.
- `drawPanel(x, y, w, h, title, lines)` for side panels.

The two info-panel data points (delivery time, payment methods) get optional state fields persisted later if needed; for now they read from existing `notes` (no schema change) and fall back to defaults.

---

### 4. Calculator → product creation + category link

Goal: when saving a calculation, also create/update a Product entry tied to a category.

**Schema migration** (new file): no new tables. Add nullable `category_id uuid` and nullable `product_id uuid` columns to `public.calculations`. No FK constraint added (matches project convention; integrity handled in app).

**`src/components/CostCalculator.tsx`**:
- Add a `categoryId` state and a `<Select>` (using existing `useCategories` hook) rendered next to the product name input.
- Pass `categoryId` into the `saveData` payload of `<ResultPanel>`.

**`src/components/ResultPanel.tsx`**:
- Extend `saveData` interface with `categoryId?: string | null`.
- Forward to `<SaveCalculationButton>`.

**`src/components/SaveCalculationButton.tsx`**:
- Extend `CalculationData` with `categoryId?: string | null`.
- After successfully inserting/updating the calculation, call `useProducts().createProduct` (or update if a `product_id` already exists on this calculation) with:
  - `name = data.productName`
  - `category_id = data.categoryId ?? null`
  - `cost = data.productionCost / data.quantity`
  - `unit_price = data.unitPrice`
  - `default_quantity = data.quantity`
  - `price_tiers = [{ quantity, cost, price: unitPrice }]`
  - `is_active = true`
- Persist returned `product_id` back onto the calculation row.
- Toast: `Cálculo salvo e produto cadastrado`.

Edge case: editing an existing calculation updates the linked product instead of creating a duplicate.

---

### 5. Financeiro — new KPIs and price-variation table (`src/pages/Financeiro.tsx`)

KPIs (5 cards in `grid-cols-2 lg:grid-cols-5`):

- **Faturamento** = Σ `total_revenue`
- **Custo de produção** = Σ `total_cost` (kept as-is)
- **Custos operacionais** = Σ operational portion derived from each order's underlying calculation/product. Resolved by joining `quotes.calculation_id → calculations` and summing `labor_cost + energy_cost + equipment_cost + rent_cost + other_operational_cost` × order share. Fetched via a new memo that reads calculations via existing supabase client.
- **Lucro líquido** = Faturamento − (Custo de produção + Custos operacionais)
- **A receber** = Σ `amount_pending`

**Price variation table** (replaces current orders table at the bottom):

Columns: `Quantidade | Custo de produção | Custo operacional | Preço de venda`.

Source: query `calculations` for the current user (already RLS-scoped), one row per calculation, and additionally include each tier from any linked product's `price_tiers`. Numbers feed the same formulas above so KPIs and table stay in sync (memoized from one fetch).

Add a small `useMemo` data layer that:
1. Loads orders (existing).
2. Loads calculations linked to those orders' quotes for cost breakdown.
3. Produces both KPI sums and the variation rows.

No edge function needed.

---

### Technical notes

- New migration: `ALTER TABLE public.calculations ADD COLUMN category_id uuid, ADD COLUMN product_id uuid;`
- Files touched: `HeroMockup.tsx`, `LandingPage.tsx`, `OrcamentoEditor.tsx`, `CostCalculator.tsx`, `ResultPanel.tsx`, `SaveCalculationButton.tsx`, `Financeiro.tsx`, plus one SQL migration.
- No new dependencies; reuses `jspdf`, `jspdf-autotable`, `useCategories`, `useProducts`, `useOrders`.
- Tailwind container queries: enabled by default in v3.4 via `@tailwindcss/container-queries`. If plugin missing, fall back to viewport-based `clamp()` using `cqw` replaced with `vw` capped through wrapper.
