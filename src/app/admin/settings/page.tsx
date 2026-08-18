import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Settings',
}

export default function SettingsPage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="mt-1 text-sm text-gray-600">System configuration and preferences</p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Business Info */}
        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">Business Information</h2>
          <p className="mt-1 text-sm text-gray-500">Your business details used on invoices and communications</p>
          <div className="mt-4 space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-500">Business Name</label>
              <p className="text-sm text-gray-900">Exeller Infosolutions LLP</p>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500">Address</label>
              <p className="text-sm text-gray-900">Opp. Dwarka Mor Metro Station Gate No. 2, Sewak Park, New Delhi – 110059</p>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500">GST Number</label>
              <p className="text-sm text-gray-500 italic">Not configured</p>
            </div>
          </div>
        </div>

        {/* Tax Configuration */}
        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">Tax Configuration</h2>
          <p className="mt-1 text-sm text-gray-500">GST rates for invoice calculations</p>
          <div className="mt-4 space-y-3">
            <div className="flex items-center justify-between border-b pb-2">
              <span className="text-sm text-gray-700">CGST Rate (Intra-state)</span>
              <span className="text-sm font-medium text-gray-900">9%</span>
            </div>
            <div className="flex items-center justify-between border-b pb-2">
              <span className="text-sm text-gray-700">SGST Rate (Intra-state)</span>
              <span className="text-sm font-medium text-gray-900">9%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-700">IGST Rate (Inter-state)</span>
              <span className="text-sm font-medium text-gray-900">18%</span>
            </div>
          </div>
        </div>

        {/* Integration Status */}
        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">Integrations</h2>
          <p className="mt-1 text-sm text-gray-500">External service connections</p>
          <div className="mt-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-700">WhatsApp (Evolution API)</span>
              <span className="inline-flex rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-500">Not Connected</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-700">n8n Automation</span>
              <span className="inline-flex rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-500">Not Connected</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-700">AI Agent</span>
              <span className="inline-flex rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-500">Not Connected</span>
            </div>
          </div>
        </div>

        {/* User Management */}
        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">User Management</h2>
          <p className="mt-1 text-sm text-gray-500">Manage admin and technician accounts</p>
          <div className="mt-4">
            <a
              href="/admin/settings/users"
              className="inline-flex items-center rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Manage Users →
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
