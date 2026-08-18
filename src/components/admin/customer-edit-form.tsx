'use client'

import { updateCustomer } from '@/lib/actions/customers'
import { ErrorState, SuccessState } from '@/components/admin/ui-state'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export function CustomerEditForm({
  customer,
}: {
  customer: { id: string; full_name: string; email: string | null; phone: string | null; address: string | null }
}): React.ReactElement {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  async function onSubmit(formData: FormData): Promise<void> {
    setError(null)
    setSuccess(null)
    const result = await updateCustomer(customer.id, {
      full_name: String(formData.get('full_name') ?? ''),
      email: String(formData.get('email') ?? ''),
      phone: String(formData.get('phone') ?? ''),
      address: String(formData.get('address') ?? ''),
    })
    if (!result.success) {
      setError(result.error)
      return
    }
    setSuccess('Customer saved')
    router.refresh()
  }

  return (
    <form action={onSubmit} className="max-w-xl space-y-4 rounded-xl border bg-white p-6">
      {error ? <ErrorState message={error} /> : null}
      {success ? <SuccessState message={success} /> : null}
      <div>
        <Label htmlFor="full_name">Full name</Label>
        <Input id="full_name" name="full_name" required defaultValue={customer.full_name} className="mt-1" />
      </div>
      <div>
        <Label htmlFor="phone">Phone</Label>
        <Input id="phone" name="phone" defaultValue={customer.phone ?? ''} className="mt-1" />
      </div>
      <div>
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" defaultValue={customer.email ?? ''} className="mt-1" />
      </div>
      <div>
        <Label htmlFor="address">Address</Label>
        <Input id="address" name="address" defaultValue={customer.address ?? ''} className="mt-1" />
      </div>
      <Button type="submit">Save customer</Button>
    </form>
  )
}
