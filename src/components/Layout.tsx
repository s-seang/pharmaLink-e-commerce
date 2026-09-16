import type { ReactNode } from 'react'
import { useApp } from '../context/AppContext'
import { AuthModal } from './AuthModal'
import { CartBar } from './CartBar'
import { CartDrawer } from './CartDrawer'
import { CartMenuButton } from './CartMenuButton'
import { CartStoreDialog } from './CartStoreDialog'
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
  cartBar = false,
  background = 'white',
}: {
  children: ReactNode
  header?: 'default' | 'none'
  /** The ticket receipt needs a tinted page for its cut-out edges to read. */
  background?: 'white' | 'tint'
  /** Store pages set this false — the bottom cart bar already names the store. */
  floatingCart?: boolean
  /**
   * Only a pharmacy's own page opts in. Everywhere else the cart is reached
   * through the icon in the header, so the bar does not follow the shopper
   * around the app — it belongs to the shop they are standing in.
   */
  cartBar?: boolean
}) {
  const { cart } = useApp()
  const showCartBar = cartBar && cart.length > 0

  return (
    <div
      className={`flex min-h-screen flex-col ${background === 'tint' ? 'bg-navy-tint' : 'bg-white'}`}
    >
      {header === 'default' ? <Header /> : floatingCart && <CartMenuButton />}
      {/* The cart bar sits inside main so it can stick to the bottom of the
          screen while the body is in view and settle onto the footer at the
          end of it. */}
      <main className="flex flex-1 flex-col">
        <div className="flex-1">{children}</div>
        {showCartBar && <CartBar />}
      </main>
      <Footer />
      <CartDrawer />
      <CartStoreDialog />
      <AuthModal />
    </div>
  )
}
