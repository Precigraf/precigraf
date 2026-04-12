

## Plan: Fix Edit/Duplicate Loading — Store Raw Material Input Data

### Problem
When editing or duplicating a saved calculation, the material input fields show only the **computed cost** (e.g., R$ 0,25) instead of the **original values** the user entered (e.g., package value R$ 25,00, qty in package 100, qty used 1). This happens because the database only stores the final calculated cost per material, not the raw input fields (package value, package quantity, quantity used).

### Solution
Store the raw material input data as a JSON column in the `calculations` table so it can be fully restored on edit/duplicate.

### Steps

**Step 1: Database migration — add `raw_inputs` JSON column**
- Add a nullable `jsonb` column `raw_inputs` to `calculations` table
- This stores the complete state: `paperData`, `handleData`, `inkData`, `packagingData`, `otherMaterialsItems`, and `operationalCostsData`

**Step 2: Update `SaveCalculationButton` to save raw inputs**
- Accept a new `rawInputs` prop containing all raw material data
- Include `raw_inputs` in the insert/update payload

**Step 3: Update `CostCalculator` to pass raw inputs on save**
- Build a `rawInputs` object from current state (`paperData`, `handleData`, `inkData`, `packagingData`, `otherMaterialsItems`)
- Pass it through `ResultPanel` to `SaveCalculationButton`

**Step 4: Update `handleEditCalculation` to restore raw inputs**
- When `calculation.raw_inputs` exists, restore each material field from the stored JSON
- Fallback to current behavior (computed cost with qty=1) for older records without `raw_inputs`

### Technical Details
- The `raw_inputs` JSON structure:
```json
{
  "paperData": { "packageValue": 25, "packageQuantity": 100, "quantityUsed": 1 },
  "handleData": { "packageValue": 21, "packageQuantity": 100, "quantityUsed": 1 },
  "inkData": { "totalValue": 50, "bottleCount": 1, "mlPerBottle": 100, "mlPerPrint": 5, "printQuantity": 10 },
  "packagingData": { "packageValue": 0, "packageQuantity": 1, "quantityUsed": 1 },
  "otherMaterialsItems": [...]
}
```
- Backward compatible: older records load with the current fallback logic
- Files to modify: `CostCalculator.tsx`, `ResultPanel.tsx`, `SaveCalculationButton.tsx`
- One database migration to add the column

