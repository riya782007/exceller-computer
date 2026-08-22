import type { ReactElement } from 'react'
import { resolveIcon } from './icons'

/**
 * Renders a catalog `icon` key as an SVG.
 *
 * The catalog stores a string key rather than a component so it stays a plain
 * serialisable data module; this bridges that key to the icon family.
 */
export function CategoryIcon({
  icon,
  className,
}: {
  icon: string
  className?: string
}): ReactElement {
  const Icon = resolveIcon(icon)
  return <Icon className={className} />
}
