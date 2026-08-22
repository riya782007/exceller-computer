import type { ReactElement, SVGProps } from 'react'

/**
 * Public-site icon family.
 *
 * Emoji were replaced because they render as a different picture on every OS,
 * cannot inherit brand colour or stroke weight, and read as consumer chat rather
 * than a specialist workshop. One 24px grid, 1.6 stroke, round caps.
 *
 * Every icon is decorative by default (`aria-hidden`); pass a `title` only when
 * the icon is the sole label for a control.
 */
export type MarketingIconProps = SVGProps<SVGSVGElement>
export type MarketingIcon = (props: MarketingIconProps) => ReactElement

function Glyph({ children, ...props }: MarketingIconProps & { children: React.ReactNode }): ReactElement {
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

/* ------------------------------------------------------------ service domains */

export function IconDisplay(props: MarketingIconProps): ReactElement {
  return (
    <Glyph {...props}>
      <rect x="2.5" y="4" width="19" height="12.5" rx="2" />
      <path d="M9 20h6M12 16.5V20" />
    </Glyph>
  )
}

export function IconBattery(props: MarketingIconProps): ReactElement {
  return (
    <Glyph {...props}>
      <rect x="2.5" y="7.5" width="16" height="9" rx="2.5" />
      <path d="M21.5 11v2" />
      <path d="M6 11v2M9.5 10v4" />
    </Glyph>
  )
}

export function IconKeyboard(props: MarketingIconProps): ReactElement {
  return (
    <Glyph {...props}>
      <rect x="2.5" y="6.5" width="19" height="11" rx="2" />
      <path d="M6.5 10h.01M10 10h.01M13.5 10h.01M17 10h.01M8 13.8h8" />
    </Glyph>
  )
}

export function IconChip(props: MarketingIconProps): ReactElement {
  return (
    <Glyph {...props}>
      <rect x="7" y="7" width="10" height="10" rx="1.6" />
      <path d="M10 3.5v3M14 3.5v3M10 17.5v3M14 17.5v3M3.5 10h3M3.5 14h3M17.5 10h3M17.5 14h3" />
    </Glyph>
  )
}

export function IconRocket(props: MarketingIconProps): ReactElement {
  return (
    <Glyph {...props}>
      <path d="M13.5 3.6c3.3 1 5.9 3.6 6.9 6.9l-7.6 7.6-5.9-5.9Z" />
      <path d="M7.4 16.6 4.6 19.4M9.6 18.8l-1.4 1.4M5.2 14.4l-1.4 1.4" />
      <circle cx="15.2" cy="8.8" r="1.4" />
    </Glyph>
  )
}

export function IconShieldCheck(props: MarketingIconProps): ReactElement {
  return (
    <Glyph {...props}>
      <path d="M12 21s7-3.2 7-8.6V5.9l-7-2.9-7 2.9v6.5C5 17.8 12 21 12 21Z" />
      <path d="m9.2 12 2 2 3.6-4" />
    </Glyph>
  )
}

export function IconBuilding(props: MarketingIconProps): ReactElement {
  return (
    <Glyph {...props}>
      <path d="M4 20.5V5a1.5 1.5 0 0 1 1.5-1.5h7A1.5 1.5 0 0 1 14 5v15.5" />
      <path d="M14 9.5h4.5A1.5 1.5 0 0 1 20 11v9.5M2.5 20.5h19" />
      <path d="M7 7.5h1M10.5 7.5h1M7 11.5h1M10.5 11.5h1M7 15.5h1M10.5 15.5h1M17 13.5h.01M17 17h.01" />
    </Glyph>
  )
}

export function IconLaptop(props: MarketingIconProps): ReactElement {
  return (
    <Glyph {...props}>
      <path d="M5 5.5h14v10H5z" />
      <path d="M2.5 18.5h19" />
    </Glyph>
  )
}

export function IconDesktop(props: MarketingIconProps): ReactElement {
  return (
    <Glyph {...props}>
      <rect x="4.5" y="3" width="15" height="18" rx="2" />
      <path d="M8 7h8M8 11h5" />
      <circle cx="12" cy="17" r="1.2" />
    </Glyph>
  )
}

export function IconGamepad(props: MarketingIconProps): ReactElement {
  return (
    <Glyph {...props}>
      <path d="M8 8.5h8a5.5 5.5 0 0 1 5.5 5.5v.4a3.1 3.1 0 0 1-5.6 1.8l-.7-1H8.8l-.7 1A3.1 3.1 0 0 1 2.5 14.4V14A5.5 5.5 0 0 1 8 8.5Z" />
      <path d="M7 12h2.4M8.2 10.8v2.4M15.5 11.5h.01M17.3 13.2h.01" />
    </Glyph>
  )
}

/* ------------------------------------------------------------------ assurances */

export function IconBolt(props: MarketingIconProps): ReactElement {
  return (
    <Glyph {...props}>
      <path d="M13.5 3 5.8 13.2a.6.6 0 0 0 .5 1h4.2l-1 6.8 7.7-10.2a.6.6 0 0 0-.5-1h-4.2Z" />
    </Glyph>
  )
}

export function IconWrench(props: MarketingIconProps): ReactElement {
  return (
    <Glyph {...props}>
      <path d="M14.7 6.3a4.5 4.5 0 0 0 5.9 5.9l-8.4 8.4a2.6 2.6 0 0 1-3.7-3.7Z" />
      <path d="m14.7 6.3 3-3a4.5 4.5 0 0 1 3 3l-3 3" />
    </Glyph>
  )
}

export function IconTag(props: MarketingIconProps): ReactElement {
  return (
    <Glyph {...props}>
      <path d="M20.5 12.7 12.8 20.4a2 2 0 0 1-2.8 0L3.6 14a2 2 0 0 1-.6-1.5l.3-6.2a2 2 0 0 1 1.9-1.9l6.2-.3a2 2 0 0 1 1.5.6l6.4 6.4a2 2 0 0 1 0 2.8Z" />
      <circle cx="8.4" cy="8.4" r="1.5" />
    </Glyph>
  )
}

export function IconChat(props: MarketingIconProps): ReactElement {
  return (
    <Glyph {...props}>
      <path d="M20.5 11.6c0 4-3.8 7.2-8.5 7.2a9.6 9.6 0 0 1-2.6-.35L4.8 20.2l1.2-3.3a6.9 6.9 0 0 1-2.5-5.3c0-4 3.8-7.2 8.5-7.2s8.5 3.2 8.5 7.2Z" />
      <path d="M8.8 11.6h.01M12 11.6h.01M15.2 11.6h.01" />
    </Glyph>
  )
}

/* -------------------------------------------------------------------- controls */

export function IconSparkle(props: MarketingIconProps): ReactElement {
  return (
    <Glyph {...props}>
      <path d="M12 3.2 13.6 8a2 2 0 0 0 1.3 1.3l4.8 1.6-4.8 1.6A2 2 0 0 0 13.6 14L12 18.8 10.4 14a2 2 0 0 0-1.3-1.3L4.3 11l4.8-1.6A2 2 0 0 0 10.4 8Z" />
      <path d="M18.5 16.5 19 18l1.5.5-1.5.5-.5 1.5-.5-1.5L16.5 19l1.5-.5Z" />
    </Glyph>
  )
}

export function IconArrowRight(props: MarketingIconProps): ReactElement {
  return (
    <Glyph {...props}>
      <path d="M4.5 12h15M13.5 6l6 6-6 6" />
    </Glyph>
  )
}

export function IconArrowLeft(props: MarketingIconProps): ReactElement {
  return (
    <Glyph {...props}>
      <path d="M19.5 12h-15M10.5 6l-6 6 6 6" />
    </Glyph>
  )
}

export function IconCheck(props: MarketingIconProps): ReactElement {
  return (
    <Glyph {...props}>
      <path d="m4.5 12.5 5 5 10-11" />
    </Glyph>
  )
}

export function IconClose(props: MarketingIconProps): ReactElement {
  return (
    <Glyph {...props}>
      <path d="M6 6l12 12M18 6L6 18" />
    </Glyph>
  )
}

export function IconMic(props: MarketingIconProps): ReactElement {
  return (
    <Glyph {...props}>
      <rect x="9" y="2.8" width="6" height="11" rx="3" />
      <path d="M5.5 11.5a6.5 6.5 0 0 0 13 0M12 18v3.2M9 21.2h6" />
    </Glyph>
  )
}

export function IconStop(props: MarketingIconProps): ReactElement {
  return (
    <Glyph {...props}>
      <rect x="6.5" y="6.5" width="11" height="11" rx="2" fill="currentColor" stroke="none" />
    </Glyph>
  )
}

export function IconSend(props: MarketingIconProps): ReactElement {
  return (
    <Glyph {...props}>
      <path d="M4 11.8 20.2 4.2a.5.5 0 0 1 .7.65L13.3 21a.5.5 0 0 1-.94-.06l-1.5-6.1a1 1 0 0 0-.72-.72l-6.1-1.5A.5.5 0 0 1 4 11.8Z" />
    </Glyph>
  )
}

export function IconPhone(props: MarketingIconProps): ReactElement {
  return (
    <Glyph {...props}>
      <path d="M7.4 3.6h-2A1.9 1.9 0 0 0 3.5 5.7c.5 6.9 5.9 12.3 12.8 12.8a1.9 1.9 0 0 0 2.1-1.9v-2a1.3 1.3 0 0 0-1.1-1.3l-2.4-.4a1.3 1.3 0 0 0-1.3.6l-.6 1a12.4 12.4 0 0 1-4.7-4.7l1-.6a1.3 1.3 0 0 0 .6-1.3l-.4-2.4a1.3 1.3 0 0 0-1.3-1.1Z" />
    </Glyph>
  )
}

export function IconPin(props: MarketingIconProps): ReactElement {
  return (
    <Glyph {...props}>
      <path d="M12 21s6.5-5.6 6.5-10.5a6.5 6.5 0 0 0-13 0C5.5 15.4 12 21 12 21Z" />
      <circle cx="12" cy="10.3" r="2.4" />
    </Glyph>
  )
}

/** WhatsApp brand mark — filled, since it is a recognised logo not a UI glyph. */
export function IconWhatsApp(props: MarketingIconProps): ReactElement {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false" {...props}>
      <path d="M17.5 14.4c-.3-.2-1.8-.9-2-1-.3-.1-.5-.1-.7.2s-.8 1-.9 1.2c-.2.2-.3.2-.6.1s-1.3-.5-2.4-1.5c-.9-.8-1.5-1.8-1.7-2.1-.2-.3 0-.5.1-.6l.5-.5c.1-.2.2-.3.3-.5s0-.4-.1-.5-.6-1.6-.9-2.2c-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4s-1 1-1 2.5 1 2.9 1.2 3.1c.1.2 2 3.2 5 4.5.7.3 1.3.5 1.7.6.7.2 1.4.2 1.9.1.6-.1 1.8-.7 2-1.4.2-.7.2-1.3.2-1.4-.1-.1-.3-.2-.6-.4M12 21.8a9.9 9.9 0 0 1-5-1.4l-.4-.2-3.7 1 1-3.6-.2-.4a9.9 9.9 0 0 1-1.5-5.3C2.2 6.5 6.6 2 12.1 2a9.8 9.8 0 0 1 7 2.9 9.8 9.8 0 0 1 2.9 7c0 5.5-4.5 9.9-10 9.9m8.4-18.3A11.8 11.8 0 0 0 12 0C5.5 0 .2 5.3.2 11.9c0 2.1.5 4.1 1.6 5.9L0 24l6.3-1.7a11.9 11.9 0 0 0 5.7 1.5c6.6 0 11.9-5.3 11.9-11.9a11.8 11.8 0 0 0-3.5-8.4" />
    </svg>
  )
}

/* ------------------------------------------------------------------ icon keys */

/**
 * Stable keys so data modules (the service catalog) can name an icon without
 * importing React — keeping the catalog serialisable and server-safe.
 */
export const MARKETING_ICONS = {
  display: IconDisplay,
  battery: IconBattery,
  keyboard: IconKeyboard,
  chip: IconChip,
  rocket: IconRocket,
  shield: IconShieldCheck,
  building: IconBuilding,
  laptop: IconLaptop,
  desktop: IconDesktop,
  gamepad: IconGamepad,
  bolt: IconBolt,
  wrench: IconWrench,
  tag: IconTag,
  chat: IconChat,
  sparkle: IconSparkle,
} as const

export type MarketingIconKey = keyof typeof MARKETING_ICONS

/** Resolves a catalog icon key, falling back to a neutral glyph. */
export function resolveIcon(key: string | null | undefined): MarketingIcon {
  if (key && key in MARKETING_ICONS) return MARKETING_ICONS[key as MarketingIconKey]
  return IconWrench
}
