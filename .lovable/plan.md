

## Plan: Implement Shopee 2026 Tier-Based Marketplace

The user provided a complete new `MarketplaceSection.tsx` with Shopee 2026 tiered pricing (CPF/CNPJ), replacing the old `shopee_no_shipping`/`shopee_free_shipping` system. This requires updating multiple files.

### Changes Required

**1. Replace `MarketplaceSection.tsx`**
- Overwrite with the user's provided code (fixing JSX that was stripped — the user pasted code that lost HTML tags)
- New types: `MarketplaceType = 'none' | 'shopee' | 'custom'`, `ShopeeAccountType`
- New exports: `SHOPEE_TIERS`, `calcShopeeCost`, `getShopeeTier`

**2. Update `CostCalculator.tsx`**
- Add `shopeeAccountType` state (`ShopeeAccountType`)
- Pass `shopeeAccountType`, `onShopeeAccountTypeChange`, and `unitPrice` to `MarketplaceSection`
- When marketplace is `'shopee'`, use `calcShopeeCost` to derive commission/fees instead of flat percentages
- Update the calculation logic to use Shopee tier-based fees when `marketplace === 'shopee'`

**3. Update `useCalculator.ts`**
- Add `shopeeAccountType` state
- Update `MarketplaceType` import (already compatible with 'none'/'shopee'/'custom')
- When `marketplace === 'shopee'`, calculate fees using `calcShopeeCost` instead of flat commission

**4. Update `MarketplaceImpact.tsx`**
- Remove reference to old `MARKETPLACE_CONFIG` labels for `shopee_no_shipping`/`shopee_free_shipping`
- Adapt to work with new `'shopee'` type

**5. Update `QuantitySimulator.tsx`**
- When marketplace is Shopee, use `calcShopeeCost` per quantity tier instead of flat commission
- Add `marketplace` and `shopeeAccountType` props

**6. Update `ResultPanel.tsx`**
- Pass new marketplace/Shopee props through to child components

### Key Technical Details

- The Shopee solver calculates fees per-unit based on price tiers (5 tiers from R$0-R$79.99 up to R$500+)
- CPF high-volume sellers pay an extra R$3/order
- Fixed fees are per-order (amortized by lot quantity)
- The calculation must be iterative: the price determines the tier, but the tier affects the price

