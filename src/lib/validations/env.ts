import { z } from 'zod'

/**
 * Server-side environment variable validation.
 * Validated at build time and runtime to catch missing configuration early.
 */
const serverEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  EVOLUTION_API_URL: z.string().url().optional(),
  EVOLUTION_API_KEY: z.string().min(1).optional(),
  OPENAI_API_KEY: z.string().min(1).optional(),
  ANTHROPIC_API_KEY: z.string().min(1).optional(),
  N8N_WEBHOOK_SECRET: z.string().min(1).optional(),
  WEBHOOK_SIGNING_SECRET: z.string().min(1).optional(),
})

const clientEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  NEXT_PUBLIC_APP_URL: z.string().url().optional(),
  NEXT_PUBLIC_BUSINESS_PHONE: z.string().optional(),
})

export type ServerEnv = z.infer<typeof serverEnvSchema>
export type ClientEnv = z.infer<typeof clientEnvSchema>

/**
 * Validates server environment variables.
 * Call this in server-side code to ensure all required env vars are present.
 */
export function validateServerEnv(): ServerEnv {
  const result = serverEnvSchema.safeParse(process.env)
  if (!result.success) {
    const missingVars = result.error.issues.map((i) => i.path.join('.')).join(', ')
    throw new Error(`Missing or invalid server environment variables: ${missingVars}`)
  }
  return result.data
}

/**
 * Validates client environment variables.
 */
export function validateClientEnv(): ClientEnv {
  const result = clientEnvSchema.safeParse({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_BUSINESS_PHONE: process.env.NEXT_PUBLIC_BUSINESS_PHONE,
  })
  if (!result.success) {
    const missingVars = result.error.issues.map((i) => i.path.join('.')).join(', ')
    throw new Error(`Missing or invalid client environment variables: ${missingVars}`)
  }
  return result.data
}
