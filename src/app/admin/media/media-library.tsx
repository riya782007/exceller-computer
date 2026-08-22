'use client'

import Image from 'next/image'
import { useRef, useState, useTransition } from 'react'
import { deleteBusinessAsset, uploadBusinessAsset, type BusinessAsset } from '@/lib/actions/media'

interface MediaLibraryProps {
  assets: BusinessAsset[]
}

export function MediaLibrary({ assets }: MediaLibraryProps) {
  const formRef = useRef<HTMLFormElement>(null)
  const [isPending, startTransition] = useTransition()
  const [notice, setNotice] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  function handleUpload(formData: FormData) {
    setNotice(null)
    setError(null)
    startTransition(async () => {
      const result = await uploadBusinessAsset(formData)
      if (!result.success) {
        setError(result.error)
        return
      }
      formRef.current?.reset()
      setNotice('Image uploaded to your private media library.')
    })
  }

  function handleDelete(assetId: string) {
    if (!window.confirm('Delete this image permanently? This cannot be undone.')) return
    setNotice(null)
    setError(null)
    startTransition(async () => {
      const result = await deleteBusinessAsset(assetId)
      if (!result.success) {
        setError(result.error)
        return
      }
      setNotice('Image removed from the media library.')
    })
  }

  async function copyImageUrl(url: string | null) {
    if (!url) return
    await navigator.clipboard.writeText(url)
    setNotice('Temporary private image link copied. It expires after one hour.')
  }

  return (
    <div className="space-y-6">
      <form
        ref={formRef}
        action={handleUpload}
        className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
      >
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end">
          <label className="block flex-1">
            <span className="text-sm font-semibold text-slate-900">Image file</span>
            <input
              required
              name="file"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="mt-2 block w-full cursor-pointer rounded-lg border border-slate-300 bg-slate-50 text-sm text-slate-600 file:mr-4 file:cursor-pointer file:border-0 file:bg-brand-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-brand-700 hover:file:bg-brand-100"
            />
            <span className="mt-2 block text-xs text-slate-500">JPG, PNG, or WebP. Maximum 5 MB. Customer and repair images stay private.</span>
          </label>
          <label className="block lg:w-52">
            <span className="text-sm font-semibold text-slate-900">Use</span>
            <select name="purpose" defaultValue="general" className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm">
              <option value="general">General library</option>
              <option value="hero">Homepage hero</option>
              <option value="gallery">Repair gallery</option>
              <option value="service">Service page</option>
              <option value="team">Team / store</option>
            </select>
          </label>
          <label className="block flex-1">
            <span className="text-sm font-semibold text-slate-900">Alt text</span>
            <input name="altText" maxLength={160} placeholder="Describe the image for accessibility" className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
          </label>
          <button disabled={isPending} className="rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60">
            {isPending ? 'Uploading…' : 'Upload image'}
          </button>
        </div>
      </form>

      {error && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
      {notice && <p role="status" className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{notice}</p>}

      {assets.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
          <p className="text-lg font-semibold text-slate-900">Your media library is ready.</p>
          <p className="mt-2 text-sm text-slate-600">Add workshop photos, team photos, repair proof, and approved service imagery here.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {assets.map((asset) => (
            <article key={asset.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="relative aspect-[4/3] bg-slate-100">
                {asset.signedUrl ? (
                  <Image src={asset.signedUrl} alt={asset.altText || asset.fileName} fill sizes="(min-width: 1280px) 30vw, (min-width: 640px) 45vw, 100vw" className="object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center text-sm text-slate-500">Preview unavailable</div>
                )}
              </div>
              <div className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-900">{asset.fileName}</p>
                    <p className="mt-1 text-xs text-slate-500">{asset.purpose} · {Math.max(1, Math.round(asset.sizeBytes / 1024))} KB</p>
                  </div>
                  <button onClick={() => handleDelete(asset.id)} disabled={isPending} className="text-xs font-semibold text-red-600 hover:text-red-800 disabled:opacity-50">Delete</button>
                </div>
                {asset.altText && <p className="mt-3 line-clamp-2 text-xs text-slate-600">{asset.altText}</p>}
                <button onClick={() => copyImageUrl(asset.signedUrl)} disabled={!asset.signedUrl} className="mt-4 text-xs font-semibold text-brand-700 hover:text-brand-900 disabled:opacity-50">Copy private preview link</button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}
