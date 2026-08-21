import type { ReactElement } from 'react'
import type { ServiceFaq } from '@/lib/catalog/services'

interface FaqAccordionProps {
  faqs: ServiceFaq[]
}

/**
 * Accordion built on native <details>/<summary>.
 *
 * Intentionally not a client component: this needs no JavaScript, so it works
 * before hydration, adds nothing to the bundle, and gets keyboard handling and
 * screen-reader semantics from the browser for free. Search engines also index
 * the answer text regardless of open state.
 */
export function FaqAccordion({ faqs }: FaqAccordionProps): ReactElement {
  return (
    <div className="divide-y divide-gray-200 overflow-hidden rounded-xl border border-gray-200 bg-white">
      {faqs.map((faq) => (
        <details key={faq.question} className="group">
          <summary className="flex cursor-pointer items-start justify-between gap-4 p-5 text-left font-medium text-gray-900 marker:content-none hover:bg-gray-50 [&::-webkit-details-marker]:hidden">
            <span className="text-sm sm:text-base">{faq.question}</span>
            <svg
              className="mt-0.5 h-5 w-5 flex-shrink-0 text-gray-400 transition-transform group-open:rotate-180"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </summary>
          <div className="px-5 pb-5 text-sm leading-relaxed text-gray-600">
            {faq.answer}
          </div>
        </details>
      ))}
    </div>
  )
}

/**
 * FAQPage structured data. Google renders these as expandable results, which
 * measurably increases click-through on service queries.
 */
export function FaqJsonLd({ faqs }: FaqAccordionProps): ReactElement {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'FAQPage',
          mainEntity: faqs.map((faq) => ({
            '@type': 'Question',
            name: faq.question,
            acceptedAnswer: {
              '@type': 'Answer',
              text: faq.answer,
            },
          })),
        }),
      }}
    />
  )
}
