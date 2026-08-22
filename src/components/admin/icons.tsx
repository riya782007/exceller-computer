import type { ReactElement, SVGProps } from 'react'

/**
 * Hand-built stroke icon set for the operations console.
 *
 * Deliberately not emoji: emoji render differently on every OS, cannot inherit
 * colour or stroke weight, and read as consumer chat rather than business
 * software. These are a single visual family — 24px grid, 1.6 stroke, round
 * caps — so the console looks like one designed product.
 */
export type IconProps = SVGProps<SVGSVGElement>

function Svg({ children, ...props }: IconProps & { children: React.ReactNode }): ReactElement {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      {children}
    </svg>
  )
}

export function IconPulse(props: IconProps): ReactElement {
  return (
    <Svg {...props}>
      <path d="M3 12h3.5l2-5 3 10 2.5-5H21" />
    </Svg>
  )
}

export function IconWrench(props: IconProps): ReactElement {
  return (
    <Svg {...props}>
      <path d="M14.7 6.3a4.5 4.5 0 0 0 5.9 5.9l-8.4 8.4a2.6 2.6 0 0 1-3.7-3.7Z" />
      <path d="m14.7 6.3 3-3a4.5 4.5 0 0 1 3 3l-3 3" />
    </Svg>
  )
}

export function IconBox(props: IconProps): ReactElement {
  return (
    <Svg {...props}>
      <path d="M21 8.5v7a2 2 0 0 1-1 1.7l-7 3.9a2 2 0 0 1-2 0l-7-3.9a2 2 0 0 1-1-1.7v-7a2 2 0 0 1 1-1.7l7-3.9a2 2 0 0 1 2 0l7 3.9a2 2 0 0 1 1 1.7Z" />
      <path d="m3.3 7.5 8.7 4.8 8.7-4.8M12 21v-8.7" />
    </Svg>
  )
}

export function IconUsers(props: IconProps): ReactElement {
  return (
    <Svg {...props}>
      <path d="M15.5 20v-1.6a3.4 3.4 0 0 0-3.4-3.4H6.9a3.4 3.4 0 0 0-3.4 3.4V20" />
      <circle cx="9.5" cy="8" r="3.4" />
      <path d="M20.5 20v-1.6a3.4 3.4 0 0 0-2.6-3.3M16 4.7a3.4 3.4 0 0 1 0 6.6" />
    </Svg>
  )
}

export function IconTarget(props: IconProps): ReactElement {
  return (
    <Svg {...props}>
      <circle cx="12" cy="12" r="8.5" />
      <circle cx="12" cy="12" r="4.5" />
      <circle cx="12" cy="12" r="1" fill="currentColor" stroke="none" />
    </Svg>
  )
}

export function IconTechnician(props: IconProps): ReactElement {
  return (
    <Svg {...props}>
      <path d="M5 20v-1.5A4.5 4.5 0 0 1 9.5 14h5a4.5 4.5 0 0 1 4.5 4.5V20" />
      <circle cx="12" cy="7.5" r="3.5" />
      <path d="M9.2 10.6 12 14l2.8-3.4" />
    </Svg>
  )
}

export function IconReceipt(props: IconProps): ReactElement {
  return (
    <Svg {...props}>
      <path d="M6 3h12a1 1 0 0 1 1 1v16.2a.8.8 0 0 1-1.2.7L15 19.4l-2.4 1.5a1 1 0 0 1-1.1 0L9 19.4l-1.8 1.5a.8.8 0 0 1-1.2-.7V4a1 1 0 0 1 1-1Z" />
      <path d="M9 8h6M9 12h6" />
    </Svg>
  )
}

export function IconImage(props: IconProps): ReactElement {
  return (
    <Svg {...props}>
      <rect x="3.5" y="4.5" width="17" height="15" rx="2.2" />
      <circle cx="9" cy="10" r="1.6" />
      <path d="m4.5 17.5 4.2-4a1.8 1.8 0 0 1 2.5 0l3 3M15 15l1.4-1.3a1.8 1.8 0 0 1 2.5 0l1.1 1" />
    </Svg>
  )
}

export function IconSparkle(props: IconProps): ReactElement {
  return (
    <Svg {...props}>
      <path d="M12 3.2 13.6 8a2 2 0 0 0 1.3 1.3l4.8 1.6-4.8 1.6A2 2 0 0 0 13.6 14L12 18.8 10.4 14a2 2 0 0 0-1.3-1.3L4.3 11l4.8-1.6A2 2 0 0 0 10.4 8Z" />
      <path d="M18.5 16.5 19 18l1.5.5-1.5.5-.5 1.5-.5-1.5L16.5 19l1.5-.5Z" />
    </Svg>
  )
}

export function IconGlobe(props: IconProps): ReactElement {
  return (
    <Svg {...props}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M3.5 12h17M12 3.5c2.2 2.3 3.4 5.3 3.4 8.5S14.2 18.2 12 20.5c-2.2-2.3-3.4-5.3-3.4-8.5S9.8 5.8 12 3.5Z" />
    </Svg>
  )
}

export function IconChat(props: IconProps): ReactElement {
  return (
    <Svg {...props}>
      <path d="M20.5 11.6c0 4-3.8 7.2-8.5 7.2a9.6 9.6 0 0 1-2.6-.35L4.8 20.2l1.2-3.3a6.9 6.9 0 0 1-2.5-5.3c0-4 3.8-7.2 8.5-7.2s8.5 3.2 8.5 7.2Z" />
      <path d="M8.8 11.6h.01M12 11.6h.01M15.2 11.6h.01" />
    </Svg>
  )
}

export function IconSliders(props: IconProps): ReactElement {
  return (
    <Svg {...props}>
      <path d="M5 6h14M5 12h14M5 18h14" />
      <circle cx="9" cy="6" r="2" fill="var(--icon-dot, #fff)" />
      <circle cx="15" cy="12" r="2" fill="var(--icon-dot, #fff)" />
      <circle cx="8" cy="18" r="2" fill="var(--icon-dot, #fff)" />
    </Svg>
  )
}

export function IconBolt(props: IconProps): ReactElement {
  return (
    <Svg {...props}>
      <path d="M13.5 3 5.8 13.2a.6.6 0 0 0 .5 1h4.2l-1 6.8 7.7-10.2a.6.6 0 0 0-.5-1h-4.2Z" />
    </Svg>
  )
}

export function IconPhone(props: IconProps): ReactElement {
  return (
    <Svg {...props}>
      <path d="M7.4 3.6h-2A1.9 1.9 0 0 0 3.5 5.7c.5 6.9 5.9 12.3 12.8 12.8a1.9 1.9 0 0 0 2.1-1.9v-2a1.3 1.3 0 0 0-1.1-1.3l-2.4-.4a1.3 1.3 0 0 0-1.3.6l-.6 1a12.4 12.4 0 0 1-4.7-4.7l1-.6a1.3 1.3 0 0 0 .6-1.3l-.4-2.4a1.3 1.3 0 0 0-1.3-1.1Z" />
    </Svg>
  )
}

export function IconWhatsApp(props: IconProps): ReactElement {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false" {...props}>
      <path d="M17.5 14.4c-.3-.2-1.8-.9-2-1-.3-.1-.5-.1-.7.2s-.8 1-.9 1.2c-.2.2-.3.2-.6.1s-1.3-.5-2.4-1.5c-.9-.8-1.5-1.8-1.7-2.1-.2-.3 0-.5.1-.6l.5-.5c.1-.2.2-.3.3-.5s0-.4-.1-.5-.6-1.6-.9-2.2c-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4s-1 1-1 2.5 1 2.9 1.2 3.1c.1.2 2 3.2 5 4.5.7.3 1.3.5 1.7.6.7.2 1.4.2 1.9.1.6-.1 1.8-.7 2-1.4.2-.7.2-1.3.2-1.4-.1-.1-.3-.2-.6-.4M12 21.8a9.9 9.9 0 0 1-5-1.4l-.4-.2-3.7 1 1-3.6-.2-.4a9.9 9.9 0 0 1-1.5-5.3C2.2 6.5 6.6 2 12.1 2a9.8 9.8 0 0 1 7 2.9 9.8 9.8 0 0 1 2.9 7c0 5.5-4.5 9.9-10 9.9m8.4-18.3A11.8 11.8 0 0 0 12 0C5.5 0 .2 5.3.2 11.9c0 2.1.5 4.1 1.6 5.9L0 24l6.3-1.7a11.9 11.9 0 0 0 5.7 1.5c6.6 0 11.9-5.3 11.9-11.9a11.8 11.8 0 0 0-3.5-8.4" />
    </svg>
  )
}

export function IconArrowRight(props: IconProps): ReactElement {
  return (
    <Svg {...props}>
      <path d="M4.5 12h15M13.5 6l6 6-6 6" />
    </Svg>
  )
}

export function IconPlus(props: IconProps): ReactElement {
  return (
    <Svg {...props}>
      <path d="M12 5v14M5 12h14" />
    </Svg>
  )
}

export function IconCheck(props: IconProps): ReactElement {
  return (
    <Svg {...props}>
      <path d="m4.5 12.5 5 5 10-11" />
    </Svg>
  )
}

export function IconAlert(props: IconProps): ReactElement {
  return (
    <Svg {...props}>
      <path d="M10.3 3.9 2.4 17.5a2 2 0 0 0 1.7 3h15.8a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
      <path d="M12 9.5v4M12 17h.01" />
    </Svg>
  )
}

export function IconClock(props: IconProps): ReactElement {
  return (
    <Svg {...props}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 1.8" />
    </Svg>
  )
}

export function IconShield(props: IconProps): ReactElement {
  return (
    <Svg {...props}>
      <path d="M12 21s7-3.2 7-8.6V5.9l-7-2.9-7 2.9v6.5C5 17.8 12 21 12 21Z" />
      <path d="m9.2 12 2 2 3.6-4" />
    </Svg>
  )
}

export function IconTrendUp(props: IconProps): ReactElement {
  return (
    <Svg {...props}>
      <path d="M3.5 17.5 9 12l3.5 3.5 8-8" />
      <path d="M15.5 7.5h5v5" />
    </Svg>
  )
}

export function IconInbox(props: IconProps): ReactElement {
  return (
    <Svg {...props}>
      <path d="M3.5 13.5 6 5.4a2 2 0 0 1 1.9-1.4h8.2A2 2 0 0 1 18 5.4l2.5 8.1" />
      <path d="M3.5 13.5h4l1.2 2.4h6.6l1.2-2.4h4v4.4a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2Z" />
    </Svg>
  )
}

export function IconLogout(props: IconProps): ReactElement {
  return (
    <Svg {...props}>
      <path d="M14.5 4.5h-8a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h8" />
      <path d="M17 8.5l3.5 3.5L17 15.5M20 12h-9" />
    </Svg>
  )
}

export function IconClose(props: IconProps): ReactElement {
  return (
    <Svg {...props}>
      <path d="M6 6l12 12M18 6L6 18" />
    </Svg>
  )
}

export function IconChevron(props: IconProps): ReactElement {
  return (
    <Svg {...props}>
      <path d="m14 7-5 5 5 5" />
    </Svg>
  )
}
