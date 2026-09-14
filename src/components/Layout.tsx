import type { ReactNode } from 'react'
import { AuthModal } from './AuthModal'
import { CartDrawer } from './CartDrawer'
import { CartMenuButton } from './CartMenuButton'
import { Footer } from './Footer'
import { Header } from './Header'

/**
 * `header="none"` is used by the pages that draw their own compact top bar
 * instead of the logo + welcome row. They get the floating cart button, since
 * they have no header cart of their own.
 */
export function Layout({
  children,
  header = 'default',
  floatingCart = true,
}: {
  children: ReactNode
  header?: 'default' | 'none'
  /** Store pages set this false — they carry their own bottom cart bar. */
  floatingCart?: boolean
}) {
  return (
    <div className="flex min-h-screen flex-col bg-white">
      {header === 'default' ? <Header /> : floatingCart && <CartMenuButton />}
      <main className="flex-1">{children}</main>
      <Footer />
      <CartDrawer />
      <AuthModal />
    </div>
  )
}
