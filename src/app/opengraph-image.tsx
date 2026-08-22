import { ImageResponse } from 'next/og'
import { BUSINESS } from '@/lib/constants'

/**
 * Generated share card. Previously every social share rendered as a bare text
 * link, which reads as untrustworthy for a business people hand their laptop to.
 */
export const runtime = 'edge'
export const alt = 'Exeller Computer — laptop and computer repair in Dwarka Mor, New Delhi'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          background: 'linear-gradient(135deg, #0f172a 0%, #1d4ed8 100%)',
          padding: '72px',
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div
            style={{
              width: 68,
              height: 68,
              borderRadius: 20,
              background: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 38,
              fontWeight: 800,
              color: '#1d4ed8',
            }}
          >
            E
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ fontSize: 34, fontWeight: 800, color: '#fff' }}>{BUSINESS.name}</div>
            <div style={{ fontSize: 20, color: '#93c5fd', letterSpacing: 2 }}>DWARKA MOR · NEW DELHI</div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <div style={{ fontSize: 68, fontWeight: 800, color: '#fff', lineHeight: 1.1, maxWidth: 900 }}>
            Repair your device without the uncertainty.
          </div>
          <div style={{ fontSize: 28, color: '#cbd5e1', maxWidth: 820 }}>
            Clear diagnosis, your approval before any work starts, and updates on WhatsApp.
          </div>
        </div>

        <div style={{ display: 'flex', gap: '14px' }}>
          {['Same-day service', 'Up to 1 year warranty', 'Chip-level repair'].map((chip) => (
            <div
              key={chip}
              style={{
                fontSize: 22,
                color: '#fff',
                border: '1px solid rgba(255,255,255,0.28)',
                background: 'rgba(255,255,255,0.1)',
                borderRadius: 999,
                padding: '10px 22px',
              }}
            >
              {chip}
            </div>
          ))}
        </div>
      </div>
    ),
    size
  )
}
