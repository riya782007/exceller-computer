import type { Metadata } from 'next'
import { PersonForm } from '@/components/admin/person-form'
import { PageHeader } from '@/components/admin/ui-state'

export const metadata: Metadata = { title: 'Add technician' }

export default function NewTechnicianPage(): React.ReactElement {
  return (
    <div>
      <PageHeader title="Add technician" description="Creates a staff login. Share credentials out of band." />
      <PersonForm kind="technician" />
    </div>
  )
}
