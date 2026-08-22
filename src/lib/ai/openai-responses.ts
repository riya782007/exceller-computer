type OpenAiContent = {
  type?: unknown
  text?: unknown
}

type OpenAiOutput = {
  content?: unknown
}

function getRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === 'object' && value !== null ? value as Record<string, unknown> : null
}

function extractOutputText(payload: unknown): string | null {
  const record = getRecord(payload)
  if (!record) return null

  if (typeof record.output_text === 'string' && record.output_text.trim()) {
    return record.output_text.trim()
  }

  if (!Array.isArray(record.output)) return null
  const parts: string[] = []

  for (const outputItem of record.output) {
    const output = outputItem as OpenAiOutput
    if (!Array.isArray(output.content)) continue

    for (const contentItem of output.content) {
      const content = contentItem as OpenAiContent
      if (content.type === 'output_text' && typeof content.text === 'string') {
        parts.push(content.text)
      }
    }
  }

  const text = parts.join('\n').trim()
  return text || null
}

export class OpenAiConfigurationError extends Error {
  constructor() {
    super('OpenAI is not configured. Add OPENAI_API_KEY in Vercel, then redeploy.')
  }
}

export async function createOpenAiResponse(input: {
  instructions: string
  prompt: string
  maxOutputTokens?: number
}): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) throw new OpenAiConfigurationError()

  const response = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || 'gpt-4.1-mini',
      instructions: input.instructions,
      input: input.prompt,
      max_output_tokens: input.maxOutputTokens ?? 550,
    }),
    cache: 'no-store',
  })

  const payload: unknown = await response.json().catch(() => null)
  if (!response.ok) {
    const record = getRecord(payload)
    const providerError = getRecord(record?.error)
    const message = typeof providerError?.message === 'string'
      ? providerError.message
      : 'OpenAI could not generate a response.'
    throw new Error(message)
  }

  const output = extractOutputText(payload)
  if (!output) throw new Error('OpenAI returned no usable response.')
  return output
}
