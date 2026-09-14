import { useEffect, useState } from 'react'

/** True on devices without a hover-capable pointer, e.g. phones and tablets. */
export function useIsTouch(): boolean {
  const [isTouch, setIsTouch] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(hover: none)').matches,
  )

  useEffect(() => {
    const query = window.matchMedia('(hover: none)')
    const update = () => setIsTouch(query.matches)

    update()
    query.addEventListener('change', update)
    return () => query.removeEventListener('change', update)
  }, [])

  return isTouch
}
