# Architecture Assessment — Exceller Computer Platform

## Repository Status

**Current State:** Empty repository (no commits, no files)

There is no existing code, configuration, or infrastructure to preserve or migrate. This is a greenfield implementation.

---

## Target Architecture

### Frontend Stack
| Layer | Technology | Version Target |
|-------|-----------|---------------|
| Framework | Next.js (App Router) | 15.x |
| Language | TypeScript | 5.x (strict mode) |
| Styling | Tailwind CSS | 3.x |
| Components | shadcn/ui | latest |
| Validation | Zod | 3.x |
| PDF Generation | @react-pdf/renderer | 3.x |

### Backend/Data Stack
| Layer | Technology |
|-------|-----------|
| Database | Supabase PostgreSQL |
| Authentication | Supabase Auth |
| Realtime | Supabase Realtime |
| Storage | Supabase Storage |
| API Layer | Next.js Server Actions + Route Handlers |

### Integration Stack
| Service | Purpose |
|---------|---------|
| Evolution API | WhatsApp Business messaging |
| n8n | Workflow automation/orchestration |
| OpenAI Whisper | Voice message transcription |
| Claude/GPT | AI conversational agent |

### Hosting
| Service | Purpose |
|---------|---------|
| Vercel | Next.js frontend + API |
| Railway | n8n + Evolution API |

---

## Application Architecture

```
exceller-computer/
├── src/
│   ├── app/
│   │   ├── (public)/          # Customer-facing website
│   │   │   ├── page.tsx       # Homepage
│   │   │   ├── services/     # Services pages
│   │   │   ├── estimator/    # Repair price estimator
│   │   │   ├── catalog/      # Refurbished laptop catalog
│   │   │   ├── contact/      # Contact page
│   │   │   └── about/        # About page
│   │   ├── (auth)/           # Authentication flows
│   │   │   ├── login/
│   │   │   └── register/
│   │   ├── admin/            # Internal ERP (protected)
│   │   │   ├── dashboard/
│   │   │   ├── jobs/
│   │   │   ├── inventory/
│   │   │   ├── customers/
│   │   │   ├── technicians/
│   │   │   ├── invoices/
│   │   │   ├── whatsapp/
│   │   │   └── settings/
│   │   ├── api/              # Route handlers
│   │   │   ├── webhooks/     # n8n/Evolution webhooks
│   │   │   └── internal/     # Internal API endpoints
│   │   └── layout.tsx
│   ├── components/
│   │   ├── ui/               # shadcn/ui components
│   │   ├── forms/            # Form components
│   │   ├── layout/           # Layout components
│   │   └── domain/           # Business domain components
│   ├── lib/
│   │   ├── supabase/         # Supabase clients
│   │   ├── validations/      # Zod schemas
│   │   ├── actions/          # Server actions
│   │   ├── hooks/            # React hooks
│   │   ├── utils/            # Utility functions
│   │   └── constants/        # App constants
│   ├── types/                # TypeScript type definitions
│   └── styles/               # Global styles
├── supabase/
│   ├── migrations/           # SQL migrations
│   ├── functions/            # Edge functions
│   └── seed.sql              # Seed data
├── public/                   # Static assets
├── docs/                     # Documentation
└── tests/                    # Test files
```

---

## Database Schema (Core Entities)

### profiles
- Linked to Supabase Auth users
- Roles: admin, technician, customer
- Contact info, address

### inventory_items
- SKU, name, category, brand
- Cost/selling price, quantity
- HSN/SAC codes
- Check constraint: quantity >= 0

### repair_jobs
- Job card number (sequential)
- Customer/technician references
- Device info, fault, status
- State machine: received → diagnosed → quoted → approved → in_repair → ready → delivered/cancelled

### job_parts_allocated
- Links repair_jobs ↔ inventory_items
- Quantity allocated
- Atomic stock deduction via PostgreSQL function

### invoices
- Invoice number, date, customer, job reference
- Items, tax breakdown (CGST/SGST/IGST)
- PDF URL, payment status

### chat_sessions
- Phone number, customer link
- Bot state: active/paused/escalated
- Message history reference

---

## Security Architecture

1. **RLS on all tables** — No data accessible without proper auth context
2. **Role-based access** — admin, technician, customer roles enforced at DB level
3. **Server-side mutations** — All sensitive operations via Server Actions
4. **Zod validation** — Every user input validated before mutation
5. **No client-side secrets** — All API keys server-only
6. **Webhook authentication** — Signed payloads from n8n/Evolution

---

## Integration Boundaries

```
┌─────────────────────────────────────────────────┐
│              Next.js Application                  │
│  ┌───────────┐  ┌──────────┐  ┌──────────────┐ │
│  │  Public    │  │   ERP    │  │  API Routes  │ │
│  │  Website   │  │  Admin   │  │  (webhooks)  │ │
│  └───────────┘  └──────────┘  └──────────────┘ │
│                       │               │          │
│              Server Actions     Route Handlers   │
└───────────────────────┼───────────────┼──────────┘
                        │               │
                   ┌────┴────┐    ┌─────┴─────┐
                   │Supabase │    │  n8n      │
                   │(DB/Auth)│    │(Workflows)│
                   └─────────┘    └─────┬─────┘
                                        │
                                  ┌─────┴─────┐
                                  │Evolution  │
                                  │API        │
                                  │(WhatsApp) │
                                  └───────────┘
```

---

## Implementation Phases

| Phase | Scope | Dependencies |
|-------|-------|-------------|
| 1 | Infrastructure + Database | None |
| 2 | Auth + Roles + RLS | Phase 1 |
| 3 | ERP Shell | Phase 2 |
| 4 | Repair Job Lifecycle | Phase 3 |
| 5 | Inventory | Phase 3 |
| 6 | Job-Part Allocation | Phases 4, 5 |
| 7 | GST Invoicing | Phase 6 |
| 8 | WhatsApp Integration | Phase 3 |
| 9 | n8n Automation | Phase 8 |
| 10 | AI Agent | Phase 9 |
| 11 | Human Escalation | Phase 10 |
| 12 | Public Website | Phase 5 |
| 13 | Repair Estimator | Phase 12 |
| 14 | Refurbished Catalog | Phases 5, 12 |
| 15 | SEO | Phase 12 |
| 16 | E2E Testing | All phases |
| 17 | Production Hardening | Phase 16 |

---

## Decisions Made

| Decision | Rationale |
|----------|-----------|
| npm as package manager | pnpm requires corepack registry download; npm is available natively |
| Next.js 15 App Router | Latest stable, required for Server Actions + React Server Components |
| src/ directory | Cleaner separation from config files |
| Route groups | (public), (auth), admin for clear access control boundaries |
| PostgreSQL functions | Atomic operations for inventory deduction, job transitions |
| Centralized tax engine | Single source of truth for GST calculations, avoids drift |
| Webhook-based WhatsApp | Clean boundary — n8n handles async messaging, Next.js handles business logic |

---

## Environment Variables Required

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# WhatsApp (Server-only)
EVOLUTION_API_URL=
EVOLUTION_API_KEY=

# AI (Server-only)
OPENAI_API_KEY=
ANTHROPIC_API_KEY=

# n8n (Server-only)
N8N_WEBHOOK_SECRET=

# App
NEXT_PUBLIC_APP_URL=
NEXT_PUBLIC_BUSINESS_PHONE=
```

---

## Risk Assessment

| Risk | Mitigation |
|------|-----------|
| No npm access in sandbox | Scaffold complete code; dependencies installed at deploy time |
| Complex state machine | PostgreSQL function + transition validation table |
| Race conditions on inventory | Database-level CHECK constraint + atomic transactions |
| WhatsApp API changes | Abstraction layer in integration boundary |
| AI hallucination | Strict grounding rules + escalation thresholds |
| GST rule changes | Configurable tax engine, not hardcoded rates |
