import { BUSINESS } from '@/lib/constants'
import { createAdminClient } from '@/lib/supabase/admin'
import { logger, redactPhone } from '@/lib/logger'

export interface GroundedFacts {
  store: {
    name: string
    legalName: string
    address: string
    hours: string
    phone: string
  }
  job?: {
    jobCardNumber: string
    status: string
    device: string
    estimatedCost: number | null
  }
  laptops: Array<{
    name: string
    brand: string | null
    sellingPrice: number
    quantity: number
    condition: string | null
  }>
}

export async function loadGroundedFacts(phoneNumber: string, jobCard?: string): Promise<GroundedFacts> {
  const supabase = createAdminClient()
  const facts: GroundedFacts = {
    store: {
      name: BUSINESS.name,
      legalName: BUSINESS.legalName,
      address: `${BUSINESS.address.street}, ${BUSINESS.address.area}, ${BUSINESS.address.city} – ${BUSINESS.address.pincode}`,
      hours: `Mon–Sat ${BUSINESS.hours.weekday}; ${BUSINESS.hours.weekend}`,
      phone: process.env.NEXT_PUBLIC_BUSINESS_PHONE ?? BUSINESS.phone,
    },
    laptops: [],
  }

  const { data: laptops, error: laptopError } = await supabase
    .from('inventory_items')
    .select('name, brand, selling_price, quantity, condition')
    .eq('category', 'refurbished_laptop')
    .eq('is_public', true)
    .gt('quantity', 0)
    .limit(12)

  if (laptopError) {
    logger.error('Failed to load laptop inventory for grounding', { message: laptopError.message })
  } else {
    facts.laptops = (laptops ?? []).map((item) => ({
      name: item.name,
      brand: item.brand,
      sellingPrice: Number(item.selling_price),
      quantity: item.quantity,
      condition: item.condition,
    }))
  }

  const digits = phoneNumber.replace(/[^\d]/g, '')
  let query = supabase.from('repair_jobs').select(
    'job_card_number, status, device_brand, device_model, estimated_cost, customer:profiles!repair_jobs_customer_id_fkey(phone)'
  )

  if (jobCard) {
    query = query.eq('job_card_number', jobCard)
  } else {
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('phone', phoneNumber)
      .maybeSingle()

    if (profile) {
      query = query.eq('customer_id', profile.id).order('created_at', { ascending: false }).limit(1)
    } else {
      logger.info('No profile for WhatsApp grounding', { phone: redactPhone(digits) })
      return facts
    }
  }

  const { data: jobs } = await query
  const job = Array.isArray(jobs) ? jobs[0] : jobs
  if (job) {
    facts.job = {
      jobCardNumber: job.job_card_number,
      status: job.status,
      device: `${job.device_brand} ${job.device_model ?? ''}`.trim(),
      estimatedCost: job.estimated_cost,
    }
  }

  return facts
}
