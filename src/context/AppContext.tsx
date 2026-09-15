import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { finalPrice, getProduct, getStore, type Store } from '../data'
import { PHNOM_PENH, type Coords } from '../lib/geo'

export interface User {
  name: string
  contact: string
}

export interface CartItem {
  productId: string
  quantity: number
}

/**
 * An add-to-cart that was blocked because it came from a different pharmacy.
 * Held here until the shopper either empties the cart for it or backs out.
 */
export interface CartConflict {
  item: CartItem
  /** The pharmacy the cart already belongs to. */
  current: Store
  /** The pharmacy the blocked product belongs to. */
  next: Store
}

export type AuthTab = 'login' | 'signup'
export type LocationStatus = 'idle' | 'locating' | 'granted' | 'fallback'

interface AppState {
  user: User | null
  login: (contact: string, name?: string) => void
  logout: () => void

  authModal: AuthTab | null
  openAuth: (tab?: AuthTab) => void
  closeAuth: () => void

  cart: CartItem[]
  cartCount: number
  cartTotal: number
  /** A cart holds one pharmacy's products at a time; null when empty. */
  cartStoreId: string | null
  cartStore: Store | undefined
  addToCart: (productId: string, quantity?: number) => void
  setQuantity: (productId: string, quantity: number) => void
  removeFromCart: (productId: string) => void
  clearCart: () => void

  cartOpen: boolean
  openCart: () => void
  closeCart: () => void

  /** Set when an add was blocked; resolve it with one of the two calls below. */
  cartConflict: CartConflict | null
  /** Drop the old pharmacy's items and start the cart over with the new one. */
  confirmCartSwitch: () => void
  cancelCartSwitch: () => void

  favourites: string[]
  toggleFavourite: (productId: string) => void
  isFavourite: (productId: string) => boolean

  coords: Coords
  locationStatus: LocationStatus
  requestLocation: () => void
}

const AppContext = createContext<AppState | null>(null)

const STORAGE_KEY = 'pharmalink.state.v1'

interface Persisted {
  user: User | null
  cart: CartItem[]
  favourites: string[]
}

/**
 * Keep only the lines belonging to the first product's pharmacy. A cart saved
 * before the one-pharmacy rule existed can hold several stores at once.
 */
function singleStore(cart: CartItem[]): CartItem[] {
  const storeId = cart.length > 0 ? getProduct(cart[0].productId)?.storeId : undefined
  if (!storeId) return cart.length > 0 ? [] : cart
  return cart.filter((item) => getProduct(item.productId)?.storeId === storeId)
}

function readPersisted(): Persisted {
  const empty: Persisted = { user: null, cart: [], favourites: [] }
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return empty
    const parsed = JSON.parse(raw) as Partial<Persisted>
    return {
      user: parsed.user ?? null,
      cart: singleStore(Array.isArray(parsed.cart) ? parsed.cart : []),
      favourites: Array.isArray(parsed.favourites) ? parsed.favourites : [],
    }
  } catch {
    return empty
  }
}

/** Turn "sokchanthy@mail.com" or "+855 12 345 678" into a display name. */
function nameFromContact(contact: string): string {
  const trimmed = contact.trim()
  if (trimmed.includes('@')) {
    const handle = trimmed.split('@')[0].replace(/[._-]+/g, ' ')
    return handle.replace(/\b\w/g, (c) => c.toUpperCase())
  }
  return trimmed || 'Member'
}

export function AppProvider({ children }: { children: ReactNode }) {
  const initial = useMemo(() => readPersisted(), [])

  const [user, setUser] = useState<User | null>(initial.user)
  const [cart, setCart] = useState<CartItem[]>(initial.cart)
  const [favourites, setFavourites] = useState<string[]>(initial.favourites)
  const [authModal, setAuthModal] = useState<AuthTab | null>(null)
  const [cartOpen, setCartOpen] = useState(false)
  const [cartConflict, setCartConflict] = useState<CartConflict | null>(null)
  const [coords, setCoords] = useState<Coords>(PHNOM_PENH)
  const [locationStatus, setLocationStatus] = useState<LocationStatus>('idle')

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ user, cart, favourites }))
    } catch {
      // Storage can be unavailable in private mode — state stays in memory only.
    }
  }, [user, cart, favourites])

  const login = useCallback((contact: string, name?: string) => {
    setUser({ name: name?.trim() || nameFromContact(contact), contact })
    setAuthModal(null)
  }, [])

  const logout = useCallback(() => setUser(null), [])

  /** The pharmacy the cart belongs to — every line in it comes from this one store. */
  const cartStoreId = cart.length > 0 ? getProduct(cart[0].productId)?.storeId ?? null : null

  const addToCart = useCallback(
    (productId: string, quantity = 1) => {
      const product = getProduct(productId)
      if (!product) return

      // One pharmacy per order: a product from anywhere else has to wait until
      // the shopper agrees to empty the cart for it.
      if (cartStoreId && product.storeId !== cartStoreId) {
        const current = getStore(cartStoreId)
        const next = getStore(product.storeId)
        if (current && next) {
          setCartConflict({ item: { productId, quantity }, current, next })
          return
        }
      }

      setCart((currentCart) => {
        const existing = currentCart.find((item) => item.productId === productId)
        if (existing) {
          return currentCart.map((item) =>
            item.productId === productId
              ? { ...item, quantity: item.quantity + quantity }
              : item,
          )
        }
        return [...currentCart, { productId, quantity }]
      })
    },
    [cartStoreId],
  )

  /** Empty the cart and start it again with the product that was blocked. */
  const confirmCartSwitch = useCallback(() => {
    if (!cartConflict) return
    setCart([cartConflict.item])
    setCartConflict(null)
  }, [cartConflict])

  const cancelCartSwitch = useCallback(() => setCartConflict(null), [])

  const setQuantity = useCallback((productId: string, quantity: number) => {
    setCart((current) =>
      quantity <= 0
        ? current.filter((item) => item.productId !== productId)
        : current.map((item) => (item.productId === productId ? { ...item, quantity } : item)),
    )
  }, [])

  const removeFromCart = useCallback((productId: string) => {
    setCart((current) => current.filter((item) => item.productId !== productId))
  }, [])

  const toggleFavourite = useCallback((productId: string) => {
    setFavourites((current) =>
      current.includes(productId)
        ? current.filter((id) => id !== productId)
        : [...current, productId],
    )
  }, [])

  const requestLocation = useCallback(() => {
    if (!('geolocation' in navigator)) {
      setLocationStatus('fallback')
      return
    }
    setLocationStatus('locating')
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCoords({ lat: position.coords.latitude, lng: position.coords.longitude })
        setLocationStatus('granted')
      },
      () => {
        // Denied, unavailable or timed out — fall back to central Phnom Penh.
        setCoords(PHNOM_PENH)
        setLocationStatus('fallback')
      },
      { timeout: 8000, maximumAge: 5 * 60 * 1000 },
    )
  }, [])

  const cartCount = cart.reduce((total, item) => total + item.quantity, 0)
  const cartTotal = cart.reduce((total, item) => {
    const product = getProduct(item.productId)
    return product ? total + finalPrice(product) * item.quantity : total
  }, 0)

  const value: AppState = {
    user,
    login,
    logout,
    authModal,
    openAuth: (tab: AuthTab = 'login') => setAuthModal(tab),
    closeAuth: () => setAuthModal(null),
    cart,
    cartCount,
    cartTotal,
    cartStoreId,
    cartStore: cartStoreId ? getStore(cartStoreId) : undefined,
    addToCart,
    setQuantity,
    removeFromCart,
    clearCart: () => setCart([]),
    cartOpen,
    openCart: () => setCartOpen(true),
    closeCart: () => setCartOpen(false),
    cartConflict,
    confirmCartSwitch,
    cancelCartSwitch,
    favourites,
    toggleFavourite,
    isFavourite: (productId: string) => favourites.includes(productId),
    coords,
    locationStatus,
    requestLocation,
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useApp(): AppState {
  const context = useContext(AppContext)
  if (!context) throw new Error('useApp must be used inside <AppProvider>')
  return context
}
