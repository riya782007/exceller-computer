import type { Metadata } from 'next'
import { listBusinessAssets } from '@/lib/actions/media'
import { MediaLibrary } from './media-library'

export const metadata: Metadata = {
  title: 'Media Library',
}

export default async function MediaPage() {
  const assets = await listBusinessAssets()

  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-700">Brand control</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">Media Library</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">Keep approved workshop, team, product, and service imagery in one protected place. Nothing here is made public automatically.</p>
        </div>
        <div className="rounded-xl border border-brand-100 bg-brand-50 px-4 py-3 text-sm text-brand-900">
          <strong>{assets.length}</strong> approved assets
        </div>
      </div>
      <MediaLibrary assets={assets} />
    </div>
  )
}
