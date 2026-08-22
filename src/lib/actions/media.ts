'use server'

import { randomUUID } from 'crypto'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { requireRole } from '@/lib/auth/require-role'
import { createAdminClient } from '@/lib/supabase/admin'
import type { ActionResult } from '@/types'

const MAX_IMAGE_BYTES = 5 * 1024 * 1024
const supportedImageTypes = new Map([
  ['image/jpeg', 'jpg'],
  ['image/png', 'png'],
  ['image/webp', 'webp'],
])

const metadataSchema = z.object({
  altText: z.string().trim().max(160).optional().or(z.literal('')),
  purpose: z.enum(['hero', 'gallery', 'service', 'team', 'general']).default('general'),
})

export interface BusinessAsset {
  id: string
  fileName: string
  mimeType: string
  sizeBytes: number
  altText: string | null
  purpose: string
  createdAt: string
  signedUrl: string | null
}

function safeFileName(name: string): string {
  return name
    .replace(/\.[^.]+$/, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60) || 'image'
}

export async function listBusinessAssets(): Promise<BusinessAsset[]> {
  await requireRole('admin')
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('business_assets')
    .select('id, storage_path, file_name, mime_type, size_bytes, alt_text, purpose, created_at')
    .order('created_at', { ascending: false })
    .limit(100)

  if (error || !data) {
    throw new Error('Could not load the media library.')
  }

  const assets = await Promise.all(
    data.map(async (asset) => {
      const { data: signed } = await admin.storage
        .from('business-assets')
        .createSignedUrl(asset.storage_path, 60 * 60)

      return {
        id: asset.id,
        fileName: asset.file_name,
        mimeType: asset.mime_type,
        sizeBytes: asset.size_bytes,
        altText: asset.alt_text,
        purpose: asset.purpose,
        createdAt: asset.created_at,
        signedUrl: signed?.signedUrl ?? null,
      }
    })
  )

  return assets
}

export async function uploadBusinessAsset(
  formData: FormData
): Promise<ActionResult<{ assetId: string }>> {
  let uploadedPath: string | null = null

  try {
    const { userId } = await requireRole('admin')
    const file = formData.get('file')
    const metadata = metadataSchema.safeParse({
      altText: formData.get('altText'),
      purpose: formData.get('purpose'),
    })

    if (!(file instanceof File)) {
      return { success: false, error: 'Choose an image to upload.' }
    }
    if (!metadata.success) {
      return { success: false, error: 'Check the image details and try again.' }
    }
    if (!supportedImageTypes.has(file.type)) {
      return { success: false, error: 'Use a JPG, PNG, or WebP image.' }
    }
    if (file.size === 0 || file.size > MAX_IMAGE_BYTES) {
      return { success: false, error: 'Images must be between 1 byte and 5 MB.' }
    }

    const extension = supportedImageTypes.get(file.type)!
    uploadedPath = `uploads/${new Date().getUTCFullYear()}/${randomUUID()}-${safeFileName(file.name)}.${extension}`
    const admin = createAdminClient()
    const bytes = Buffer.from(await file.arrayBuffer())

    const { error: storageError } = await admin.storage
      .from('business-assets')
      .upload(uploadedPath, bytes, {
        contentType: file.type,
        cacheControl: '31536000',
        upsert: false,
      })

    if (storageError) {
      return { success: false, error: 'Image upload failed. Please try again.' }
    }

    const { data: asset, error: databaseError } = await admin
      .from('business_assets')
      .insert({
        storage_path: uploadedPath,
        file_name: file.name.slice(0, 180),
        mime_type: file.type,
        size_bytes: file.size,
        alt_text: metadata.data.altText || null,
        purpose: metadata.data.purpose,
        created_by: userId,
      })
      .select('id')
      .single()

    if (databaseError || !asset) {
      await admin.storage.from('business-assets').remove([uploadedPath])
      return { success: false, error: 'Image could not be saved. Please try again.' }
    }

    revalidatePath('/admin/media')
    return { success: true, data: { assetId: asset.id } }
  } catch {
    if (uploadedPath) {
      try {
        await createAdminClient().storage.from('business-assets').remove([uploadedPath])
      } catch {
        // The original error is more useful to the caller than cleanup failure.
      }
    }
    return { success: false, error: 'You are not authorised to upload media.' }
  }
}

export async function deleteBusinessAsset(assetId: string): Promise<ActionResult<undefined>> {
  try {
    await requireRole('admin')
    const idResult = z.string().uuid().safeParse(assetId)
    if (!idResult.success) return { success: false, error: 'Invalid media item.' }

    const admin = createAdminClient()
    const { data: asset, error: findError } = await admin
      .from('business_assets')
      .select('storage_path')
      .eq('id', idResult.data)
      .single()

    if (findError || !asset) return { success: false, error: 'Media item not found.' }

    const { error: storageError } = await admin.storage
      .from('business-assets')
      .remove([asset.storage_path])
    if (storageError) return { success: false, error: 'Could not delete the stored image.' }

    const { error: deleteError } = await admin.from('business_assets').delete().eq('id', idResult.data)
    if (deleteError) return { success: false, error: 'Image was deleted from storage but the library record could not be removed.' }

    revalidatePath('/admin/media')
    return { success: true, data: undefined }
  } catch {
    return { success: false, error: 'You are not authorised to delete media.' }
  }
}
