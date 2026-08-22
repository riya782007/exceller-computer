'use client'

import { useMemo, useState } from 'react'
import { captureLead } from '@/lib/actions/leads'
import { MOBILE_HINT, isValidIndianMobile, normaliseIndianMobile } from '@/lib/utils/indian-mobile'
import {
  formatPriceBand,
  formatTurnaround,
  formatWarranty,
} from '@/lib/catalog/format'
import { buttonClasses } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { CategoryIcon } from '@/components/marketing/category-icon'
import { IconCheck } from '@/components/marketing/icons'

/**
 * Trimmed service shape passed from the server page.
 * Only the fields the estimator renders — the full catalog stays server-side.
 */
export interface EstimatorService {
  key: string
  slug: string
  name: string
  priceMin: number
  priceMax: number
  turnaroundHours: number
  warrantyMonths: number
  deviceTypes: string[]
  brands: string[] | null
}

interface DeviceOption {
  value: string
  label: string
  icon: string
}

interface EstimatorFormProps {
  services: EstimatorService[]
  devices: DeviceOption[]
  brands: string[]
  whatsappBase: string
}

type Step = 'device' | 'brand' | 'issue' | 'result'

export function EstimatorForm({
  services,
  devices,
  brands,
  whatsappBase,
}: EstimatorFormProps) {
  const [device, setDevice] = useState<string>('')
  const [brand, setBrand] = useState<string>('')
  const [serviceKey, setServiceKey] = useState<string>('')
  const [model, setModel] = useState<string>('')
  const [phone, setPhone] = useState<string>('')
  const [phoneError, setPhoneError] = useState<string | null>(null)
  const [saving, setSaving] = useState<boolean>(false)
  const [saved, setSaved] = useState<boolean>(false)

  // Custom PC builds are brand-agnostic, so that step is skipped entirely.
  const needsBrand = device !== '' && device !== 'custom_pc'

  const availableServices = useMemo<EstimatorService[]>(() => {
    if (device === '') return []
    return services.filter((service) => {
      if (!service.deviceTypes.includes(device)) return false
      if (!needsBrand || brand === '') return true
      // A null brands list means the service is brand-agnostic.
      return service.brands === null || service.brands.includes(brand)
    })
  }, [services, device, brand, needsBrand])

  const selected = availableServices.find((s) => s.key === serviceKey)

  const step: Step = useMemo<Step>(() => {
    if (device === '') return 'device'
    if (needsBrand && brand === '') return 'brand'
    if (!selected) return 'issue'
    return 'result'
  }, [device, brand, needsBrand, selected])

  function reset(): void {
    setDevice('')
    setBrand('')
    setServiceKey('')
    setModel('')
    setPhone('')
    setPhoneError(null)
    setSaved(false)
  }

  function handleDevice(value: string): void {
    setDevice(value)
    setBrand('')
    setServiceKey('')
  }

  function handleBrand(value: string): void {
    setBrand(value)
    setServiceKey('')
  }

  const deviceLabel =
    devices.find((d) => d.value === device)?.label ?? device

  function buildMessage(): string {
    const parts = [
      'Hi, I would like a repair estimate.',
      `Device: ${deviceLabel}`,
    ]
    if (brand !== '') parts.push(`Brand: ${brand}`)
    if (model.trim() !== '') parts.push(`Model: ${model.trim()}`)
    if (selected) {
      parts.push(`Issue: ${selected.name}`)
      parts.push(
        `Website estimate: ${formatPriceBand(selected.priceMin, selected.priceMax)}`
      )
    }
    return parts.join('\n')
  }

  const whatsappHref = `${whatsappBase}?text=${encodeURIComponent(buildMessage())}`

  async function handleSendEstimate(): Promise<void> {
    setPhoneError(null)

    if (!isValidIndianMobile(phone)) {
      setPhoneError(MOBILE_HINT)
      return
    }

    setSaving(true)
    const result = await captureLead({
      phone: normaliseIndianMobile(phone),
      device_type: device,
      brand,
      service_interest: selected?.name ?? '',
      issue_summary: model.trim() !== '' ? `Model: ${model.trim()}` : '',
      estimated_value: selected?.priceMax,
      source: 'website_estimator',
    })
    setSaving(false)

    if (!result.success) {
      setPhoneError(result.error)
      return
    }

    setSaved(true)
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
      {/* Progress */}
      <ol className="mb-8 flex items-center gap-2 text-xs font-medium">
        {(
          [
            { id: 'device', label: 'Device' },
            { id: 'brand', label: 'Brand' },
            { id: 'issue', label: 'Issue' },
            { id: 'result', label: 'Estimate' },
          ] as Array<{ id: Step; label: string }>
        )
          .filter((s) => !(s.id === 'brand' && device !== '' && !needsBrand))
          .map((s, index, arr) => {
            const order: Step[] = ['device', 'brand', 'issue', 'result']
            const isDone = order.indexOf(step) > order.indexOf(s.id)
            const isCurrent = step === s.id
            return (
              <li key={s.id} className="flex flex-1 items-center gap-2">
                <span
                  className={cn(
                    'flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-[11px]',
                    isCurrent && 'bg-brand-600 text-white',
                    isDone && 'bg-green-600 text-white',
                    !isCurrent && !isDone && 'bg-gray-200 text-gray-500'
                  )}
                >
                  {isDone ? <IconCheck className="h-3.5 w-3.5" /> : index + 1}
                </span>
                <span
                  className={cn(
                    'hidden sm:inline',
                    isCurrent ? 'text-gray-900' : 'text-gray-500'
                  )}
                >
                  {s.label}
                </span>
                {index < arr.length - 1 ? (
                  <span className="h-px flex-1 bg-gray-200" aria-hidden="true" />
                ) : null}
              </li>
            )
          })}
      </ol>

      {/* Step 1 — device */}
      <fieldset>
        <legend className="text-sm font-semibold text-gray-900">
          1. What type of device is it?
        </legend>
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {devices.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => handleDevice(option.value)}
              aria-pressed={device === option.value}
              className={cn(
                'flex flex-col items-center gap-2 rounded-lg border p-4 text-sm font-medium transition-colors',
                device === option.value
                  ? 'border-brand-600 bg-brand-50 text-brand-700 ring-1 ring-brand-600'
                  : 'border-gray-300 bg-white text-gray-700 hover:border-brand-300 hover:bg-gray-50'
              )}
            >
              <CategoryIcon icon={option.icon} className="h-6 w-6" />
              {option.label}
            </button>
          ))}
        </div>
      </fieldset>

      {/* Step 2 — brand */}
      {needsBrand ? (
        <fieldset className="mt-8">
          <legend className="text-sm font-semibold text-gray-900">
            2. Which brand?
          </legend>
          <div className="mt-3 flex flex-wrap gap-2.5">
            {brands.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => handleBrand(option)}
                aria-pressed={brand === option}
                className={cn(
                  'rounded-lg border px-4 py-2 text-sm font-medium transition-colors',
                  brand === option
                    ? 'border-brand-600 bg-brand-50 text-brand-700 ring-1 ring-brand-600'
                    : 'border-gray-300 bg-white text-gray-700 hover:border-brand-300 hover:bg-gray-50'
                )}
              >
                {option}
              </button>
            ))}
          </div>

          {brand !== '' ? (
            <div className="mt-4 max-w-sm">
              <label
                htmlFor="model"
                className="block text-sm font-medium text-gray-700"
              >
                Model <span className="text-gray-400">(optional)</span>
              </label>
              <input
                id="model"
                type="text"
                value={model}
                onChange={(event) => setModel(event.target.value)}
                placeholder="e.g. Inspiron 15 3520"
                className="mt-1.5 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
              <p className="mt-1.5 text-xs text-gray-500">
                Helps us confirm the exact part and give a tighter price.
              </p>
            </div>
          ) : null}
        </fieldset>
      ) : null}

      {/* Step 3 — issue */}
      {device !== '' && (!needsBrand || brand !== '') ? (
        <fieldset className="mt-8">
          <legend className="text-sm font-semibold text-gray-900">
            {needsBrand ? '3.' : '2.'} What is the problem?
          </legend>
          {availableServices.length === 0 ? (
            <p className="mt-3 rounded-lg bg-amber-50 p-4 text-sm text-amber-900">
              We do not have a standard price band for that combination. Please
              message us on WhatsApp and we will quote it directly.
            </p>
          ) : (
            <div className="mt-3 space-y-2">
              {availableServices.map((option) => (
                <button
                  key={option.key}
                  type="button"
                  onClick={() => setServiceKey(option.key)}
                  aria-pressed={serviceKey === option.key}
                  className={cn(
                    'flex w-full items-center justify-between gap-4 rounded-lg border p-4 text-left transition-colors',
                    serviceKey === option.key
                      ? 'border-brand-600 bg-brand-50 ring-1 ring-brand-600'
                      : 'border-gray-300 bg-white hover:border-brand-300 hover:bg-gray-50'
                  )}
                >
                  <span className="text-sm font-medium text-gray-900">
                    {option.name}
                  </span>
                  <span className="flex-shrink-0 text-sm text-gray-600">
                    {formatPriceBand(option.priceMin, option.priceMax)}
                  </span>
                </button>
              ))}
            </div>
          )}
        </fieldset>
      ) : null}

      {/* Result */}
      {selected ? (
        <div className="mt-8 border-t pt-8">
          <div className="rounded-xl bg-brand-50 p-6 ring-1 ring-brand-200">
            <p className="text-xs font-medium uppercase tracking-wide text-brand-700">
              Estimated cost
            </p>
            <p className="mt-1 text-3xl font-bold text-gray-900">
              {formatPriceBand(selected.priceMin, selected.priceMax)}
            </p>
            <p className="mt-1 text-sm text-gray-600">
              {selected.name}
              {brand !== '' ? ` · ${brand}` : ''}
              {model.trim() !== '' ? ` ${model.trim()}` : ''}
            </p>

            <dl className="mt-5 grid grid-cols-2 gap-4 border-t border-brand-200 pt-5 text-sm">
              <div>
                <dt className="text-gray-600">Turnaround</dt>
                <dd className="mt-0.5 font-semibold text-gray-900">
                  {formatTurnaround(selected.turnaroundHours)}
                </dd>
              </div>
              <div>
                <dt className="text-gray-600">Warranty</dt>
                <dd className="mt-0.5 font-semibold text-gray-900">
                  {formatWarranty(selected.warrantyMonths)}
                </dd>
              </div>
            </dl>
          </div>

          {/* Honest disclaimer — required, not decorative */}
          <p className="mt-4 text-xs leading-relaxed text-gray-500">
            This is an indicative range based on typical cases for this model
            class. The final cost is confirmed only after physical diagnosis, and
            we will always get your approval before starting any work. If the
            actual fault turns out to be different or cheaper, we tell you.
          </p>

          {/* Conversion */}
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <a
              href={whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              className={buttonClasses('whatsapp', 'lg', 'flex-1')}
            >
              Book pickup on WhatsApp
            </a>
            <button
              type="button"
              onClick={reset}
              className={buttonClasses('outline', 'lg')}
            >
              Start over
            </button>
          </div>

          {/* Optional callback */}
          <div className="mt-6 rounded-lg border border-gray-200 bg-gray-50 p-4">
            {saved ? (
              <p className="text-sm text-green-700">
                Thanks — we have your number and will call you shortly. For an
                immediate reply, use the WhatsApp button above.
              </p>
            ) : (
              <>
                <label
                  htmlFor="phone"
                  className="block text-sm font-medium text-gray-900"
                >
                  Prefer a call back?
                </label>
                <div className="mt-2 flex flex-col gap-2 sm:flex-row">
                  <input
                    id="phone"
                    type="tel"
                    inputMode="numeric"
                    autoComplete="tel"
                    value={phone}
                    onChange={(event) => setPhone(event.target.value)}
                    aria-invalid={phoneError !== null}
                    aria-describedby={phoneError ? 'estimator-phone-error' : undefined}
                    placeholder="10-digit mobile number"
                    className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 sm:max-w-xs"
                  />
                  <button
                    type="button"
                    onClick={handleSendEstimate}
                    disabled={saving}
                    className={buttonClasses('secondary', 'md')}
                  >
                    {saving ? 'Sending...' : 'Request call back'}
                  </button>
                </div>
                {phoneError ? (
                  <p id="estimator-phone-error" role="alert" className="mt-2 text-sm font-medium text-red-600">
                    {phoneError}
                  </p>
                ) : null}
              </>
            )}
          </div>
        </div>
      ) : null}
    </div>
  )
}
