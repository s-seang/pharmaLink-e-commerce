import { products } from './products'
import { stores } from './stores'
import type { Category, Product, Store, StoreType } from './types'

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

/** Stores are open when the local clock falls inside their hours. */
export function isOpenNow(store: Store, now = new Date()): boolean {
  const hour = now.getHours()
  return hour >= store.hours.opensAt && hour < store.hours.closesAt
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
