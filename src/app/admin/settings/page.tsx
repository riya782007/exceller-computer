import type { Metadata } from 'next'
import Link from 'next/link'
import { PageHeader } from '@/components/admin/ui-state'
import { BUSINESS } from '@/lib/constants'
import { DEFAULT_TAX_CONFIG } from '@/types'

export const metadata: Metadata = {
  title: 'Settings',
}

function flag(enabled: boolean): string {
  return enabled ? 'Configured' : 'Not configured'
}

export default function SettingsPage(): React.ReactElement {
  const integrations = [
    { label: 'Supabase', ok: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) },
    { label: 'WhatsApp (Evolution API)', ok: Boolean(process.env.EVOLUTION_API_URL && process.env.EVOLUTION_API_KEY) },
    { label: 'n8n webhook secret', ok: Boolean(process.env.N8N_WEBHOOK_SECRET) },
    { label: 'OpenAI (agent)', ok: Boolean(process.env.OPENAI_API_KEY) },
  ]

  return (
    <div>
      <PageHeader title="Settings" description="Business constants and whether server integrations are present. Secrets are not displayed." />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold">Business information</h2>
          <div className="mt-4 space-y-3 text-sm">
            <p>{BUSINESS.legalName}</p>
            <p>
              {BUSINESS.address.street}, {BUSINESS.address.area}, {BUSINESS.address.city} – {BUSINESS.address.pincode}
            </p>
            <p>Phone: {process.env.NEXT_PUBLIC_BUSINESS_PHONE ?? BUSINESS.phone}</p>
            <p>GSTIN: {BUSINESS.gst || 'Not set in code yet'}</p>
          </div>
        </div>

        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold">Tax engine</h2>
          <p className="mt-1 text-sm text-gray-500">Rates live in DEFAULT_TAX_CONFIG — do not copy them into screens.</p>
          <div className="mt-4 space-y-2 text-sm">
            <p>CGST {DEFAULT_TAX_CONFIG.cgstRate}%</p>
            <p>SGST {DEFAULT_TAX_CONFIG.sgstRate}%</p>
            <p>IGST {DEFAULT_TAX_CONFIG.igstRate}%</p>
          </div>
        </div>

        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold">Integrations</h2>
          <ul className="mt-4 space-y-2 text-sm">
            {integrations.map((item) => (
              <li key={item.label} className="flex justify-between">
                <span>{item.label}</span>
                <span className={item.ok ? 'text-green-700' : 'text-gray-500'}>{flag(item.ok)}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold">Staff</h2>
          <p className="mt-1 text-sm text-gray-500">Technicians and customers are managed in their own modules.</p>
          <div className="mt-4 flex gap-3 text-sm">
            <Link className="text-brand-700" href="/admin/technicians">
              Technicians
            </Link>
            <Link className="text-brand-700" href="/admin/customers">
              Customers
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
