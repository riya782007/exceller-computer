import type { Metadata } from 'next'
import { PersonForm } from '@/components/admin/person-form'

export const metadata: Metadata = { title: 'Add technician' }

export default function NewTechnicianPage(): React.ReactElement {
  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Add technician</h1>
      <PersonForm kind="technician" />
    </div>
  )
}
