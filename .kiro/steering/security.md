# Security Standards — Exceller Computer Platform

## Authentication

- Supabase Auth handles all authentication
- Support email/password and phone OTP
- Session management via Supabase Auth cookies (SSR)
- Admin routes require `admin` role check at middleware AND data layer
- Technician routes require `technician` or `admin` role

## Authorization Model

### Roles
| Role | Access |
|------|--------|
| admin | Full system access |
| technician | Assigned jobs, inventory read, part allocation |
| customer | Own profile, own jobs, own invoices |

### Enforcement Layers
1. **Middleware** — Route-level protection (redirect unauthorized)
2. **Server Actions** — Role validation before mutation
3. **RLS** — Database-level row filtering (final authority)

## Secrets Management

### Server-Only Variables (never prefix with NEXT_PUBLIC_)
- `SUPABASE_SERVICE_ROLE_KEY`
- `EVOLUTION_API_KEY`
- `EVOLUTION_API_URL`
- `OPENAI_API_KEY`
- `ANTHROPIC_API_KEY`
- `N8N_WEBHOOK_SECRET`
- `WEBHOOK_SIGNING_SECRET`

### Client-Safe Variables (NEXT_PUBLIC_ prefix)
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_APP_URL`
- `NEXT_PUBLIC_BUSINESS_PHONE`

## Input Validation

- Every user input validated with Zod before database operations
- Sanitize HTML content if any rich text is stored
- Validate file uploads (type, size) before Supabase Storage
- Validate webhook payloads (signature verification)

## API Security

### Webhook Endpoints
- Verify `X-Webhook-Secret` or HMAC signature
- Rate limit webhook endpoints
- Log all incoming webhook payloads (redacted)

### Internal API Routes
- Require authentication header
- Validate request body with Zod
- Return generic error messages (no stack traces)

## Data Protection

- Customer phone numbers are PII — never log in full
- Financial data (invoices, costs) restricted by RLS
- Passwords handled entirely by Supabase Auth (never stored/processed by app)
- PDF invoices stored in authenticated Supabase Storage bucket

## Headers & Transport

- HTTPS only (enforced by Vercel)
- Appropriate CSP headers
- X-Frame-Options: DENY
- Strict-Transport-Security enabled
- No CORS wildcards on API routes
