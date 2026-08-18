import type { Metadata } from 'next'
import { PersonForm } from '@/components/admin/person-form'

export const metadata: Metadata = { title: 'Add customer' }

export default function NewCustomerPage(): React.ReactElement {
  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Add customer</h1>
      <PersonForm kind="customer" />
    </div>
  )
}
