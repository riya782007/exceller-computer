import { EvolutionWhatsAppClient } from '@/lib/whatsapp/evolution-client'
import type {
  WhatsAppConnectionStatus,
  WhatsAppDocumentMessage,
  WhatsAppSendResult,
  WhatsAppTemplateMessage,
  WhatsAppTextMessage,
} from '@/lib/whatsapp/types'

const client = new EvolutionWhatsAppClient()

export async function sendWhatsAppMessage(
  input: WhatsAppTextMessage
): Promise<WhatsAppSendResult> {
  return client.sendMessage(input)
}

export async function sendWhatsAppDocument(
  input: WhatsAppDocumentMessage
): Promise<WhatsAppSendResult> {
  return client.sendDocument(input)
}

export async function sendWhatsAppTemplate(
  input: WhatsAppTemplateMessage
): Promise<WhatsAppSendResult> {
  return client.sendTemplate(input)
}

export async function getWhatsAppStatus(): Promise<WhatsAppConnectionStatus> {
  return client.getStatus()
}

export type {
  WhatsAppConnectionStatus,
  WhatsAppDocumentMessage,
  WhatsAppSendResult,
  WhatsAppTemplateMessage,
  WhatsAppTextMessage,
} from '@/lib/whatsapp/types'
