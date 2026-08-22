'use server'

import { randomUUID } from 'crypto'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { requireRole } from '@/lib/auth/require-role'
import { createAdminClient } from '@/lib/supabase/admin'
import type { ActionResult } from '@/types'

const MAX_IMAGE_BYTES = 5 * 1024 * 1024
const PUBLIC_IMAGE_CACHE_SECONDS = 60 * 60
const imageExtensions = new Map([
  ['image/jpeg', 'jpg'],
  ['image/png', 'png'],
  ['image/webp', 'webp'],
])

const offerSchema = z.object({
  id: z.string().uuid().optional(),
  title: z.string().trim().min(2, 'Give the recommendation a clear title.').max(100),
  summary: z.string().trim().min(2, 'Add a concise explanation.').max(500),
  priceNote: z.string().trim().max(160).optional().or(z.literal('')),
  imageUrl: z.string().trim().url('Use a valid image URL.').max(1200).optional().or(z.literal('')),
  imagePath: z.string().trim().regex(/^offers\/[0-9]{4}\/[a-z0-9-]+\.(jpg|png|webp)$/, 'Invalid uploaded image.').optional().or(z.literal('')),
  paymentUrl: z.string().trim().url('Use a valid payment URL.').max(1200).optional().or(z.literal('')),
  serviceSlug: z.string().trim().max(120).optional().or(z.literal('')),
  ctaLabel: z.string().trim().min(2).max(50),
  isActive: z.boolean(),
})

export interface AgentStudioOffer {
  id: string
  title: string
  summary: string
  priceNote: string | null
  imageUrl: string | null
  imagePath: string | null
  paymentUrl: string | null
  serviceSlug: string | null
  ctaLabel: string
  isActive: boolean
  sortOrder: number
  createdAt: string
}

export interface AgentStudioState {
  schemaReady: boolean
  offers: AgentStudioOffer[]
  schemaMessage?: string
}

function safeFileName(name: string): string {
  return name.replace(/\.[^.]+$/, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60) || 'offer-image'
}

function isHttps(value: string): boolean {
  try {
    return new URL(value).protocol === 'https:'
  } catch {
    return false
  }
}

function dbErrorMessage(): string {
  return 'Agent Studio needs migration 00010. Run it in Supabase SQL Editor after migrations 00000–00009.'
}

async function removePublicImage(path: string | null | undefined) {
  if (!path) return
  await createAdminClient().storage.from('public-agent-media').remove([path])
}

export async function getAgentStudioState(): Promise<AgentStudioState> {
  await requireRole('admin')
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('public_agent_offers')
    .select('id, title, summary, price_note, image_url, image_path, payment_url, service_slug, cta_label, is_active, sort_order, created_at')
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: false })

  if (error || !data) return { schemaReady: false, offers: [], schemaMessage: dbErrorMessage() }

  return {
    schemaReady: true,
    offers: data.map((offer) => ({
      id: offer.id,
      title: offer.title,
      summary: offer.summary,
      priceNote: offer.price_note,
      imageUrl: offer.image_url,
      imagePath: offer.image_path,
      paymentUrl: offer.payment_url,
      serviceSlug: offer.service_slug,
      ctaLabel: offer.cta_label,
      isActive: offer.is_active,
      sortOrder: offer.sort_order,
      createdAt: offer.created_at,
    })),
  }
}

export async function savePublicAgentOffer(input: {
  id?: string
  title: string
  summary: string
  priceNote?: string
  imageUrl?: string
  imagePath?: string
  paymentUrl?: string
  serviceSlug?: string
  ctaLabel: string
  isActive: boolean
}): Promise<ActionResult<{ id: string }>> {
  const uploadedPath = input.imagePath || null
  try {
    const { userId } = await requireRole('admin')
    const parsed = offerSchema.safeParse(input)
    if (!parsed.success) {
      await removePublicImage(uploadedPath)
      return { success: false, error: parsed.error.issues[0]?.message || 'Check the offer details.' }
    }

    if (parsed.data.imageUrl && !isHttps(parsed.data.imageUrl)) return { success: false, error: 'Image links must use HTTPS.' }
    if (parsed.data.paymentUrl && !isHttps(parsed.data.paymentUrl)) return { success: false, error: 'Payment links must use HTTPS.' }

    const admin = createAdminClient()
    const uploadedImagePath = parsed.data.imagePath || null
    const imageUrl = uploadedImagePath
      ? admin.storage.from('public-agent-media').getPublicUrl(uploadedImagePath).data.publicUrl
      : parsed.data.imageUrl || null
    const values = {
      title: parsed.data.title,
      summary: parsed.data.summary,
      price_note: parsed.data.priceNote || null,
      image_url: imageUrl,
      image_path: uploadedImagePath,
      payment_url: parsed.data.paymentUrl || null,
      service_slug: parsed.data.serviceSlug || null,
      cta_label: parsed.data.ctaLabel,
      is_active: parsed.data.isActive,
      updated_at: new Date().toISOString(),
    }

    if (parsed.data.id) {
      const { data: existing } = await admin.from('public_agent_offers').select('image_path').eq('id', parsed.data.id).maybeSingle()
      const { data, error } = await admin.from('public_agent_offers').update(values).eq('id', parsed.data.id).select('id').single()
      if (error || !data) {
        if (uploadedImagePath && uploadedImagePath !== existing?.image_path) await removePublicImage(uploadedImagePath)
        return { success: false, error: dbErrorMessage() }
      }
      if (existing?.image_path && existing.image_path !== uploadedImagePath) await removePublicImage(existing.image_path)
      revalidatePath('/admin/agent/studio')
      revalidatePath('/')
      return { success: true, data: { id: data.id } }
    }

    const { data, error } = await admin
      .from('public_agent_offers')
      .insert({ ...values, created_by: userId })
      .select('id')
      .single()

    if (error || !data) {
      await removePublicImage(uploadedImagePath)
      return { success: false, error: dbErrorMessage() }
    }
    revalidatePath('/admin/agent/studio')
    revalidatePath('/')
    return { success: true, data: { id: data.id } }
  } catch {
    await removePublicImage(uploadedPath)
    return { success: false, error: 'You are not authorised to update visitor-agent content.' }
  }
}

export async function deletePublicAgentOffer(id: string): Promise<ActionResult<undefined>> {
  try {
    await requireRole('admin')
    const parsed = z.string().uuid().safeParse(id)
    if (!parsed.success) return { success: false, error: 'Invalid recommendation.' }

    const admin = createAdminClient()
    const { data: offer, error: findError } = await admin.from('public_agent_offers').select('image_path').eq('id', parsed.data).maybeSingle()
    if (findError || !offer) return { success: false, error: 'Recommendation not found.' }
    const { error } = await admin.from('public_agent_offers').delete().eq('id', parsed.data)
    if (error) return { success: false, error: dbErrorMessage() }
    await removePublicImage(offer.image_path)
    revalidatePath('/admin/agent/studio')
    revalidatePath('/')
    return { success: true, data: undefined }
  } catch {
    return { success: false, error: 'You are not authorised to delete visitor-agent content.' }
  }
}

export async function uploadPublicAgentImage(formData: FormData): Promise<ActionResult<{ imageUrl: string; imagePath: string }>> {
  try {
    await requireRole('admin')
    const file = formData.get('file')
    if (!(file instanceof File)) return { success: false, error: 'Choose an image to upload.' }
    if (!imageExtensions.has(file.type)) return { success: false, error: 'Use a JPG, PNG, or WebP image.' }
    if (file.size === 0 || file.size > MAX_IMAGE_BYTES) return { success: false, error: 'Images must be between 1 byte and 5 MB.' }

    const extension = imageExtensions.get(file.type)!
    const path = `offers/${new Date().getUTCFullYear()}/${randomUUID()}-${safeFileName(file.name)}.${extension}`
    const admin = createAdminClient()
    const { error } = await admin.storage.from('public-agent-media').upload(path, Buffer.from(await file.arrayBuffer()), {
      contentType: file.type,
      cacheControl: String(PUBLIC_IMAGE_CACHE_SECONDS),
      upsert: false,
    })
    if (error) return { success: false, error: dbErrorMessage() }

    const { data } = admin.storage.from('public-agent-media').getPublicUrl(path)
    if (!data.publicUrl) {
      await removePublicImage(path)
      return { success: false, error: 'Image uploaded but no public URL could be created.' }
    }
    return { success: true, data: { imageUrl: data.publicUrl, imagePath: path } }
  } catch {
    return { success: false, error: 'You are not authorised to upload public agent images.' }
  }
}
