import { logger, redactPhone } from '@/lib/logger'
import type {
  WhatsAppClient,
  WhatsAppConnectionStatus,
  WhatsAppDocumentMessage,
  WhatsAppSendResult,
  WhatsAppTemplateMessage,
  WhatsAppTextMessage,
} from '@/lib/whatsapp/types'

const REQUEST_TIMEOUT_MS = 12_000

interface EvolutionConfig {
  baseUrl: string
  apiKey: string
  instance: string
}

function getConfig(): EvolutionConfig | null {
  const baseUrl = process.env.EVOLUTION_API_URL
  const apiKey = process.env.EVOLUTION_API_KEY
  const instance = process.env.EVOLUTION_INSTANCE_NAME ?? 'exeller'

  if (!baseUrl || !apiKey) {
    return null
  }

  return {
    baseUrl: baseUrl.replace(/\/$/, ''),
    apiKey,
    instance,
  }
}

async function evolutionFetch(
  path: string,
  init: RequestInit
): Promise<{ ok: boolean; status: number; json: unknown }> {
  const config = getConfig()
  if (!config) {
    throw new Error('Evolution API is not configured')
  }

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)

  try {
    const response = await fetch(`${config.baseUrl}${path}`, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        apikey: config.apiKey,
        ...(init.headers ?? {}),
      },
      signal: controller.signal,
    })

    let json: unknown = null
    try {
      json = await response.json()
    } catch {
      json = null
    }

    if (response.status === 401 || response.status === 403) {
      logger.error('Evolution API authentication failed', { status: response.status })
    }
    if (response.status === 429) {
      logger.warn('Evolution API rate limited', { status: response.status })
    }

    return { ok: response.ok, status: response.status, json }
  } catch (error) {
    const aborted = error instanceof Error && error.name === 'AbortError'
    logger.error('Evolution API request failed', {
      path,
      timeout: aborted,
    })
    throw new Error(aborted ? 'WhatsApp provider timed out' : 'WhatsApp provider unreachable')
  } finally {
    clearTimeout(timeout)
  }
}

function extractMessageId(json: unknown): string | undefined {
  if (!json || typeof json !== 'object') return undefined
  const record = json as Record<string, unknown>
  const key = record.key
  if (key && typeof key === 'object' && 'id' in key && typeof key.id === 'string') {
    return key.id
  }
  if (typeof record.messageId === 'string') return record.messageId
  return undefined
}

export class EvolutionWhatsAppClient implements WhatsAppClient {
  async sendMessage(input: WhatsAppTextMessage): Promise<WhatsAppSendResult> {
    const config = getConfig()
    if (!config) {
      return { success: false, error: 'WhatsApp is not configured' }
    }

    try {
      const result = await evolutionFetch(`/message/sendText/${config.instance}`, {
        method: 'POST',
        body: JSON.stringify({
          number: input.to.replace(/[^\d]/g, ''),
          text: input.text,
        }),
      })

      if (!result.ok) {
        logger.warn('WhatsApp text send failed', {
          status: result.status,
          to: redactPhone(input.to),
        })
        return { success: false, error: 'Message could not be sent' }
      }

      return { success: true, messageId: extractMessageId(result.json) }
    } catch {
      return { success: false, error: 'Message could not be sent' }
    }
  }

  async sendDocument(input: WhatsAppDocumentMessage): Promise<WhatsAppSendResult> {
    const config = getConfig()
    if (!config) {
      return { success: false, error: 'WhatsApp is not configured' }
    }

    try {
      const result = await evolutionFetch(`/message/sendMedia/${config.instance}`, {
        method: 'POST',
        body: JSON.stringify({
          number: input.to.replace(/[^\d]/g, ''),
          mediatype: 'document',
          mimetype: input.mimeType ?? 'application/pdf',
          caption: input.caption ?? '',
          media: input.documentUrl,
          fileName: input.fileName,
        }),
      })

      if (!result.ok) {
        logger.warn('WhatsApp document send failed', {
          status: result.status,
          to: redactPhone(input.to),
        })
        return { success: false, error: 'Document could not be sent' }
      }

      return { success: true, messageId: extractMessageId(result.json) }
    } catch {
      return { success: false, error: 'Document could not be sent' }
    }
  }

  async sendTemplate(input: WhatsAppTemplateMessage): Promise<WhatsAppSendResult> {
    const text = [input.templateName, ...(input.variables ?? [])].join('\n')
    return this.sendMessage({ to: input.to, text })
  }

  async getStatus(): Promise<WhatsAppConnectionStatus> {
    const config = getConfig()
    if (!config) {
      return { connected: false, error: 'WhatsApp is not configured' }
    }

    try {
      const result = await evolutionFetch(`/instance/connectionState/${config.instance}`, {
        method: 'GET',
      })

      if (!result.ok) {
        return { connected: false, instance: config.instance, error: 'Status unavailable' }
      }

      const json = result.json as { instance?: { state?: string }; state?: string }
      const state = json.instance?.state ?? json.state ?? 'unknown'
      return {
        connected: state === 'open',
        instance: config.instance,
        state,
      }
    } catch {
      return { connected: false, instance: config.instance, error: 'Status unavailable' }
    }
  }
}

export function isEvolutionConfigured(): boolean {
  return getConfig() !== null
}
