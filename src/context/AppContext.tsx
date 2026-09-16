import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { getProduct, getStore, type CartLine, type Order, type Store } from '../data'
import { defaultUnitType, hasOptions, itemCategoryFor } from '../lib/itemTypes'
import { itemPrice, roundMoney } from '../lib/packaging'
import { DEFAULT_ADDRESS, type DeliveryAddress } from '../lib/delivery'
import { PHNOM_PENH, type Coords } from '../lib/geo'

export interface User {
  name: string
  contact: string
}

/** What the configurator hands over; the cart supplies the id and the price. */
export type CartDraft = Omit<CartLine, 'lineId' | 'price'> & { price?: number }

/**
 * An add-to-cart that was blocked because it came from a different pharmacy.
 * Held here until the shopper either empties the cart for it or backs out.
 */
export interface CartConflict {
  item: CartLine
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

  cart: CartLine[]
  cartCount: number
  cartTotal: number
  /** A cart holds one pharmacy's products at a time; null when empty. */
  cartStoreId: string | null
  cartStore: Store | undefined
  /** Quick add: one whole pack, the default any card's `+` uses. */
  addToCart: (productId: string, quantity?: number) => void
  /** Add a line configured on the product page. */
  addConfigured: (draft: CartDraft) => void
  /** The whole-pack line for a product, which the card steppers drive. */
  defaultLine: (productId: string) => CartLine | undefined
  setQuantity: (lineId: string, quantity: number) => void
  removeFromCart: (lineId: string) => void
  clearCart: () => void

  cartOpen: boolean
  openCart: () => void
  closeCart: () => void

  /** Set when an add was blocked; resolve it with one of the two calls below. */
  address: DeliveryAddress
  setAddress: (address: DeliveryAddress) => void

  /** Orders already placed, newest first. Empty until the first checkout. */
  orders: Order[]
  /** Record the cart as an order, then empty it. Total includes delivery. */
  placeOrder: (total: number, payment?: string) => Order | undefined

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
  cart: CartLine[]
  favourites: string[]
  orders: Order[]
  address: DeliveryAddress
}

/**
 * Keep only the lines belonging to the first product's pharmacy. A cart saved
 * before the one-pharmacy rule existed can hold several stores at once.
 */
function singleStore(cart: CartLine[]): CartLine[] {
  const storeId = cart.length > 0 ? getProduct(cart[0].productId)?.storeId : undefined
  if (!storeId) return cart.length > 0 ? [] : cart
  return cart.filter((item) => getProduct(item.productId)?.storeId === storeId)
}

function readPersisted(): Persisted {
  const empty: Persisted = {
    user: null,
    cart: [],
    favourites: [],
    orders: [],
    address: DEFAULT_ADDRESS,
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return empty
    const parsed = JSON.parse(raw) as Partial<Persisted>
    return {
      user: parsed.user ?? null,
      cart: singleStore(Array.isArray(parsed.cart) ? parsed.cart : []),
      favourites: Array.isArray(parsed.favourites) ? parsed.favourites : [],
      orders: Array.isArray(parsed.orders) ? parsed.orders : [],
      address: { ...DEFAULT_ADDRESS, ...(parsed.address ?? {}) },
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
  const [cart, setCart] = useState<CartLine[]>(initial.cart)
  const [favourites, setFavourites] = useState<string[]>(initial.favourites)
  const [orders, setOrders] = useState<Order[]>(initial.orders)
  const [address, setAddress] = useState<DeliveryAddress>(initial.address)
  const [authModal, setAuthModal] = useState<AuthTab | null>(null)
  const [cartOpen, setCartOpen] = useState(false)
  const [cartConflict, setCartConflict] = useState<CartConflict | null>(null)
  const [coords, setCoords] = useState<Coords>(PHNOM_PENH)
  const [locationStatus, setLocationStatus] = useState<LocationStatus>('idle')

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ user, cart, favourites, orders, address }))
    } catch {
      // Storage can be unavailable in private mode — state stays in memory only.
    }
  }, [user, cart, favourites, orders, address])

  const login = useCallback((contact: string, name?: string) => {
    setUser({ name: name?.trim() || nameFromContact(contact), contact })
    setAuthModal(null)
  }, [])

  const logout = useCallback(() => setUser(null), [])

  /** The pharmacy the cart belongs to — every line in it comes from this one store. */
  const cartStoreId = cart.length > 0 ? getProduct(cart[0].productId)?.storeId ?? null : null

  /** Everything that makes two lines the same thing to pick and to price. */
  const configKey = (line: CartLine | CartDraft) =>
    [
      line.packaging,
      line.units,
      line.size ?? '',
      line.note ?? '',
      line.unitType ?? '',
      line.volume ?? '',
      line.skinType ?? '',
      line.dosage ?? '',
      line.perStrip ?? '',
      line.prescription ? 'rx' : '',
      line.symptom ?? '',
    ].join('|')

  /** Same product, same packaging, same form, same note — one line, not two. */
  const sameConfig = (a: CartLine, b: CartDraft) =>
    a.productId === b.productId && configKey(a) === configKey(b)

  const addLine = useCallback(
    (draft: CartDraft) => {
      const product = getProduct(draft.productId)
      if (!product) return

      const line: CartLine = {
        ...draft,
        lineId: `${draft.productId}-${draft.packaging}-${draft.units}-${Date.now()}`,
        price: roundMoney(draft.price ?? itemPrice(product, draft.units)),
      }

      // One pharmacy per order: a product from anywhere else has to wait until
      // the shopper agrees to empty the cart for it.
      if (cartStoreId && product.storeId !== cartStoreId) {
        const current = getStore(cartStoreId)
        const next = getStore(product.storeId)
        if (current && next) {
          setCartConflict({ item: line, current, next })
          return
        }
      }

      setCart((currentCart) => {
        const existing = currentCart.find((item) => sameConfig(item, draft))
        if (existing) {
          return currentCart.map((item) =>
            item.lineId === existing.lineId
              ? { ...item, quantity: item.quantity + draft.quantity }
              : item,
          )
        }
        return [...currentCart, line]
      })
    },
    [cartStoreId],
  )

  /** A whole pack of the listed size — what a card's `+` means. */
  const addToCart = useCallback(
    (productId: string, quantity = 1) => {
      const product = getProduct(productId)
      if (!product) return
      addLine({
        productId,
        quantity,
        packaging: 'box',
        units: product.packSize,
        itemCategory: itemCategoryFor(product),
        unitType: defaultUnitType(product),
      })
    },
    [addLine],
  )

  const addConfigured = useCallback((draft: CartDraft) => addLine(draft), [addLine])

  /**
   * The whole-pack line for a product. Card steppers read and write only this
   * one, so a part-pack configured on the product page is never changed by a
   * `+` somewhere else in a grid.
   */
  const defaultLine = useCallback(
    (productId: string) => {
      const product = getProduct(productId)
      if (!product) return undefined
      const plain = defaultUnitType(product)
      return cart.find(
        (item) =>
          item.productId === productId &&
          item.packaging === 'box' &&
          item.units === product.packSize &&
          !item.note &&
          (item.unitType ?? plain) === plain &&
          !hasOptions(item),
      )
    },
    [cart],
  )

  /** Empty the cart and start it again with the product that was blocked. */
  const confirmCartSwitch = useCallback(() => {
    if (!cartConflict) return
    setCart([cartConflict.item])
    setCartConflict(null)
  }, [cartConflict])

  const cancelCartSwitch = useCallback(() => setCartConflict(null), [])

  /**
   * Checkout. There is no payment step and no backend — this records what was
   * bought so the shopper can find the shop again under "Order again", then
   * empties the cart.
   */
  const placeOrder = useCallback(
    (total: number, payment?: string) => {
      if (cart.length === 0 || !cartStoreId) return undefined
      const order: Order = {
        id: `o-${Date.now()}`,
        storeId: cartStoreId,
        lines: cart.map((item) => ({ ...item })),
        total,
        placedOn: new Date().toISOString(),
        payment,
      }
      setOrders((current) => [order, ...current])
      setCart([])
      setCartOpen(false)
      return order
    },
    [cart, cartStoreId],
  )

  const setQuantity = useCallback((lineId: string, quantity: number) => {
    setCart((current) =>
      quantity <= 0
        ? current.filter((item) => item.lineId !== lineId)
        : current.map((item) => (item.lineId === lineId ? { ...item, quantity } : item)),
    )
  }, [])

  const removeFromCart = useCallback((lineId: string) => {
    setCart((current) => current.filter((item) => item.lineId !== lineId))
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
  const cartTotal = cart.reduce((total, item) => total + item.price * item.quantity, 0)

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
    addConfigured,
    defaultLine,
    setQuantity,
    removeFromCart,
    clearCart: () => setCart([]),
    cartOpen,
    openCart: () => setCartOpen(true),
    closeCart: () => setCartOpen(false),
    address,
    setAddress,
    orders,
    placeOrder,
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
