# Tech Stack Standards — Exceller Computer Platform

## Core Stack

- **Framework:** Next.js 15 (App Router only — no Pages Router)
- **Language:** TypeScript in strict mode (`"strict": true`)
- **Styling:** Tailwind CSS 3.x (utility-first, no custom CSS unless unavoidable)
- **Components:** shadcn/ui (installed into `src/components/ui/`)
- **Validation:** Zod for all user input, API payloads, and environment variables
- **Database:** Supabase PostgreSQL with Row Level Security enabled on every table
- **Auth:** Supabase Auth (email + phone)
- **Realtime:** Supabase Realtime (only where operationally useful)
- **Storage:** Supabase Storage (invoices, images)
- **PDF:** @react-pdf/renderer
- **Package Manager:** npm

## Architecture Rules

1. **App Router only** — Use Server Components by default. Mark `'use client'` only when interactivity is required.
2. **Server Actions** — All mutations that touch sensitive data must use Server Actions (not client-side fetch to API routes).
3. **Route Groups** — `(public)` for customer-facing, `(auth)` for login/register, `admin/` for ERP.
4. **src/ directory** — All source code lives under `src/`.
5. **No barrel exports** — Import directly from the source module.
6. **Absolute imports** — Use `@/` path alias mapping to `src/`.

## Security Rules

1. **RLS on every table** — No exceptions.
2. **Server-side secrets** — `SUPABASE_SERVICE_ROLE_KEY`, `EVOLUTION_API_KEY`, `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `N8N_WEBHOOK_SECRET` must NEVER be exposed to the browser.
3. **Zod validation** — Every Server Action and API route must validate input with Zod before processing.
4. **Role enforcement at data layer** — Never rely solely on UI hiding for access control.
5. **No raw SQL in components** — Database access goes through typed Supabase client or server actions.

## Code Quality Rules

1. **No `any` type** — Use proper types or `unknown` with type guards.
2. **No unused imports/variables** — ESLint enforced.
3. **Explicit return types** — All exported functions must have explicit return types.
4. **Error handling** — Every async operation must handle errors. No unhandled promise rejections.
5. **No console.log in production** — Use structured logging.
6. **No duplicate business logic** — Tax calculations, status transitions, and inventory mutations each have ONE source of truth.

## Database Rules

1. **UUIDs** for all primary keys (using `gen_random_uuid()`).
2. **Timestamps** — Every table has `created_at` and `updated_at` columns.
3. **CHECK constraints** — Use PostgreSQL constraints for business invariants (e.g., `quantity >= 0`).
4. **Foreign keys** — All references enforced with proper ON DELETE behavior.
5. **Indexes** — Create indexes for frequently queried columns and foreign keys.
6. **Migrations** — All schema changes via numbered migration files in `supabase/migrations/`.
7. **No client-side consistency** — Database functions/transactions for multi-step operations.

## Naming Conventions

- **Files:** kebab-case (`repair-job-card.tsx`)
- **Components:** PascalCase (`RepairJobCard`)
- **Variables/functions:** camelCase (`getRepairJob`)
- **Database tables:** snake_case (`repair_jobs`)
- **Database columns:** snake_case (`created_at`)
- **Constants:** UPPER_SNAKE_CASE (`MAX_RETRY_COUNT`)
- **Types/Interfaces:** PascalCase (`RepairJob`)
- **Zod schemas:** camelCase with Schema suffix (`repairJobSchema`)

## Dependencies Policy

- No unnecessary dependencies. Prefer built-in Node/browser APIs.
- Every new dependency must serve a clear purpose.
- Prefer well-maintained packages with active security updates.
- Pin major versions in package.json.

## Testing Requirements

- TypeScript must compile without errors.
- ESLint must pass.
- Build must succeed.
- Critical business logic must have unit tests (tax engine, state machine, inventory).
- Integration tests for API routes handling webhooks.
