# API Contracts — Exceller Computer Platform

## Internal API Routes

All internal API routes live under `src/app/api/`.

### Response Format

```typescript
// Success
{ success: true, data: T }

// Error
{ success: false, error: { code: string, message: string } }
```

### Error Codes
- `UNAUTHORIZED` — No valid session
- `FORBIDDEN` — Insufficient role/permissions
- `VALIDATION_ERROR` — Input validation failed
- `NOT_FOUND` — Resource not found
- `CONFLICT` — Business rule violation (e.g., insufficient stock)
- `INTERNAL_ERROR` — Server error (generic, no details leaked)

## Webhook Endpoints

### POST /api/webhooks/whatsapp
- **Source:** Evolution API via n8n
- **Auth:** `X-Webhook-Secret` header
- **Payload:** Evolution API message format
- **Response:** 200 OK (acknowledge receipt)

### POST /api/webhooks/n8n
- **Source:** n8n workflows
- **Auth:** `X-Webhook-Secret` header
- **Actions:** job_update, send_notification, escalation
- **Response:** 200 with action result

## Server Actions

Server Actions are the primary mutation interface. They are NOT API routes.

### Naming Convention
- `create[Entity]` — Creates new record
- `update[Entity]` — Updates existing record
- `delete[Entity]` — Soft/hard deletes record
- `transition[Entity]Status` — State machine transition
- `allocate[Resource]` — Resource allocation with atomic guarantees

### Return Type
```typescript
type ActionResult<T> = 
  | { success: true; data: T }
  | { success: false; error: string }
```

### Validation Pattern
```typescript
'use server'

import { z } from 'zod'
import { createServerClient } from '@/lib/supabase/server'
import { requireRole } from '@/lib/auth/require-role'

const schema = z.object({ /* ... */ })

export async function createEntity(formData: FormData): Promise<ActionResult<Entity>> {
  await requireRole('admin')
  const validated = schema.safeParse(Object.fromEntries(formData))
  if (!validated.success) return { success: false, error: 'Validation failed' }
  // ... execute mutation
}
```

## Integration Contracts

### Next.js ↔ n8n
- Next.js exposes webhook endpoints for n8n to call
- n8n calls Next.js Server Actions indirectly via API routes when needed
- Shared contract: message format, job update format, notification format

### Next.js ↔ Evolution API
- Never called directly from Next.js frontend
- All WhatsApp messaging goes through n8n workflows
- Next.js only receives processed data from n8n

### Next.js ↔ AI (OpenAI/Anthropic)
- Called server-side only (from API routes or n8n)
- System prompt includes grounding rules
- Response validated before sending to customer
