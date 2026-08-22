/**
 * Types shared between the public assistant UI and the server that feeds it.
 *
 * Deliberately a standalone module: `src/lib/ai/public-chat.ts` imports the
 * service-role Supabase client and the whole service catalog, so a client
 * component importing types from there is one accidental value-import away from
 * shipping server credentials to the browser.
 */
export const PUBLIC_CHAT_LANGUAGES = ['en', 'hi', 'hinglish'] as const
export type PublicChatLanguage = (typeof PUBLIC_CHAT_LANGUAGES)[number]

export interface PublicAgentOffer {
  id: string
  title: string
  summary: string
  priceNote: string | null
  imageUrl: string | null
  paymentUrl: string | null
  serviceSlug: string | null
  ctaLabel: string
}

export interface VisitorRecommendation extends PublicAgentOffer {
  serviceHref: string | null
}
