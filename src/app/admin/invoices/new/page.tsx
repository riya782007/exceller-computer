import type { Metadata } from 'next'
import { InvoiceForm } from '@/components/admin/invoice-form'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export const metadata: Metadata = { title: 'New invoice' }

export default async function NewInvoicePage(): Promise<React.ReactElement> {
  const supabase = await createServerSupabaseClient()
  const [{ data: customers }, { data: jobs }] = await Promise.all([
    supabase.from('profiles').select('id, full_name').eq('role', 'customer').order('full_name'),
    supabase.from('repair_jobs').select('id, job_card_number').order('created_at', { ascending: false }).limit(100),
  ])

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Create GST invoice</h1>
      <InvoiceForm
        customers={(customers ?? []).map((row) => ({ id: row.id, label: row.full_name }))}
        jobs={(jobs ?? []).map((row) => ({ id: row.id, label: row.job_card_number }))}
      />
    </div>
  )
}
