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
  'Personal care': 'Personal care',
}

/**
 * The forms a product can honestly be sold in, by what one unit of it is.
 *
 * A shelf's full vocabulary is far wider than any one product: paracetamol
 * belongs to the medicine shelf, but it is not an inhaler and never comes as
 * eye drops. The unit is what decides — tablets come in strips and boxes, a
 * syrup comes in a bottle, a cream comes in a tube — so only those are offered.
 * The first entry is what the product defaults to.
 */
const BY_UNIT: Partial<Record<ItemCategory, Partial<Record<ProductUnit, readonly string[]>>>> = {
  Medicine: {
    tablet: ['Strip', 'Single tablet', 'Box'],
    capsule: ['Strip', 'Capsule', 'Box'],
    softgel: ['Strip', 'Capsule', 'Box'],
    sachet: ['Sachet (powder)', 'Box'],
    ml: ['Bottle/Syrup'],
    g: ['Ointment/Cream tube'],
    piece: ['Strip', 'Box'],
  },
  Skincare: {
    ml: ['Big bottle', 'Small bottle', 'Travel size', 'Pump bottle', 'Spray bottle'],
    g: ['Tube', 'Jar'],
    piece: ['Sachet'],
    item: ['Jar', 'Tube'],
  },
  Cosmetics: {
    ml: ['Bottle'],
    g: ['Compact', 'Palette'],
    item: ['Single piece', 'Stick', 'Pencil'],
    piece: ['Single piece'],
  },
  'Health devices': {
    item: ['Unit (single)', 'Set/Kit'],
    piece: ['Box (e.g. test strips)', 'Refill/Cartridge'],
  },
  'Personal care': {
    ml: ['Bottle', 'Spray'],
    g: ['Stick', 'Bar'],
    piece: ['Pack', 'Sachet'],
    item: ['Bottle', 'Roll-on'],
  },
}

export function itemCategoryFor(product: Product): ItemCategory {
  return product.itemCategory ?? FROM_CATEGORY[product.category]
}

/**
 * What this product can be asked for. A product may name its own forms where
 * the unit alone cannot tell — an inhaler and a suppository are both "item".
 */
export function unitTypesFor(product: Product): readonly string[] {
  const category = itemCategoryFor(product)
  if (product.unitTypes) return product.unitTypes

  // A product that names a form its unit would not have guessed knows better
  // than the unit does — a collagen powder is measured in grams but comes in
  // sachets, not in the cream tube the gram mapping would offer.
  const byUnit = BY_UNIT[category]?.[product.unit]
  if (product.unitType && !byUnit?.includes(product.unitType)) return [product.unitType]

  return byUnit ?? UNIT_TYPES[category]
}

export function defaultUnitType(product: Product): string {
  return product.unitType ?? unitTypesFor(product)[0]
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
