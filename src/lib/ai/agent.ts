import { loadGroundedFacts } from '@/lib/ai/grounding'
import { pauseBotAndNotify, shouldEscalate } from '@/lib/ai/escalation'
import { logger } from '@/lib/logger'
import { createAdminClient } from '@/lib/supabase/admin'

export interface AgentTurnResult {
  reply: string | null
  paused: boolean
}

const SYSTEM_RULES = `
You are the WhatsApp assistant for Exeller Computer (Exeller Infosolutions LLP), a laptop repair shop opposite Dwarka Mor Metro Station Gate No. 2, Sewak Park, New Delhi 110059.

Languages: reply in the customer's language (English, Hindi, or Hinglish).

HARD RULES:
- Never invent prices, inventory, warranty terms, repair status, discounts, or diagnoses.
- Only use facts provided in the GROUNDED FACTS block.
- If a fact is missing, say you will confirm with the shop and offer WhatsApp booking / a visit.
- Estimates on the website are not final diagnostic quotes.
- If the customer wants a human, a discount, or you are uncertain, do not answer the question; return ESCALATE.
`

function extractJobCard(message: string): string | undefined {
  const match = message.match(/EXC-\d{4}-\d{4}/i)
  return match?.[0]?.toUpperCase()
}

async function completeWithModel(prompt: string): Promise<string | null> {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    return null
  }

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 15_000)

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL ?? 'gpt-4o-mini',
        temperature: 0.2,
        messages: [
          { role: 'system', content: SYSTEM_RULES },
          { role: 'user', content: prompt },
        ],
      }),
      signal: controller.signal,
    })

    if (!response.ok) {
      logger.error('OpenAI request failed', { status: response.status })
      return null
    }

    const json = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>
    }
    return json.choices?.[0]?.message?.content?.trim() ?? null
  } catch (error) {
    const timeoutHit = error instanceof Error && error.name === 'AbortError'
    logger.error('OpenAI request error', { timeout: timeoutHit })
    return null
  } finally {
    clearTimeout(timeout)
  }
}

function fallbackReply(facts: Awaited<ReturnType<typeof loadGroundedFacts>>): string {
  const laptopLines =
    facts.laptops.length > 0
      ? facts.laptops
          .slice(0, 5)
          .map((item) => `• ${item.name} — ₹${item.sellingPrice} (${item.quantity} in stock)`)
          .join('\n')
      : 'No refurbished laptops are currently listed as available.'

  const jobLine = facts.job
    ? `Job ${facts.job.jobCardNumber} (${facts.job.device}) is currently: ${facts.job.status}.${
        facts.job.estimatedCost != null ? ` Quoted estimate on file: ₹${facts.job.estimatedCost}.` : ''
      }`
    : 'I can share a job status if you send your job card number (EXC-YYYY-NNNN).'

  return [
    `Exeller Computer, ${facts.store.address}.`,
    `Hours: ${facts.store.hours}.`,
    jobLine,
    'Available refurbished laptops:',
    laptopLines,
    'Website estimates are not a final diagnosis. Visit the shop or share your brand, model, and issue for booking.',
  ].join('\n')
}

export async function handleCustomerMessage(phoneNumber: string, message: string): Promise<AgentTurnResult> {
  const supabase = createAdminClient()
  const now = new Date().toISOString()

  const { data: session } = await supabase
    .from('chat_sessions')
    .select('id, bot_state')
    .eq('phone_number', phoneNumber)
    .maybeSingle()

  if (session?.bot_state === 'paused' || session?.bot_state === 'escalated') {
    await supabase
      .from('chat_sessions')
      .update({ last_message_at: now })
      .eq('id', session.id)
    return { reply: null, paused: true }
  }

  const escalation = shouldEscalate(message)
  if (escalation.escalate) {
    await pauseBotAndNotify(phoneNumber, escalation.reason)
    return { reply: null, paused: true }
  }

  if (!session) {
    await supabase.from('chat_sessions').insert({
      phone_number: phoneNumber,
      bot_state: 'active',
      last_message_at: now,
      context_data: { last_customer_message: message },
    })
  } else {
    await supabase
      .from('chat_sessions')
      .update({
        last_message_at: now,
        context_data: { last_customer_message: message },
      })
      .eq('id', session.id)
  }

  const facts = await loadGroundedFacts(phoneNumber, extractJobCard(message))
  const prompt = `GROUNDED FACTS:\n${JSON.stringify(facts)}\n\nCUSTOMER MESSAGE:\n${message}\n\nIf you lack facts, say so. If you must escalate, reply with exactly ESCALATE.`

  const modelReply = await completeWithModel(prompt)
  if (modelReply === 'ESCALATE') {
    await pauseBotAndNotify(phoneNumber, 'Model requested escalation due to uncertainty')
    return { reply: null, paused: true }
  }

  if (!modelReply) {
    return { reply: fallbackReply(facts), paused: false }
  }

  return { reply: modelReply, paused: false }
}
