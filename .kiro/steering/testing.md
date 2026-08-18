# Testing Standards — Exceller Computer Platform

## Test Runner

- Vitest for unit and integration tests
- Playwright for E2E tests (Phase 16)

## Test Structure

```
tests/
├── unit/              # Pure function tests
│   ├── tax-engine.test.ts
│   ├── status-transitions.test.ts
│   └── validators.test.ts
├── integration/       # API route + database tests
│   ├── webhooks.test.ts
│   ├── inventory-allocation.test.ts
│   └── invoice-generation.test.ts
└── e2e/              # Playwright end-to-end tests
    ├── admin-flow.spec.ts
    └── public-site.spec.ts
```

## What Must Be Tested

### Critical Business Invariants
1. **Inventory cannot become negative** — Concurrent allocation attempts must not allow negative stock
2. **Job status transitions** — Only valid transitions succeed; invalid ones rejected
3. **Tax calculation accuracy** — CGST/SGST/IGST computed correctly for all scenarios
4. **Invoice number generation** — Sequential, no gaps under concurrency
5. **WhatsApp bot pause** — AI does NOT reply when session is paused/escalated
6. **RLS enforcement** — Customers cannot access other customers' data
7. **Sold inventory visibility** — Zero-stock items do not appear in public catalog

### Unit Test Targets
- Tax engine: `calculateTax(subtotal, taxType)` → exact amounts
- Status machine: `isValidTransition(from, to)` → boolean
- Zod validators: various inputs → pass/fail correctly
- Invoice number formatter: year + sequence → correct format

### Integration Test Targets
- Webhook endpoints: valid/invalid payloads → correct responses
- Part allocation: concurrent requests → atomic, no negative stock
- Invoice creation: job + items → complete invoice record

## Test Commands

```bash
npm run test          # Run all unit tests
npm run test:watch    # Watch mode (dev only)
npm run test:coverage # Coverage report
npm run test:e2e      # Playwright E2E
```

## Coverage Goals

- Business logic (tax, status, inventory): > 90%
- API routes: > 80%
- Components: not required for MVP (visual review)

## CI Requirements

Before merge:
1. `tsc --noEmit` passes
2. `eslint .` passes
3. `npm run test` passes
4. `next build` succeeds
