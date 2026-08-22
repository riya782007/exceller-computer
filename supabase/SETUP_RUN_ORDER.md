# Exeller Computer — Supabase setup runbook

## Why the previous query failed

`20240101000008_media_and_whatsapp_audit.sql` assumes that the base platform is already installed. It references `public.profiles`, which is created by `20240101000001_create_profiles.sql`.

The `public.profiles does not exist` error means that migration 00008 was run before the foundational migrations.

## Fresh-project installation order

Open **Supabase Dashboard → SQL Editor → New query**. Copy and run these files **one at a time, in exactly this order**:

1. `supabase/migrations/20240101000000_create_enums.sql`
2. `supabase/migrations/20240101000001_create_profiles.sql`
3. `supabase/migrations/20240101000002_create_inventory.sql`
4. `supabase/migrations/20240101000003_create_repair_jobs.sql`
5. `supabase/migrations/20240101000004_create_job_parts_allocated.sql`
6. `supabase/migrations/20240101000005_create_invoices.sql`
7. `supabase/migrations/20240101000006_create_chat_sessions.sql`
8. `supabase/migrations/20240101000007_create_invoices_bucket.sql`
9. `supabase/migrations/20240101000008_media_and_whatsapp_audit.sql`
10. `supabase/migrations/20240101000009_job_workspace.sql`
11. `supabase/migrations/20240101000010_public_agent_offers.sql`

Do **not** start at 00008. Do **not** run `SETUP_PART_A.sql` or `SETUP_PART_B.sql` during this baseline setup. Those are a later expanded CRM/RBAC architecture and require a separately reviewed migration plan.

## Bootstrap the owner account

1. Create the owner login in **Authentication → Users**, or sign up through the application.
2. Run this query, replacing the email:

```sql
UPDATE public.profiles
SET role = 'admin', is_active = true
WHERE email = 'OWNER_EMAIL_HERE';

SELECT id, full_name, email, role, is_active
FROM public.profiles
WHERE email = 'OWNER_EMAIL_HERE';
```

The result must show `role = admin` and `is_active = true`.

## Verify the installation

Run this after all 11 migrations:

```sql
SELECT
  to_regclass('public.profiles') AS profiles,
  to_regclass('public.inventory_items') AS inventory_items,
  to_regclass('public.repair_jobs') AS repair_jobs,
  to_regclass('public.invoices') AS invoices,
  to_regclass('public.leads') AS leads,
  to_regclass('public.chat_sessions') AS chat_sessions,
  to_regclass('public.business_assets') AS business_assets,
  to_regclass('public.webhook_events') AS webhook_events,
  to_regclass('public.chat_messages') AS chat_messages,
  to_regclass('public.public_agent_offers') AS public_agent_offers,
  to_regclass('public.public_agent_rate_limits') AS public_agent_rate_limits;
```

Every column must return the matching table name, not `NULL`.

## Required Vercel variables

The application needs these before using admin, lead capture, media or WhatsApp flows:

```text
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
```

For WhatsApp intake, add at least one protected webhook authentication mechanism:

```text
N8N_WEBHOOK_SECRET
WEBHOOK_SIGNING_SECRET
```

For the public visitor agent, also configure server-only AI and rate-limit values, then enable Vercel Firewall / bot protection for `/api/public-chat` before making the assistant public:

```text
OPENAI_API_KEY
OPENAI_MODEL=gpt-4.1-mini
PUBLIC_CHAT_RATE_LIMIT_SALT
```

`PUBLIC_CHAT_RATE_LIMIT_SALT` must be a long random secret and must never use the `NEXT_PUBLIC_` prefix. Migration 00010 provides an atomic, shared per-visitor quota; Vercel Firewall provides the additional edge protection against bot traffic.

Never prefix service, webhook, OpenAI, or rate-limit secrets with `NEXT_PUBLIC_`.
