
## Plan: System-Wide Bug Fix and Consistency Audit

### Issues Found

**1. Dead code: `useCalculator.ts` is never imported**
- The hook `src/hooks/useCalculator.ts` duplicates all calculation logic from `CostCalculator.tsx` but is never used anywhere. It should be deleted to avoid confusion.

**2. `CostCalculator.tsx` still uses `roundCurrency` despite user requesting exact values**
- Lines 46-48 define `roundCurrency` and it's used ~20 times throughout the component (lines 62, 314, 329, 368-425). The user explicitly asked for no rounding, but this file was not updated.
- Fix: Remove `roundCurrency` and use raw values, matching the approach in the (now-dead) `useCalculator.ts`.

**3. `MarketplaceSection.tsx` - Shopee solver uses `baseCost` to find tier but should use estimated `finalPrice`**
- `getShopeeTier(baseCost)` at line 66 uses the base cost to find the tier, but the tier should be determined by the *final selling price* (after fees are added). The test code the user provided uses `estimatedPrice = (productCost + freight) * (1 + profitMargin / 100)` to estimate the price first.
- Currently `baseCost` (production cost + profit) is passed, which may land in a lower tier than the actual final price. This could cause incorrect fee calculations when the final price crosses a tier boundary.
- Fix: Use an iterative approach - calculate finalPrice, check if it falls in the same tier, recalculate if needed.

**4. `MarketplaceImpact.tsx` - calls `calcShopeeCost(unitPrice)` with wrong semantics**
- Line 44: `calcShopeeCost(unitPrice, shopeeAccountType)` passes `unitPrice` (which already includes fees) as `baseCost` to the solver. This double-counts fees, producing incorrect impact percentages.
- Fix: The impact component should use the fees already calculated by the parent, not re-run the solver with the final price.

**5. `QuantitySimulator.tsx` - still rounds values with `Math.round(...*100)/100`**
- Lines 76-84 round all calculated values despite the no-rounding requirement.

**6. `RawMaterialInput.tsx` and `OtherMaterialsInput.tsx` - display values rounded but this is cosmetic only (OK)**
- These components round for display via `formatCurrency` which is fine.

**7. `ResultPanel.tsx` - rounds values for display (lines 99, 110-113)**
- These are display-only rounding which is acceptable, but `unitProductionCost` and `unitProfit` at lines 110-111 are used as props for `MarketplaceImpact` (line 294), feeding rounded values into further calculations.

**8. Incomplete save data mapping**
- `SaveCalculationButton` saves `productionCost`, `desiredProfit`, `finalSellingPrice`, `unitPrice` to `total_cost`, `profit`, `sale_price`, `unit_price` respectively. This mapping looks correct.
- However, `lot_cost` column defaults to 0 and is never set (it's not in the insert). This is fine since default is 0.

**9. `MarketplaceSection.tsx` line 142-143: displays `unitPrice` as "Preço base" but unitPrice already includes marketplace fees**
- The solver takes `unitBase` (cost + profit) as input. But `MarketplaceSection` receives `unitPrice` (which is unitBase + fees) and passes it to `calcShopeeCost`. This means it re-solves with an inflated price, showing wrong tiers and fees.
- This is the same root cause as issue #4 - the component should receive `unitBase` (base price before fees) not `unitPrice` (final price with fees).

### Implementation Steps

**Step 1: Delete dead `useCalculator.ts`**

**Step 2: Fix `CostCalculator.tsx` - remove all `roundCurrency` calls**
- Replace `roundCurrency(x)` with just `x` throughout the calculations useMemo block.
- Keep `safeNumber` for safety checks.

**Step 3: Fix Shopee price prop - pass base price, not final price**
- In `CostCalculator.tsx`, pass a new prop `unitBasePrice` (= unitBaseSellingPrice) to `MarketplaceSection` instead of `unitPrice`.
- Update `MarketplaceSection` to use this base price for the solver display.
- This fixes the double-counting issue where fees were calculated on a price that already included fees.

**Step 4: Fix `MarketplaceImpact.tsx` - use pre-calculated fees instead of re-running solver**
- Remove the `calcShopeeCost` call. Use `marketplaceTotalFees / quantity` for unit fees.

**Step 5: Fix `QuantitySimulator.tsx` - remove rounding**
- Remove `Math.round(...*100)/100` wrappers from calculation results.

**Step 6: Fix Shopee solver tier detection**
- Update `calcShopeeCost` to verify the final price falls in the same tier as the base cost. If not, recalculate with the correct tier (iterative approach, max 2 iterations).

### Technical Details

The core Shopee formula is: `finalPrice = (baseCost + fixedFee) / (1 - commissionRate)`

The tier is determined by `finalPrice`, not `baseCost`. Currently the code finds the tier using `baseCost`, which can be wrong when baseCost is near a tier boundary (e.g., baseCost = R$75 gives tier "Até R$79.99" with 20% commission, but finalPrice = (75+4)/0.80 = R$98.75 which should be in "R$80-R$99.99" tier with 14%+R$16).

Fix: Calculate finalPrice, check tier, recalculate if tier changed.

Files to modify:
- Delete `src/hooks/useCalculator.ts`
- `src/components/CostCalculator.tsx` - remove rounding, fix Shopee prop
- `src/components/MarketplaceSection.tsx` - accept base price prop, fix solver iteration
- `src/components/MarketplaceImpact.tsx` - remove redundant solver call
- `src/components/QuantitySimulator.tsx` - remove rounding
