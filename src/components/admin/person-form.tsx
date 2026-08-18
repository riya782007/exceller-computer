'use client'

import { createCustomer, createStaffUser } from '@/lib/actions/customers'
import { ErrorState } from '@/components/admin/ui-state'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export function PersonForm({
  kind,
}: {
  kind: 'customer' | 'technician'
}): React.ReactElement {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)

  async function onSubmit(formData: FormData): Promise<void> {
    const payload = {
      full_name: String(formData.get('full_name') ?? ''),
      email: String(formData.get('email') ?? ''),
      phone: String(formData.get('phone') ?? ''),
      address: String(formData.get('address') ?? ''),
      role: kind === 'technician' ? 'technician' : 'customer',
    }
    const result = kind === 'technician' ? await createStaffUser(payload) : await createCustomer(payload)
    if (!result.success) {
      setError(result.error)
      return
    }
    router.push(kind === 'technician' ? '/admin/technicians' : '/admin/customers')
    router.refresh()
  }

  return (
    <form action={onSubmit} className="max-w-xl space-y-4 rounded-xl border bg-white p-6">
      {error ? <ErrorState message={error} /> : null}
      <div>
        <Label htmlFor="full_name">Full name</Label>
        <Input id="full_name" name="full_name" required className="mt-1" />
      </div>
      <div>
        <Label htmlFor="phone">Phone</Label>
        <Input id="phone" name="phone" placeholder="+9198XXXXXXXX" className="mt-1" />
      </div>
      <div>
        <Label htmlFor="email">Email {kind === 'technician' ? '(required)' : '(optional if phone provided)'}</Label>
        <Input id="email" name="email" type="email" required={kind === 'technician'} className="mt-1" />
      </div>
      <div>
        <Label htmlFor="address">Address</Label>
        <Input id="address" name="address" className="mt-1" />
      </div>
      <Button type="submit">Save</Button>
    </form>
  )
}
