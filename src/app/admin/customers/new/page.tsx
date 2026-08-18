import type { Metadata } from 'next'
import { PersonForm } from '@/components/admin/person-form'
import { PageHeader } from '@/components/admin/ui-state'

export const metadata: Metadata = { title: 'Add customer' }

export default function NewCustomerPage(): React.ReactElement {
  return (
    <div>
      <PageHeader title="Add customer" description="Creates a customer profile linked to Auth." />
      <PersonForm kind="customer" />
    </div>
  )
}
