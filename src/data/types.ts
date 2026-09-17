/** What a product is. Shown under "Filter by product" in the header. */
export type Category = 'Medicine' | 'Cosmetic' | 'Supplement' | 'Medical Equipment'

/**
 * The shelf a cart item is configured against.
 *
 * Deliberately separate from {@link Category}, which is what the catalogue
 * filters and search run on. This one exists for one job: deciding which unit
 * types and which extra fields an item offers as it goes into the cart. A
 * pharmacy sells skincare and make-up out of the same "Cosmetic" aisle, but
 * they are bought in different forms.
 */
export type ItemCategory =
  | 'Skincare'
  | 'Medicine'
  | 'Personal care'
  | 'Baby care'
  | 'Health devices'
  | 'Cosmetics'
  | 'Other'

/** The forms each shelf is sold in. First entry is the fallback default. */
export const UNIT_TYPES: Record<ItemCategory, readonly string[]> = {
  Skincare: [
    'Big bottle',
    'Small bottle',
    'Travel size',
    'Tube',
    'Jar',
    'Sachet',
    'Pump bottle',
    'Spray bottle',
  ],
  Medicine: [
    'Strip',
    'Single tablet',
    'Capsule',
    'Bottle/Syrup',
    'Sachet (powder)',
    'Ampoule/Injection',
    'Inhaler',
    'Ointment/Cream tube',
    'Drops (eye/ear/nose)',
  ],
  'Personal care': ['Bottle', 'Bar', 'Sachet', 'Pack', 'Roll-on', 'Stick', 'Spray'],
  'Baby care': ['Pack', 'Box', 'Bottle', 'Tin (formula)', 'Single diaper', 'Wipe pack'],
  'Health devices': ['Unit (single)', 'Set/Kit', 'Box (e.g. test strips)', 'Refill/Cartridge'],
  Cosmetics: ['Bottle', 'Tube', 'Compact', 'Stick', 'Pencil', 'Palette', 'Single piece'],
  Other: ['Piece'],
}

/** Skincare only — what the shopper is buying it for. */
export const SKIN_TYPES = ['Oily', 'Dry', 'Sensitive', 'Combination'] as const
export type SkinType = (typeof SKIN_TYPES)[number]

/** Medicine only — what it is being taken for. */
export const SYMPTOMS = [
  'Fever',
  'Headache',
  'Cough',
  'Allergy',
  'Stomach',
  'Pain',
  'Skin infection',
] as const
export type Symptom = (typeof SYMPTOMS)[number]

/**
 * What kind of shop this is. Shown under "Filter by store" in the header.
 *
 * A shop is "Skincare" when skincare is the biggest thing it stocks — several
 * of these pharmacies run a real dermatology counter, and that is what someone
 * filtering for skincare is looking for.
 */
export type StoreType = 'Pharmacy' | 'Skincare'

/** Every category that exists in the catalogue. */
export const CATEGORIES: Category[] = ['Medicine', 'Cosmetic', 'Supplement', 'Medical Equipment']

/**
 * The product chips in the header. Medicine is one of them: it used to be
 * reached through the store filter, which no longer has a Medicine chip.
 */
export const PRODUCT_FILTERS: Category[] = [
  'Medicine',
  'Cosmetic',
  'Supplement',
  'Medical Equipment',
]

export const STORE_FILTERS: StoreType[] = ['Pharmacy', 'Skincare']

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
  /**
   * Minutes the shop needs to get an order ready, before any travel. Added to
   * the ride time to give a delivery estimate, and what separates the "Fast
   * delivery" sort from plain "Distance" — the nearest shop is not always the
   * quickest one.
   */
  prepMinutes: number
  /** Running a free-delivery voucher. Surfaced by the "Offers" filter. */
  freeDelivery?: boolean
  /** ABA merchant account money is collected into. Mock, like the rest. */
  abaAccount: string
  /** Consultation line — each store supplies its own. */
  phone: string
  address: string
  lat: number
  lng: number
  hours: OpeningHours
  /**
   * Shut today whatever the hours say — a pharmacist off sick, a closure for
   * stocktaking. Overrides {@link OpeningHours} rather than editing it, so the
   * shop's normal times still show on its page.
   */
  temporarilyClosed?: boolean
  description?: string
  contactPerson?: string
  pharmacist?: string
  credentials?: Credentials
}

/**
 * What one unit of a product is. `item` means it cannot be broken up — a
 * thermometer or a lipstick is sold whole or not at all, which is what keeps
 * "loose pills" off the wrong products.
 */
export type ProductUnit =
  | 'tablet'
  | 'capsule'
  | 'softgel'
  | 'sachet'
  | 'ml'
  | 'g'
  | 'piece'
  | 'item'

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
  /** What one unit of this product is. */
  unit: ProductUnit
  /** How many units the pack that `price` buys contains. */
  packSize: number
  /**
   * The sizes this is sold in, in `unit`, smallest first. Only set where a
   * product genuinely varies — skincare and creams. `packSize` is the middle one.
   */
  sizes?: number[]
  /**
   * Overrides the shelf that would otherwise be derived from `category`, and
   * the form it is offered in by default. Set only where the derivation gets
   * it wrong: a lipstick and a serum are both "Cosmetic" in the catalogue.
   */
  itemCategory?: ItemCategory
  unitType?: string
  /**
   * The forms this product is actually sold in, where its unit cannot say —
   * an inhaler and a tube of ointment are both bought whole.
   */
  unitTypes?: string[]
  /**
   * Forms this shop has run out of. They still show in the variant list, so a
   * shopper can see the shop stocks them, but cannot be picked. Mock, like the
   * prices — there is no stock system behind this app.
   */
  soldOut?: PackagingKind[]
  /** Seed for the generated placeholder artwork. */
  imageSeed: number
}

/** How a product was broken up for one cart line. */
export type PackagingKind = 'box' | 'strip' | 'loose' | 'custom'

/**
 * One configured line in the cart or on an order.
 *
 * Keyed by `lineId`, not by product: the same paracetamol can sit in the cart
 * twice — a full box and five loose tablets — because they are different things
 * to pick and to price. `price` is the cost of one of these, frozen when it was
 * added, so a later change to the catalogue cannot silently reprice a cart.
 */
export interface CartLine {
  lineId: string
  productId: string
  /** How many of this configured item. */
  quantity: number
  packaging: PackagingKind
  /** Units in one item — tablets, millilitres, pieces. */
  units: number
  /** Chosen size in the product's unit, where the product has sizes. */
  size?: number
  /** Anything the shopper asked the pharmacy for. */
  note?: string
  /** Price of one configured item. */
  price: number

  /**
   * The shelf this was configured against and the form chosen from it. Both
   * come from {@link UNIT_TYPES}; they describe what is being handed over, and
   * leave the price to `packaging` and `units`.
   *
   * Optional because a cart saved before this existed has neither.
   */
  itemCategory?: ItemCategory
  unitType?: string

  /** Skincare extras. */
  volume?: number
  skinType?: SkinType

  /** Medicine extras. */
  dosage?: string
  perStrip?: number
  prescription?: boolean
  symptom?: Symptom
}

/**
 * An order the shopper has placed. Written by checkout and kept in
 * `localStorage`; there is no backend to hold it. One store per order, by the
 * same one-pharmacy rule the cart follows.
 */
export interface Order {
  id: string
  storeId: string
  lines: CartLine[]
  /** What was actually paid, delivery included. */
  total: number
  /** ISO timestamp, used to order the list and to show "last ordered". */
  placedOn: string
  /** How it was paid for, as shown on the receipt. */
  payment?: string
}
