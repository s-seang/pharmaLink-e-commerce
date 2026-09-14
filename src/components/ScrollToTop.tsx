import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

/** Every route change starts at the top, the way a native app would. */
export function ScrollToTop() {
  const { pathname } = useLocation()

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])

  return null
}
