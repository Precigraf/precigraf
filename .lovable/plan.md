

## Analysis: Shopee 2026 CPF/CNPJ Implementation Status

After a thorough review of all relevant files, the implementation is **already complete and functional** in the current codebase. Here is a summary of what exists and one minor refinement to align with your latest specification.

---

### What is Already Implemented (No Changes Needed)

1. **Tier-based pricing** (`src/lib/shopeeUtils.ts`): All 5 tiers with correct commission rates, fixed fees, and Pix subsidies. CPF extra fee of R$ 3,00. Iterative solver that embeds fees into the final price.

2. **CPF/CNPJ selector** (`src/components/MarketplaceSection.tsx`): Dropdown with automatic tax application. Active tier label display. Full fee table shown to user.

3. **Main calculator** (`src/components/CostCalculator.tsx`): Uses `solveShopeeUnitPrice()` to compute final price with embedded Shopee fees. Fixed fees treated as per-order (divided by quantity). Active tier label passed through.

4. **Result panel** (`src/components/ResultPanel.tsx`): Displays final price, unit price, net profit, marketplace fees, and active tier label. MarketplaceImpact component with synchronized `unitNetProfit`.

5. **Quantity simulator** (`src/components/QuantitySimulator.tsx`): Uses same `solveShopeeUnitPrice()` solver. Shows Custos, Taxas Shopee, and Lucro per tier. Displays active tier label per quantity.

---

### One Minor Refinement

In the Quantity Simulator, the label currently says **"Custos:"** but your specification requests **"Preço de material + custos operacionais: R$ X"** (or a more descriptive label). This is a cosmetic label change on line 173 of `QuantitySimulator.tsx`.

**File**: `src/components/QuantitySimulator.tsx`
- Change: `Custos:` to `Mat. + Operacional:` (or similar concise label that fits the layout)

---

### Technical Details

The core pricing formula in the solver works as follows:

```text
unitPrice = (unitBasePrice + fixedFeesPerUnit) / (1 - commissionFraction)

Where:
  unitBasePrice = productionCost + desiredProfit (per unit)
  fixedFeesPerUnit = (tierFixedFee + cpfFee) / quantity
  commissionFraction = tierCommission / 100
```

The solver iterates up to 20 times to handle tier boundary crossings (e.g., when adding fees pushes the price into a higher tier with different rates).

No database, authentication, or backend changes are required.

