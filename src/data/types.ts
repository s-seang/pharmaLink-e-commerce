/** What a product is. Shown under "Filter by product" in the header. */
export type Category = 'Medicine' | 'Cosmetic' | 'Supplement' | 'Medical Equipment'

/** What kind of shop sells it. Shown under "Filter by store" in the header. */
export type StoreType = 'Medicine' | 'Pharmacy'

/** Every category that exists in the catalogue. */
export const CATEGORIES: Category[] = ['Medicine', 'Cosmetic', 'Supplement', 'Medical Equipment']

/** The product chips in the header — Medicine is reached through the store filter. */
export const PRODUCT_FILTERS: Category[] = ['Cosmetic', 'Supplement', 'Medical Equipment']

export const STORE_FILTERS: StoreType[] = ['Medicine', 'Pharmacy']

export interface OpeningHours {
  /** Human readable, e.g. "Mon–Sat, 7:00 – 21:00" */
  label: string
  /** 24h clock, used to derive open/closed status. */
  opensAt: number
  closesAt: number
}

export interface Credentials {
  licenceNumber?: string
  degree?: string
  /** Links to scanned proof of studies / licences. */
  documents?: { label: string; url: string }[]
}

export interface Store {
  id: string
  name: string
  branch: string
  type: StoreType
  /** Two-letter mark used by the placeholder logo. */
  initials: string
  logoColor: string
  /** Ratings belong to stores, not products. */
  rating: number
  reviewCount: number
  /** Consultation line — each store supplies its own. */
  phone: string
  address: string
  lat: number
  lng: number
  hours: OpeningHours
  description?: string
  contactPerson?: string
  pharmacist?: string
  credentials?: Credentials
}

export interface Product {
  id: string
  name: string
  /** One-line description used on cards. */
  summary: string
  description: string
  category: Category
  storeId: string
  price: number
  /** Whole-number percentage, e.g. 25 for -25%. */
  discountPercent?: number
  /** Seed for the generated placeholder artwork. */
  imageSeed: number
}
