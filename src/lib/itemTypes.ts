import {
  UNIT_TYPES,
  type CartLine,
  type Category,
  type ItemCategory,
  type Product,
  type ProductUnit,
} from '../data/types'

/**
 * Which shelf a product is bought from, and in what form.
 *
 * The catalogue's own `category` drives filters and search and is too coarse
 * for this — it has one "Cosmetic" bucket holding both serums and lipsticks,
 * and no shelf at all for supplements. So a product may name its own shelf,
 * and everything else falls back to the mapping below.
 */
const FROM_CATEGORY: Record<Category, ItemCategory> = {
  Medicine: 'Medicine',
  // Supplements are swallowed and come in the same strips, bottles and powders
  // as medicine, so they borrow that shelf's forms rather than land in "Other".
  Supplement: 'Medicine',
  Cosmetic: 'Skincare',
  'Medical Equipment': 'Health devices',
}

/** The form a product arrives in, so an untouched add is still specific. */
const BY_UNIT: Partial<Record<ItemCategory, Partial<Record<ProductUnit, string>>>> = {
  Medicine: {
    tablet: 'Strip',
    capsule: 'Strip',
    softgel: 'Strip',
    sachet: 'Sachet (powder)',
    ml: 'Bottle/Syrup',
    g: 'Ointment/Cream tube',
  },
  Skincare: {
    ml: 'Big bottle',
    g: 'Tube',
    piece: 'Sachet',
    item: 'Jar',
  },
  Cosmetics: {
    ml: 'Bottle',
    g: 'Compact',
    item: 'Single piece',
    piece: 'Single piece',
  },
  'Health devices': {
    item: 'Unit (single)',
  },
}

export function itemCategoryFor(product: Product): ItemCategory {
  return product.itemCategory ?? FROM_CATEGORY[product.category]
}

export function unitTypesFor(category: ItemCategory): readonly string[] {
  return UNIT_TYPES[category]
}

export function defaultUnitType(product: Product): string {
  const category = itemCategoryFor(product)
  return product.unitType ?? BY_UNIT[category]?.[product.unit] ?? UNIT_TYPES[category][0]
}

/** Whether a shelf asks anything beyond the unit type. */
export function hasExtraFields(category: ItemCategory): boolean {
  return category === 'Skincare' || category === 'Medicine'
}

/** True once the shopper has filled in any of the optional fields. */
export function hasOptions(line: Pick<CartLine, OptionKey>): boolean {
  return Boolean(
    line.volume ||
      line.skinType ||
      line.dosage ||
      line.perStrip ||
      line.prescription ||
      line.symptom,
  )
}

type OptionKey = 'volume' | 'skinType' | 'dosage' | 'perStrip' | 'prescription' | 'symptom'

/** What a volume is measured in — the product's own unit, where it has one. */
export function volumeUnit(product: Product): 'ml' | 'g' {
  return product.unit === 'g' ? 'g' : 'ml'
}

/**
 * The chosen extras, short enough to sit as chips under a cart line.
 *
 * The form is deliberately not among them. The line above already names it as
 * part of the variant — "Full box · 20 tablets" — and a second label beside it
 * could disagree with that the moment the variant was switched.
 */
export function optionTags(line: CartLine, product: Product): string[] {
  const tags: string[] = []
  if (line.volume) tags.push(`${line.volume} ${volumeUnit(product)}`)
  if (line.skinType) tags.push(`${line.skinType} skin`)
  if (line.dosage) tags.push(line.dosage)
  if (line.perStrip) tags.push(`${line.perStrip} per strip`)
  if (line.prescription) tags.push('Prescription')
  if (line.symptom) tags.push(line.symptom)
  return tags
}
