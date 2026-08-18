export interface WhatsAppTextMessage {
  to: string
  text: string
}

export interface WhatsAppDocumentMessage {
  to: string
  documentUrl: string
  fileName: string
  caption?: string
  mimeType?: string
}

export interface WhatsAppTemplateMessage {
  to: string
  templateName: string
  language?: string
  variables?: string[]
}

export interface WhatsAppSendResult {
  success: boolean
  messageId?: string
  error?: string
}

export interface WhatsAppConnectionStatus {
  connected: boolean
  instance?: string
  state?: string
  error?: string
}

export interface WhatsAppClient {
  sendMessage(input: WhatsAppTextMessage): Promise<WhatsAppSendResult>
  sendDocument(input: WhatsAppDocumentMessage): Promise<WhatsAppSendResult>
  sendTemplate(input: WhatsAppTemplateMessage): Promise<WhatsAppSendResult>
  getStatus(): Promise<WhatsAppConnectionStatus>
}
