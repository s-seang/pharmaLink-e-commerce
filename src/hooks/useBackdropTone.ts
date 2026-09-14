import { useLayoutEffect, useState, type RefObject } from 'react'

/**
 * Samples whatever is painted behind `ref` and reports whether it is dark or
 * light, so an overlaid control can pick a contrasting colour. Re-samples on
 * scroll and resize, which is what makes it follow a page whose background
 * changes as you move — the navy store band scrolling away under the button,
 * for instance.
 */
export function useBackdropTone(
  ref: RefObject<HTMLElement | null>,
  deps: unknown[] = [],
): 'dark' | 'light' {
  const [tone, setTone] = useState<'dark' | 'light'>('light')

  useLayoutEffect(() => {
    let frame = 0

    const sample = () => {
      frame = 0
      const el = ref.current
      if (!el) return

      const rect = el.getBoundingClientRect()
      if (rect.width === 0) return

      // Hide the control from hit testing so we read what is behind it.
      const previous = el.style.pointerEvents
      el.style.pointerEvents = 'none'
      const behind = document.elementFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2)
      el.style.pointerEvents = previous

      const colour = opaqueBackgroundOf(behind)
      if (!colour) return

      setTone(luminance(colour) < 0.5 ? 'dark' : 'light')
    }

    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(sample)
    }

    // Sample before the first paint, so the lines are never briefly the wrong
    // colour on a page that opens over a dark band.
    sample()
    window.addEventListener('scroll', schedule, { passive: true })
    window.addEventListener('resize', schedule)
    return () => {
      if (frame) cancelAnimationFrame(frame)
      window.removeEventListener('scroll', schedule)
      window.removeEventListener('resize', schedule)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ref, ...deps])

  return tone
}

/** Walk up from `el` until an element actually paints a background. */
function opaqueBackgroundOf(el: Element | null): [number, number, number] | null {
  let node: Element | null = el

  while (node) {
    const parsed = parseColour(getComputedStyle(node).backgroundColor)
    if (parsed && parsed[3] > 0.1) return [parsed[0], parsed[1], parsed[2]]
    node = node.parentElement
  }

  return el ? [255, 255, 255] : null
}

function parseColour(value: string): [number, number, number, number] | null {
  const match = value.match(/rgba?\(([^)]+)\)/)
  if (!match) return null

  const parts = match[1].split(/[,/\s]+/).filter(Boolean).map(Number)
  if (parts.length < 3 || parts.some(Number.isNaN)) return null

  return [parts[0], parts[1], parts[2], parts.length > 3 ? parts[3] : 1]
}

/** Relative luminance, sRGB. */
function luminance([r, g, b]: [number, number, number]): number {
  const channel = (value: number) => {
    const c = value / 255
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  }
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b)
}
