import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { finalPrice, getProduct } from '../data'
import { PHNOM_PENH, type Coords } from '../lib/geo'

export interface User {
  name: string
  contact: string
}

export interface CartItem {
  productId: string
  quantity: number
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
  addToCart: (productId: string, quantity?: number) => void
  setQuantity: (productId: string, quantity: number) => void
  removeFromCart: (productId: string) => void
  clearCart: () => void

  cartOpen: boolean
  openCart: () => void
  closeCart: () => void

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

function readPersisted(): Persisted {
  const empty: Persisted = { user: null, cart: [], favourites: [] }
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return empty
    const parsed = JSON.parse(raw) as Partial<Persisted>
    return {
      user: parsed.user ?? null,
      cart: Array.isArray(parsed.cart) ? parsed.cart : [],
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

  const addToCart = useCallback((productId: string, quantity = 1) => {
    setCart((current) => {
      const existing = current.find((item) => item.productId === productId)
      if (existing) {
        return current.map((item) =>
          item.productId === productId
            ? { ...item, quantity: item.quantity + quantity }
            : item,
        )
      }
      return [...current, { productId, quantity }]
    })
    setCartOpen(true)
  }, [])

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
    addToCart,
    setQuantity,
    removeFromCart,
    clearCart: () => setCart([]),
    cartOpen,
    openCart: () => setCartOpen(true),
    closeCart: () => setCartOpen(false),
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
