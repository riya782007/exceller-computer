'use client'

import { ChangeEvent, useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { SERVICES } from '@/lib/catalog/services'
import { IconImage } from '@/components/admin/icons'
import {
  deletePublicAgentOffer,
  savePublicAgentOffer,
  uploadPublicAgentImage,
  type AgentStudioOffer,
  type AgentStudioState,
} from '@/lib/actions/public-agent'

const emptyForm = {
  title: '',
  summary: '',
  priceNote: '',
  imageUrl: '',
  imagePath: '',
  paymentUrl: '',
  serviceSlug: '',
  ctaLabel: 'View details',
  isActive: true,
}

type OfferForm = typeof emptyForm & { id?: string }

export function AgentStudio({ state }: { state: AgentStudioState }) {
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)
  const [form, setForm] = useState<OfferForm>(emptyForm)
  const [notice, setNotice] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  function setField<K extends keyof OfferForm>(key: K, value: OfferForm[K]) {
    setForm((current) => ({ ...current, [key]: value }))
  }

  function editOffer(offer: AgentStudioOffer) {
    setForm({ id: offer.id, title: offer.title, summary: offer.summary, priceNote: offer.priceNote || '', imageUrl: offer.imageUrl || '', imagePath: offer.imagePath || '', paymentUrl: offer.paymentUrl || '', serviceSlug: offer.serviceSlug || '', ctaLabel: offer.ctaLabel, isActive: offer.isActive })
    setNotice(null)
    setError(null)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function save() {
    setNotice(null)
    setError(null)
    startTransition(async () => {
      let imageUrl = form.imageUrl
      let imagePath = form.imagePath
      const file = fileRef.current?.files?.[0]
      if (file) {
        const uploadData = new FormData()
        uploadData.set('file', file)
        const upload = await uploadPublicAgentImage(uploadData)
        if (!upload.success) {
          setError(upload.error)
          return
        }
        imageUrl = upload.data.imageUrl
        imagePath = upload.data.imagePath
      }

      const result = await savePublicAgentOffer({ ...form, imageUrl, imagePath })
      if (!result.success) {
        setError(result.error)
        return
      }
      setForm(emptyForm)
      if (fileRef.current) fileRef.current.value = ''
      setNotice(form.id ? 'Recommendation updated.' : 'Recommendation is now available to the visitor agent.')
      router.refresh()
    })
  }

  function remove(id: string) {
    if (!window.confirm('Remove this recommendation from the visitor agent?')) return
    setNotice(null)
    setError(null)
    startTransition(async () => {
      const result = await deletePublicAgentOffer(id)
      if (!result.success) {
        setError(result.error)
        return
      }
      if (form.id === id) setForm(emptyForm)
      setNotice('Recommendation removed.')
      router.refresh()
    })
  }

  function handleImageChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (file && file.size > 5 * 1024 * 1024) setError('Use an image smaller than 5 MB.')
  }

  return (
    <div className="space-y-6">
      {!state.schemaReady && <section role="alert" className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm leading-6 text-amber-950"><p className="font-bold">Agent content is not connected yet.</p><p className="mt-1">{state.schemaMessage}</p><p className="mt-2">Until then, visitors can still use reviewed service information and the price estimator, but no custom offers, public images, or payment links can be shown.</p></section>}
      <section className="grid gap-5 lg:grid-cols-[1.15fr_.85fr]">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-start justify-between gap-4"><div><h2 className="text-xl font-black tracking-tight text-slate-950">{form.id ? 'Edit recommendation' : 'Create recommendation'}</h2><p className="mt-1 text-sm leading-6 text-slate-600">Only active items may appear after a relevant visitor question. Use real, approved prices and links only.</p></div>{form.id && <button type="button" onClick={() => setForm(emptyForm)} className="text-sm font-bold text-brand-700 hover:text-brand-900">Cancel edit</button>}</div>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <label className="block sm:col-span-2"><span className="text-sm font-bold text-slate-900">Title</span><input value={form.title} onChange={(event) => setField('title', event.target.value)} maxLength={100} placeholder="Example: SSD speed upgrade" className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100" /></label>
            <label className="block sm:col-span-2"><span className="text-sm font-bold text-slate-900">Visitor-facing explanation</span><textarea value={form.summary} onChange={(event) => setField('summary', event.target.value)} maxLength={500} rows={4} placeholder="Describe who this is useful for, clearly and without unsupported promises." className="mt-2 w-full resize-y rounded-xl border border-slate-300 px-3 py-2.5 text-sm leading-6 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100" /></label>
            <label className="block"><span className="text-sm font-bold text-slate-900">Approved price note</span><input value={form.priceNote} onChange={(event) => setField('priceNote', event.target.value)} maxLength={160} placeholder="Example: From ₹2,999 after compatibility check" className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100" /></label>
            <label className="block"><span className="text-sm font-bold text-slate-900">Related catalog service</span><select value={form.serviceSlug} onChange={(event) => setField('serviceSlug', event.target.value)} className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"><option value="">Any relevant chat</option>{SERVICES.map((service) => <option key={service.slug} value={service.slug}>{service.name}</option>)}</select></label>
            <label className="block"><span className="text-sm font-bold text-slate-900">Public image (optional)</span><input ref={fileRef} onChange={handleImageChange} type="file" accept="image/jpeg,image/png,image/webp" className="mt-2 block w-full cursor-pointer rounded-xl border border-slate-300 bg-slate-50 text-sm text-slate-600 file:mr-3 file:cursor-pointer file:border-0 file:bg-brand-50 file:px-3 file:py-2 file:text-sm file:font-bold file:text-brand-700" /><span className="mt-1 block text-xs text-slate-500">JPG, PNG, or WebP, maximum 5 MB. Uploads to the dedicated public offer bucket.</span></label>
            <label className="block"><span className="text-sm font-bold text-slate-900">or approved image URL</span><input value={form.imageUrl} onChange={(event) => setForm((current) => ({ ...current, imageUrl: event.target.value, imagePath: '' }))} inputMode="url" placeholder="https://…" className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100" /></label>
            <label className="block"><span className="text-sm font-bold text-slate-900">Approved payment / action URL</span><input value={form.paymentUrl} onChange={(event) => setField('paymentUrl', event.target.value)} inputMode="url" placeholder="https://payment-provider.example/…" className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100" /></label>
            <label className="block"><span className="text-sm font-bold text-slate-900">Button label</span><input value={form.ctaLabel} onChange={(event) => setField('ctaLabel', event.target.value)} maxLength={50} className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100" /></label>
          </div>
          <label className="mt-5 flex items-center gap-3 rounded-xl bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-800"><input type="checkbox" checked={form.isActive} onChange={(event) => setField('isActive', event.target.checked)} className="h-4 w-4 rounded border-slate-300 text-brand-700 focus:ring-brand-500" />Show this to visitors when relevant</label>
          <div className="mt-5 flex flex-wrap items-center justify-between gap-4"><p className="max-w-xl text-xs leading-5 text-slate-500">Never upload customer, repair, job-card, or private workshop photos here. Payment links must be verified and HTTPS.</p><button type="button" disabled={pending || !state.schemaReady} onClick={save} className="rounded-xl bg-slate-950 px-5 py-3 text-sm font-bold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50">{pending ? 'Saving…' : form.id ? 'Save changes' : 'Publish recommendation'}</button></div>
        </div>
        <aside className="rounded-3xl bg-slate-950 p-6 text-white"><p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-200">Trust controls</p><h2 className="mt-3 text-2xl font-black tracking-tight">Designed to convert, not overpromise.</h2><ul className="mt-6 space-y-4 text-sm leading-6 text-slate-200"><li><strong className="text-white">Catalog grounding:</strong> The assistant uses reviewed service ranges and always labels them as indicative.</li><li><strong className="text-white">Human approval:</strong> It never confirms a diagnosis, stock position, final quote, job status, or payment.</li><li><strong className="text-white">Privacy boundary:</strong> It cannot see jobs, invoices, WhatsApp conversations, customer records, or private media.</li><li><strong className="text-white">Safe handoff:</strong> Visitors always receive estimator, WhatsApp, and call options.</li></ul></aside>
      </section>
      {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
      {notice && <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{notice}</p>}
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"><div className="flex items-center justify-between gap-4"><div><h2 className="text-xl font-black tracking-tight text-slate-950">Published recommendations</h2><p className="mt-1 text-sm text-slate-600">{state.offers.length} item{state.offers.length === 1 ? '' : 's'} configured</p></div></div>{state.offers.length === 0 ? <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-12 text-center"><p className="font-bold text-slate-900">No custom recommendations yet.</p><p className="mt-2 text-sm text-slate-600">Create one for a verified offer, a product recommendation, or an approved payment flow.</p></div> : <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">{state.offers.map((offer) => <article key={offer.id} className="overflow-hidden rounded-2xl border border-slate-200"><div className="aspect-[16/7] bg-slate-100">{offer.imageUrl ? <img src={offer.imageUrl} alt="" className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center text-slate-300"><IconImage className="h-7 w-7" /></div>}</div><div className="p-4"><div className="flex items-start justify-between gap-3"><h3 className="text-sm font-black text-slate-950">{offer.title}</h3><span className={`rounded-full px-2 py-1 text-[10px] font-bold ${offer.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>{offer.isActive ? 'ACTIVE' : 'HIDDEN'}</span></div><p className="mt-2 line-clamp-3 text-xs leading-5 text-slate-600">{offer.summary}</p>{offer.priceNote && <p className="mt-3 text-xs font-bold text-brand-700">{offer.priceNote}</p>}<div className="mt-4 flex gap-3"><button type="button" onClick={() => editOffer(offer)} disabled={pending} className="text-xs font-bold text-brand-700 hover:text-brand-900 disabled:opacity-50">Edit</button><button type="button" onClick={() => remove(offer.id)} disabled={pending} className="text-xs font-bold text-red-600 hover:text-red-800 disabled:opacity-50">Remove</button></div></div></article>)}</div>}</section>
    </div>
  )
}
