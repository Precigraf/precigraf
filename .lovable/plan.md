## Plan: Implement Shopee 2026 Solver-Based Marketplace

### Current State (implemented)

**Solver Formula**: `finalPrice = (baseCost + fixedFee) / (1 - commissionRate)`

The Shopee calculation uses a solver approach that embeds commission and fixed fees into the final selling price. Given the seller's base cost (production + desired profit), the solver calculates the minimum selling price that covers all marketplace fees.

**Price Ranges (2026)**:
| Faixa | Min | Max | Comissão | Taxa Fixa |
|---|---|---|---|---|
| Até R$ 79,99 | 0 | 79.99 | 20% | R$ 4 |
| R$ 80 – R$ 99,99 | 80 | 99.99 | 14% | R$ 16 |
| R$ 100 – R$ 199,99 | 100 | 199.99 | 14% | R$ 20 |
| R$ 200 – R$ 499,99 | 200 | 499.99 | 14% | R$ 26 |
| Acima de R$ 500 | 500 | ∞ | 14% | R$ 26 |

**CPF/CNPJ**: Removed. `ShopeeAccountType` kept as deprecated type for compatibility only.

**Files**:
- `MarketplaceSection.tsx` — types, `calcShopeeCost` solver, UI
- `useCalculator.ts` — uses solver to compute `unitPrice`
- `CostCalculator.tsx` — uses solver
- `QuantitySimulator.tsx` — uses solver
