import type { Metadata } from 'next'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { InvoiceForm } from './invoice-form'

export const metadata: Metadata = {
  title: 'Create Invoice',
}

export default async function NewInvoicePage() {
  const supabase = await createServerSupabaseClient()

  // Fetch customers for the dropdown
  const { data: customers } = await supabase
    .from('profiles')
    .select('id, full_name, phone, email')
    .eq('role', 'customer')
    .eq('is_active', true)
    .order('full_name', { ascending: true })

  // Fetch active repair jobs for the dropdown
  const { data: jobs } = await supabase
    .from('repair_jobs')
    .select('id, job_card_number, device_brand, device_model, customer_id, status')
    .not('status', 'in', '("delivered","cancelled")')
    .order('created_at', { ascending: false })

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Create Invoice</h1>
        <p className="mt-1 text-sm text-gray-600">
          Generate a new GST-compliant tax invoice
        </p>
      </div>

      <InvoiceForm
        customers={customers || []}
        jobs={jobs || []}
      />
    </div>
  )
}
