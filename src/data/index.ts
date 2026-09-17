import { products } from './products'
import { stores } from './stores'
import type { Category, Order, Product, Store, StoreType } from './types'

export { products, stores }
export * from './types'

export function getStore(id: string | undefined): Store | undefined {
  return stores.find((s) => s.id === id)
}

export function getProduct(id: string | undefined): Product | undefined {
  return products.find((p) => p.id === id)
}

export function productsByStore(storeId: string): Product[] {
  return products.filter((p) => p.storeId === storeId)
}

export function productsInCategory(category: Category): Product[] {
  return products.filter((p) => p.category === category)
}

export function storesOfType(type: StoreType): Store[] {
  return stores.filter((s) => s.type === type)
}

export function discountedProducts(): Product[] {
  return products.filter((p) => (p.discountPercent ?? 0) > 0)
}

/** Price after any discount has been applied. */
export function finalPrice(product: Product): number {
  if (!product.discountPercent) return product.price
  return product.price * (1 - product.discountPercent / 100)
}

export function formatPrice(value: number): string {
  return `$${value.toFixed(2)}`
}

/** The rating shown against a product is the rating of the store selling it. */
export function storeRating(product: Product): number {
  return getStore(product.storeId)?.rating ?? 0
}

/**
 * Open shops before closed ones, for any list that suggests a pharmacy.
 *
 * Only ever the first tiebreak: whatever the list was ranked by — distance,
 * rating, last ordered — still decides the order within each group, so a
 * closed shop is pushed down the list rather than out of it.
 */
export function openFirst(a: Store, b: Store, now = new Date()): number {
  return Number(isOpenNow(b, now)) - Number(isOpenNow(a, now))
}

/** Open when the local clock falls inside the shop's hours, and it is not shut. */
export function isOpenNow(store: Store, now = new Date()): boolean {
  if (store.temporarilyClosed) return false
  const hour = now.getHours()
  return hour >= store.hours.opensAt && hour < store.hours.closesAt
}

/**
 * When a shut shop takes orders again — "07:00" later today, or "Fri, 07:00"
 * once the day has turned over.
 *
 * Undefined for a shop closed off-schedule: there is no hour to promise, only
 * the times it normally keeps.
 */
export function nextOpening(store: Store, now = new Date()): string | undefined {
  if (store.temporarilyClosed) return undefined

  const opens = new Date(now)
  opens.setHours(store.hours.opensAt, 0, 0, 0)
  if (opens <= now) opens.setDate(opens.getDate() + 1)

  const time = `${String(store.hours.opensAt).padStart(2, '0')}:00`
  return opens.getDate() === now.getDate()
    ? time
    : `${opens.toLocaleDateString(undefined, { weekday: 'short' })}, ${time}`
}

/**
 * Every word in the query has to appear somewhere in the product's text, so
 * "bio derma sleeping mask" still finds "Bioderma Hydrabio Sleeping Mask" —
 * and finds it at each store that lists it.
 */
export function searchProducts(query: string, list: Product[] = products): Product[] {
  const tokens = query.trim().toLowerCase().split(/\s+/).filter(Boolean)
  if (tokens.length === 0) return list

  return list.filter((product) => {
    const store = getStore(product.storeId)
    const haystack = [
      product.name,
      product.summary,
      product.description,
      product.category,
      store?.name ?? '',
      store?.branch ?? '',
    ]
      .join(' ')
      .toLowerCase()

    return tokens.every((token) => haystack.includes(token))
  })
}

/** Similar products: same category, different product, nearest price first. */
export function similarProducts(product: Product, limit = 8): Product[] {
  return products
    .filter((p) => p.id !== product.id && p.name !== product.name && p.category === product.category)
    .sort((a, b) => Math.abs(a.price - product.price) - Math.abs(b.price - product.price))
    .slice(0, limit)
}

/** The same product listed by other stores, cheapest first. */
export function otherStoresFor(product: Product): Product[] {
  return products
    .filter((p) => p.id !== product.id && p.name === product.name)
    .sort((a, b) => finalPrice(a) - finalPrice(b))
}

/**
 * Shops ordered from before, most recent first and each listed once, with the
 * date they were last ordered from. Empty until the shopper actually checks
 * out — nothing seeds it.
 */
export function orderedStores(orders: Order[]): { store: Store; lastOrderedOn: string }[] {
  const seen = new Set<string>()
  const result: { store: Store; lastOrderedOn: string }[] = []
  for (const order of [...orders].sort((a, b) => b.placedOn.localeCompare(a.placedOn))) {
    if (seen.has(order.storeId)) continue
    const store = getStore(order.storeId)
    if (!store) continue
    seen.add(order.storeId)
    result.push({ store, lastOrderedOn: order.placedOn })
  }
  return result
}

/** The deepest discount a shop is running, for its "up to X% off" badge. */
export function bestDiscount(storeId: string): number {
  return productsByStore(storeId).reduce((best, p) => Math.max(best, p.discountPercent ?? 0), 0)
}

/**
 * What to put in front of someone revisiting a shop: whatever is on offer
 * first, biggest saving leading, then the rest of the shelf. Not what they
 * bought last time — they are browsing the shop again, not repeating a box of
 * paracetamol.
 */
export function topPicks(storeId: string, limit = 8): Product[] {
  return productsByStore(storeId)
    .slice()
    .sort((a, b) => (b.discountPercent ?? 0) - (a.discountPercent ?? 0) || a.price - b.price)
    .slice(0, limit)
}

/** Whether a shop stocks anything in a product category. */
export function stocksCategory(store: Store, category: Category): boolean {
  return products.some((p) => p.storeId === store.id && p.category === category)
}

/** The category a shop stocks most of — what kind of shop it reads as. */
export function leadingCategory(store: Store): Category | undefined {
  const counts = new Map<Category, number>()
  for (const product of productsByStore(store.id)) {
    counts.set(product.category, (counts.get(product.category) ?? 0) + 1)
  }
  let leader: Category | undefined
  let best = 0
  for (const [category, count] of counts) {
    if (count > best) {
      best = count
      leader = category
    }
  }
  return leader
}
