# Deploy Checklist

## Why this exists

Five consecutive Vercel deploys failed. Every failure was a bug that `tsc`,
`eslint` or `next build` would have caught locally in seconds. The fix is to run
those three commands **before** pushing, rather than using Vercel as the
type-checker.

## Run before every push

```bash
npm install --legacy-peer-deps   # once, or after package.json changes
npm run verify                   # type-check + lint + test + build
```

`npm run verify` must exit 0. If it fails, the deploy will fail — fix it first.

CI (`.github/workflows/ci.yml`) runs the same commands on every push and PR, so
a red check on GitHub means a red deploy on Vercel.

---

## One-time setup

### 1. Database

Run in the Supabase SQL Editor, **in this order, as two separate queries**:

1. `supabase/SETUP_PART_A.sql` — enum extensions
2. `supabase/SETUP_PART_B.sql` — full platform schema

They must be separate runs: PostgreSQL will not let a value added by
`ALTER TYPE … ADD VALUE` be referenced in the same transaction, and Part B's
functions reference the new statuses.

Both scripts are idempotent — re-running them is safe.

### 2. Create the first admin

Create a user in Supabase → Authentication → Users, then:

```sql
UPDATE profiles
SET role = 'admin',
    role_id = (SELECT id FROM roles WHERE key = 'super_admin')
WHERE email = 'you@example.com';
```

### 3. Set the GSTIN

Tax invoices are not legally valid without it:

```sql
UPDATE app_settings SET value = '"07XXXXXXXXXXXZX"'::jsonb
WHERE key = 'business.gstin';
```

### 4. Confirm the legal name

⚠️ `business.legal_name` prints on tax invoices and must match the GST
certificate character-for-character. Currently `Exeller Infosolutions LLP`,
based on the live site and the operational research. **Verify before invoicing.**

```sql
UPDATE app_settings SET value = '"<exact name from GST certificate>"'::jsonb
WHERE key = 'business.legal_name';
```

### 5. Vercel environment variables

Project Settings → Environment Variables, all environments:

| Variable | Notes |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | same page |
| `SUPABASE_SERVICE_ROLE_KEY` | **no** `NEXT_PUBLIC_` prefix — bypasses all RLS |
| `NEXT_PUBLIC_APP_URL` | your deployed URL |
| `NEXT_PUBLIC_BUSINESS_PHONE` | `+919718828173` |

Redeploy after adding — existing builds do not pick up new variables.

### 6. Regenerate database types

After running the SQL, replace the hand-written types with generated ones:

```bash
export SUPABASE_PROJECT_ID=your-project-ref
npm run gen:types
```

The hand-written `database.ts` is what drifted and caused the `never`-inference
build failure. Generating it removes that class of bug and guarantees the types
match the real schema — the new tables will not be usable from TypeScript until
you do this.

---

## Expected state after setup

| Route | Status |
|---|---|
| `/` | works |
| `/login` | works |
| `/admin/*` | works (admin role required) |
| `/services`, `/estimator`, `/catalog`, `/contact`, `/about` | **404 — not built yet** |

Those public routes are linked from the header and footer but do not exist yet.
They are Phase 1 of the delivery plan in `PLATFORM_ARCHITECTURE.md`.
