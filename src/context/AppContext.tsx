import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import {
  getProduct,
  getStore,
  type CartLine,
  type Order,
  type Product,
  type Store,
} from '../data'
import { defaultUnitType, hasOptions, itemCategoryFor } from '../lib/itemTypes'
import { itemPrice, roundMoney, type Variant } from '../lib/packaging'
import { DEFAULT_ADDRESS, type DeliveryAddress } from '../lib/delivery'
import { PHNOM_PENH, type Coords } from '../lib/geo'

export interface User {
  name: string
  contact: string
  /** Given at sign-up; the delivery address supplies one otherwise. */
  phone?: string
}

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

/**
 * The product's plain line: no note, no per-shelf extras, the form the product
 * arrives in. This is the line a card's stepper drives.
 *
 * Found by what is *not* on it rather than by which variant it sits on, because
 * the card can now switch that variant itself — pinning this to the whole pack
 * would lose track of the line the moment someone picked a strip.
 */
function plainLine(cart: CartLine[], product: Product): CartLine | undefined {
  const form = defaultUnitType(product)
  return cart.find(
    (item) =>
      item.productId === product.id &&
      !item.note &&
      (item.unitType ?? form) === form &&
      !hasOptions(item),
  )
}

/** What the configurator hands over; the cart supplies the id and the price. */
export type CartDraft = Omit<CartLine, 'lineId' | 'price'> & { price?: number }

/** A pharmacy's basket: its lines, and what they come to. */
export interface StoreCart {
  store: Store
  lines: CartLine[]
  count: number
  total: number
}

export type AuthTab = 'login' | 'signup'
export type LocationStatus = 'idle' | 'locating' | 'granted' | 'fallback'

interface AppState {
  user: User | null
  login: (contact: string, name?: string, phone?: string) => void
  logout: () => void

  authModal: AuthTab | null
  openAuth: (tab?: AuthTab) => void
  closeAuth: () => void

  /** Every line, across every pharmacy. */
  cart: CartLine[]
  /** One basket per pharmacy, each checked out on its own. */
  carts: StoreCart[]
  /** Items across all baskets — what the header badge counts. */
  cartCount: number
  /** The active basket's total. */
  cartTotal: number
  /** Lines in the active basket. */
  cartLines: CartLine[]
  cartStoreId: string | null
  cartStore: Store | undefined
  /** Point the drawer and checkout at a pharmacy's basket. */
  setActiveStore: (storeId: string) => void
  /** Quick add: one whole pack, the default any card's `+` uses. */
  addToCart: (productId: string, quantity?: number) => void
  /** Add a line configured on the product page. */
  addConfigured: (draft: CartDraft) => void
  /** The whole-pack line for a product, which the card steppers drive. */
  defaultLine: (productId: string) => CartLine | undefined
  setQuantity: (lineId: string, quantity: number) => void
  /** Move a line onto another listed variant, keeping its place in the cart. */
  setVariant: (lineId: string, variant: Variant) => void
  removeFromCart: (lineId: string) => void
  clearCart: () => void
  /** Empty one pharmacy's basket, leaving the others alone. */
  clearStoreCart: (storeId: string) => void

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

  favourites: string[]
  toggleFavourite: (productId: string) => void
  isFavourite: (productId: string) => boolean

  coords: Coords
  locationStatus: LocationStatus
  requestLocation: () => void

  /**
   * Ticks once a minute. Whether a pharmacy is open is read off the clock, so
   * without this a shop that closed at 20:00 would keep saying "Open now"
   * until something else happened to re-render the page.
   */
  now: Date
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
      cart: Array.isArray(parsed.cart) ? parsed.cart : [],
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
  /** Which shop's basket the drawer and checkout are working on. */
  const [activeStoreId, setActiveStoreId] = useState<string | null>(null)
  const [coords, setCoords] = useState<Coords>(PHNOM_PENH)
  const [locationStatus, setLocationStatus] = useState<LocationStatus>('idle')
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const tick = window.setInterval(() => setNow(new Date()), 60_000)
    return () => window.clearInterval(tick)
  }, [])

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ user, cart, favourites, orders, address }))
    } catch {
      // Storage can be unavailable in private mode — state stays in memory only.
    }
  }, [user, cart, favourites, orders, address])

  const login = useCallback((contact: string, name?: string, phone?: string) => {
    setUser({
      name: name?.trim() || nameFromContact(contact),
      contact,
      phone: phone?.trim() || undefined,
    })
    setAuthModal(null)
  }, [])

  const logout = useCallback(() => setUser(null), [])

  /**
   * One basket per pharmacy. Orders are placed with a single shop, so the lines
   * are grouped by store and each group is checked out on its own.
   */
  const carts = useMemo(() => {
    const grouped = new Map<string, CartLine[]>()
    for (const item of cart) {
      const storeId = getProduct(item.productId)?.storeId
      if (!storeId) continue
      grouped.set(storeId, [...(grouped.get(storeId) ?? []), item])
    }

    return [...grouped.entries()].flatMap(([storeId, lines]) => {
      const store = getStore(storeId)
      if (!store) return []
      return [
        {
          store,
          lines,
          count: lines.reduce((sum, item) => sum + item.quantity, 0),
          total: lines.reduce((sum, item) => sum + item.price * item.quantity, 0),
        },
      ]
    })
  }, [cart])

  /** The basket being worked on — the only one when there is only one. */
  const cartStoreId =
    (activeStoreId && carts.some((entry) => entry.store.id === activeStoreId)
      ? activeStoreId
      : carts[0]?.store.id) ?? null

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
    [],
  )

  /**
   * One more of whatever the card is showing. That is a whole pack the first
   * time, but the card's own variant picker may have moved the line onto a
   * strip or a sample since — so this tops up that line rather than quietly
   * adding a second one at the listed size.
   */
  const addToCart = useCallback(
    (productId: string, quantity = 1) => {
      const product = getProduct(productId)
      if (!product) return

      const existing = plainLine(cart, product)
      if (existing) {
        setCart((current) =>
          current.map((item) =>
            item.lineId === existing.lineId
              ? { ...item, quantity: item.quantity + quantity }
              : item,
          ),
        )
        return
      }

      addLine({
        productId,
        quantity,
        packaging: 'box',
        units: product.packSize,
        itemCategory: itemCategoryFor(product),
        unitType: defaultUnitType(product),
      })
    },
    [addLine, cart],
  )

  const addConfigured = useCallback((draft: CartDraft) => addLine(draft), [addLine])

  /**
   * The line a card's stepper reads and writes. A part-pack configured on the
   * product page carries a note or extra details, so it is never the one a `+`
   * in a grid changes.
   */
  const defaultLine = useCallback(
    (productId: string) => {
      const product = getProduct(productId)
      return product ? plainLine(cart, product) : undefined
    },
    [cart],
  )

  /**
   * Checkout. There is no payment step and no backend — this records what was
   * bought so the shopper can find the shop again under "Order again", then
   * empties the cart.
   */
  const placeOrder = useCallback(
    (total: number, payment?: string) => {
      const basket = carts.find((entry) => entry.store.id === cartStoreId)
      if (!basket) return undefined

      const order: Order = {
        id: `o-${Date.now()}`,
        storeId: basket.store.id,
        lines: basket.lines.map((item) => ({ ...item })),
        total,
        placedOn: new Date().toISOString(),
        payment,
      }
      const bought = new Set(basket.lines.map((item) => item.lineId))
      setOrders((current) => [order, ...current])
      // Only this shop's basket is spent; anything waiting at another pharmacy
      // is still there afterwards.
      setCart((current) => current.filter((item) => !bought.has(item.lineId)))
      setCartOpen(false)
      return order
    },
    [carts, cartStoreId],
  )

  /**
   * Swap a line onto another of the shop's listed variants, in place. Changing
   * it can make the line identical to one already in the cart, in which case
   * the two fold together rather than sitting there as a duplicate pair.
   */
  const setVariant = useCallback((lineId: string, variant: Variant) => {
    setCart((current) => {
      const target = current.find((item) => item.lineId === lineId)
      if (!target) return current

      const next: CartLine = {
        ...target,
        packaging: variant.kind,
        units: variant.units,
        price: variant.price,
      }
      const twin = current.find(
        (item) =>
          item.lineId !== lineId &&
          item.productId === next.productId &&
          configKey(item) === configKey(next),
      )

      if (!twin) return current.map((item) => (item.lineId === lineId ? next : item))

      return current
        .filter((item) => item.lineId !== lineId)
        .map((item) =>
          item.lineId === twin.lineId
            ? { ...item, quantity: item.quantity + next.quantity }
            : item,
        )
    })
  }, [])

  const setQuantity = useCallback((lineId: string, quantity: number) => {
    setCart((current) =>
      quantity <= 0
        ? current.filter((item) => item.lineId !== lineId)
        : current.map((item) => (item.lineId === lineId ? { ...item, quantity } : item)),
    )
  }, [])

  /** Empty one pharmacy's basket, leaving every other basket standing. */
  const clearStoreCart = useCallback(
    (storeId: string) =>
      setCart((current) =>
        current.filter((item) => getProduct(item.productId)?.storeId !== storeId),
      ),
    [],
  )

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

  const active = carts.find((entry) => entry.store.id === cartStoreId)
  /** The badge counts everything waiting, wherever it is waiting. */
  const cartCount = cart.reduce((total, item) => total + item.quantity, 0)
  const cartLines = active?.lines ?? []
  const cartTotal = active?.total ?? 0

  const setActiveStore = useCallback((storeId: string) => setActiveStoreId(storeId), [])

  const value: AppState = {
    user,
    login,
    logout,
    authModal,
    openAuth: (tab: AuthTab = 'login') => setAuthModal(tab),
    closeAuth: () => setAuthModal(null),
    cart,
    carts,
    cartCount,
    cartLines,
    setActiveStore,
    cartTotal,
    cartStoreId,
    cartStore: cartStoreId ? getStore(cartStoreId) : undefined,
    addToCart,
    addConfigured,
    defaultLine,
    setQuantity,
    setVariant,
    removeFromCart,
    clearCart: () => setCart([]),
    clearStoreCart,
    cartOpen,
    openCart: () => setCartOpen(true),
    closeCart: () => setCartOpen(false),
    address,
    setAddress,
    orders,
    placeOrder,
    favourites,
    toggleFavourite,
    isFavourite: (productId: string) => favourites.includes(productId),
    coords,
    locationStatus,
    requestLocation,
    now,
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useApp(): AppState {
  const context = useContext(AppContext)
  if (!context) throw new Error('useApp must be used inside <AppProvider>')
  return context
}
