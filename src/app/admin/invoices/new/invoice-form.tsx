'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createInvoice, type InvoiceInput } from '@/lib/actions/invoices'
import { calculateLineAmount, calculateSubtotal, calculateTax } from '@/lib/utils/tax-engine'
import { formatCurrency } from '@/lib/utils'
import type { TaxType } from '@/types'

interface Customer {
  id: string
  full_name: string
  phone: string | null
  email: string | null
}

interface Job {
  id: string
  job_card_number: string
  device_brand: string
  device_model: string | null
  customer_id: string
  status: string
}

interface LineItem {
  id: string
  description: string
  quantity: number
  unit_price: number
  hsn_sac: string
}

interface InvoiceFormProps {
  customers: Customer[]
  jobs: Job[]
}

function generateId(): string {
  return Math.random().toString(36).substring(2, 11)
}

export function InvoiceForm({ customers, jobs }: InvoiceFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<{ invoiceNumber: string; pdfUrl: string | null; warning?: string } | null>(null)

  const [customerId, setCustomerId] = useState('')
  const [jobId, setJobId] = useState('')
  const [taxType, setTaxType] = useState<TaxType>('intra_state')
  const [notes, setNotes] = useState('')
  const [items, setItems] = useState<LineItem[]>([
    { id: generateId(), description: '', quantity: 1, unit_price: 0, hsn_sac: '' },
  ])

  // Filter jobs by selected customer
  const filteredJobs = customerId
    ? jobs.filter((j) => j.customer_id === customerId)
    : jobs

  // Calculate totals in real-time (using same tax engine as server)
  const lineAmounts = items.map((item) =>
    item.quantity > 0 && item.unit_price > 0
      ? calculateLineAmount(item.quantity, item.unit_price)
      : 0
  )

  const subtotal = calculateSubtotal(
    items.map((item) => ({ quantity: item.quantity, unit_price: item.unit_price }))
  )

  const taxCalc = subtotal > 0 ? calculateTax(subtotal, taxType) : null

  // Line item handlers
  const addItem = useCallback(() => {
    setItems((prev) => [
      ...prev,
      { id: generateId(), description: '', quantity: 1, unit_price: 0, hsn_sac: '' },
    ])
  }, [])

  const removeItem = useCallback((id: string) => {
    setItems((prev) => (prev.length > 1 ? prev.filter((i) => i.id !== id) : prev))
  }, [])

  const updateItem = useCallback((id: string, field: keyof LineItem, value: string | number) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    )
  }, [])

  // Submit
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    setLoading(true)

    // Client-side basic validation
    if (!customerId) {
      setError('Please select a customer.')
      setLoading(false)
      return
    }

    const validItems = items.filter((i) => i.description.trim() && i.quantity > 0 && i.unit_price > 0)
    if (validItems.length === 0) {
      setError('Please add at least one item with description, quantity, and price.')
      setLoading(false)
      return
    }

    const input: InvoiceInput = {
      customer_id: customerId,
      job_id: jobId || undefined,
      tax_type: taxType,
      items: validItems.map((i) => ({
        description: i.description.trim(),
        quantity: i.quantity,
        unit_price: i.unit_price,
        hsn_sac: i.hsn_sac.trim() || undefined,
      })),
      notes: notes.trim() || undefined,
    }

    const result = await createInvoice(input)

    setLoading(false)

    if (!result.success) {
      setError(result.error)
      return
    }

    setSuccess({
      invoiceNumber: result.data.invoiceNumber,
      pdfUrl: result.data.pdfUrl,
      warning: result.data.warning,
    })
  }

  if (success) {
    return (
      <div className="max-w-2xl rounded-lg border bg-white p-8 shadow-sm">
        <div className="text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <span className="text-3xl">✅</span>
          </div>
          <h2 className="mt-4 text-xl font-semibold text-gray-900">Invoice Created</h2>
          <p className="mt-2 text-sm text-gray-600">
            Invoice <span className="font-mono font-medium">{success.invoiceNumber}</span> has been created successfully.
          </p>
          {success.warning && (
            <div className="mt-4 rounded-md bg-amber-50 p-3 text-sm text-amber-700">
              ⚠️ {success.warning}
            </div>
          )}
          <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            {success.pdfUrl && (
              <a
                href={success.pdfUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 transition-colors"
              >
                📄 Download PDF
              </a>
            )}
            <button
              onClick={() => {
                setSuccess(null)
                setCustomerId('')
                setJobId('')
                setNotes('')
                setItems([{ id: generateId(), description: '', quantity: 1, unit_price: 0, hsn_sac: '' }])
              }}
              className="inline-flex items-center rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              + Create Another
            </button>
            <button
              onClick={() => router.push('/admin/invoices')}
              className="inline-flex items-center rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              ← Back to Invoices
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-4xl space-y-6">
      {error && (
        <div className="rounded-md bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Customer & Job Selection */}
      <div className="rounded-lg border bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">Customer & Job</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="customer" className="block text-sm font-medium text-gray-700">
              Customer <span className="text-red-500">*</span>
            </label>
            <select
              id="customer"
              value={customerId}
              onChange={(e) => {
                setCustomerId(e.target.value)
                setJobId('')
              }}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
              required
              disabled={loading}
            >
              <option value="">Select customer...</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.full_name} {c.phone ? `(${c.phone})` : ''}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="job" className="block text-sm font-medium text-gray-700">
              Repair Job (optional)
            </label>
            <select
              id="job"
              value={jobId}
              onChange={(e) => setJobId(e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
              disabled={loading || !customerId}
            >
              <option value="">No linked job</option>
              {filteredJobs.map((j) => (
                <option key={j.id} value={j.id}>
                  {j.job_card_number} — {j.device_brand} {j.device_model || ''}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Tax Type */}
      <div className="rounded-lg border bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">Tax Type</h2>
        <div className="flex gap-6">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="tax_type"
              value="intra_state"
              checked={taxType === 'intra_state'}
              onChange={() => setTaxType('intra_state')}
              className="h-4 w-4 text-brand-600 focus:ring-brand-500"
              disabled={loading}
            />
            <span className="text-sm text-gray-700">
              <span className="font-medium">Intra-State</span>
              <span className="ml-1 text-gray-500">(Delhi — CGST 9% + SGST 9%)</span>
            </span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="tax_type"
              value="inter_state"
              checked={taxType === 'inter_state'}
              onChange={() => setTaxType('inter_state')}
              className="h-4 w-4 text-brand-600 focus:ring-brand-500"
              disabled={loading}
            />
            <span className="text-sm text-gray-700">
              <span className="font-medium">Inter-State</span>
              <span className="ml-1 text-gray-500">(IGST 18%)</span>
            </span>
          </label>
        </div>
      </div>

      {/* Line Items */}
      <div className="rounded-lg border bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Items</h2>
          <button
            type="button"
            onClick={addItem}
            className="rounded-md bg-brand-50 px-3 py-1.5 text-sm font-medium text-brand-700 hover:bg-brand-100 transition-colors"
            disabled={loading}
          >
            + Add Item
          </button>
        </div>

        <div className="space-y-3">
          {/* Header */}
          <div className="hidden sm:grid sm:grid-cols-12 sm:gap-2 sm:px-1">
            <div className="col-span-4">
              <span className="text-xs font-medium text-gray-500 uppercase">Description</span>
            </div>
            <div className="col-span-2">
              <span className="text-xs font-medium text-gray-500 uppercase">HSN/SAC</span>
            </div>
            <div className="col-span-2">
              <span className="text-xs font-medium text-gray-500 uppercase">Qty</span>
            </div>
            <div className="col-span-2">
              <span className="text-xs font-medium text-gray-500 uppercase">Unit Price (₹)</span>
            </div>
            <div className="col-span-1 text-right">
              <span className="text-xs font-medium text-gray-500 uppercase">Amount</span>
            </div>
            <div className="col-span-1"></div>
          </div>

          {/* Rows */}
          {items.map((item, index) => (
            <div key={item.id} className="grid grid-cols-1 gap-2 rounded-md border border-gray-100 p-2 sm:grid-cols-12 sm:border-0 sm:p-0">
              <div className="col-span-4">
                <input
                  type="text"
                  placeholder="Service or part description"
                  value={item.description}
                  onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                  className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                  disabled={loading}
                  required
                />
              </div>
              <div className="col-span-2">
                <input
                  type="text"
                  placeholder="HSN/SAC"
                  value={item.hsn_sac}
                  onChange={(e) => updateItem(item.id, 'hsn_sac', e.target.value)}
                  className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                  disabled={loading}
                />
              </div>
              <div className="col-span-2">
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={item.quantity}
                  onChange={(e) => updateItem(item.id, 'quantity', parseInt(e.target.value) || 0)}
                  className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                  disabled={loading}
                  required
                />
              </div>
              <div className="col-span-2">
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={item.unit_price || ''}
                  onChange={(e) => updateItem(item.id, 'unit_price', parseFloat(e.target.value) || 0)}
                  className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                  disabled={loading}
                  required
                />
              </div>
              <div className="col-span-1 flex items-center justify-end">
                <span className="text-sm font-medium text-gray-700">
                  {lineAmounts[index] > 0 ? formatCurrency(lineAmounts[index]) : '—'}
                </span>
              </div>
              <div className="col-span-1 flex items-center justify-end">
                <button
                  type="button"
                  onClick={() => removeItem(item.id)}
                  className="rounded p-1 text-gray-400 hover:text-red-500 transition-colors disabled:opacity-30"
                  disabled={loading || items.length <= 1}
                  aria-label="Remove item"
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Live Totals Preview */}
        {subtotal > 0 && taxCalc && (
          <div className="mt-6 flex justify-end">
            <div className="w-full max-w-xs space-y-1 rounded-lg bg-gray-50 p-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Subtotal</span>
                <span className="font-medium text-gray-900">{formatCurrency(taxCalc.subtotal)}</span>
              </div>
              {taxType === 'intra_state' ? (
                <>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">CGST @ 9%</span>
                    <span className="text-gray-900">{formatCurrency(taxCalc.cgst)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">SGST @ 9%</span>
                    <span className="text-gray-900">{formatCurrency(taxCalc.sgst)}</span>
                  </div>
                </>
              ) : (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">IGST @ 18%</span>
                  <span className="text-gray-900">{formatCurrency(taxCalc.igst)}</span>
                </div>
              )}
              <div className="flex justify-between border-t pt-2 text-base font-bold">
                <span className="text-gray-900">Total</span>
                <span className="text-brand-700">{formatCurrency(taxCalc.total)}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Notes */}
      <div className="rounded-lg border bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">Notes (optional)</h2>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          placeholder="Additional notes for this invoice..."
          className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          disabled={loading}
          maxLength={2000}
        />
      </div>

      {/* Submit */}
      <div className="flex items-center justify-end gap-3">
        <button
          type="button"
          onClick={() => router.push('/admin/invoices')}
          className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          disabled={loading}
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading || !customerId || subtotal <= 0}
          className="rounded-lg bg-brand-600 px-6 py-2 text-sm font-medium text-white shadow-sm hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
        >
          {loading ? 'Creating Invoice...' : 'Create Invoice & Generate PDF'}
        </button>
      </div>
    </form>
  )
}
