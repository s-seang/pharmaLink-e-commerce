import type { PackagingKind, Product, ProductUnit } from '../data/types'

export interface PackagingOption {
  kind: PackagingKind
  label: string
  /** The form on its own, without the amount — "Strip", "Full bottle". */
  short: string
  /** Units in one of these. Undefined when the shopper types the amount. */
  units?: number
  /** Smallest and largest amount accepted when the shopper types it. */
  min?: number
  max?: number
  /** Default amount to show in the input. */
  suggested?: number
  note: string
}

/** Units that can be counted out one at a time. */
const COUNTED: ProductUnit[] = ['tablet', 'capsule', 'softgel', 'sachet', 'piece']
/** Units measured by volume or weight, so any amount can be decanted. */
const MEASURED: ProductUnit[] = ['ml', 'g']

export function isCounted(unit: ProductUnit): boolean {
  return COUNTED.includes(unit)
}

export function isMeasured(unit: ProductUnit): boolean {
  return MEASURED.includes(unit)
}

/** "tablet" / "tablets", "ml" either way. */
export function unitLabel(unit: ProductUnit, count: number): string {
  if (unit === 'ml' || unit === 'g') return unit
  if (unit === 'item') return count === 1 ? 'item' : 'items'
  return count === 1 ? unit : `${unit}s`
}

/** The word for the whole pack, so labels read right per product. */
function packWord(unit: ProductUnit): string {
  if (unit === 'ml') return 'bottle'
  if (unit === 'g') return 'tube'
  if (unit === 'sachet') return 'box'
  if (unit === 'piece') return 'pack'
  if (unit === 'item') return 'item'
  return 'box'
}

/**
 * What a shop will actually break this product into.
 *
 * Driven by the product's own unit, so the options stay honest: a blood
 * pressure monitor is one indivisible item and never offers "loose pills", a
 * strip of tablets is counted out, and a serum is decanted by millilitre.
 */
export function packagingFor(product: Product, size = product.packSize): PackagingOption[] {
  const { unit } = product

  if (unit === 'item') {
    return [
      {
        kind: 'box',
        units: 1,
        label: 'Single item',
        short: 'Single item',
        note: 'Sold whole — cannot be split',
      },
    ]
  }

  const whole: PackagingOption = {
    kind: 'box',
    units: size,
    label: `Full ${packWord(unit)} (${size} ${unitLabel(unit, size)})`,
    short: `Full ${packWord(unit)}`,
    note: 'The complete pack',
  }

  if (isMeasured(unit)) {
    const small = Math.max(5, Math.round((size * 0.3) / 5) * 5)
    return [
      whole,
      {
        kind: 'strip',
        units: small,
        label: `Small bottle (${small}${unit})`,
        short: 'Small bottle',
        note: 'Decanted into a travel bottle',
      },
      {
        kind: 'loose',
        min: 1,
        max: Math.max(5, Math.round(size * 0.2)),
        suggested: 5,
        note: 'A tester amount',
        label: 'Sample',
        short: 'Sample',
      },
    ]
  }

  // Counted units. A strip is ten, or half the pack when the pack is small.
  const strip = Math.max(2, Math.min(10, Math.floor(size / 2)))
  const options: PackagingOption[] = [whole]

  if (size > strip) {
    // Only pills come in strips; sachets and sheet masks come out of the box.
    const partLabel =
      unit === 'tablet' || unit === 'capsule' || unit === 'softgel' ? 'Strip' : 'Part pack'
    options.push({
      kind: 'strip',
      units: strip,
      label: `${partLabel} (${strip} ${unitLabel(unit, strip)})`,
      short: partLabel,
      note: 'Part of a pack',
    })
  }

  options.push({
    kind: 'loose',
    min: 1,
    max: size * 4,
    suggested: Math.min(5, size),
    label: `Loose ${unitLabel(unit, 2)}`,
    short: 'Loose',
    note: 'Counted out for you — say how many',
  })

  return options
}

/**
 * Price of one unit — one tablet, one millilitre — after any discount. Shown
 * beside the options so a part-pack price is checkable rather than mysterious.
 */
export function unitPrice(product: Product): number {
  const discounted = product.price * (1 - (product.discountPercent ?? 0) / 100)
  return discounted / Math.max(1, product.packSize)
}

/**
 * What one configured item costs: its units at the unit price. Buying a whole
 * pack therefore lands exactly on the listed price, and a part-pack is a plain
 * fraction of it — no hidden premium for splitting.
 */
export function itemPrice(product: Product, units: number): number {
  return unitPrice(product) * units
}

/** The same, before any discount — what a strikethrough or subtotal quotes. */
export function itemListPrice(product: Product, units: number): number {
  return (product.price / Math.max(1, product.packSize)) * units
}

/** Money is only ever shown to the cent, so lines must round the same way. */
export function roundMoney(value: number): number {
  return Math.round(value * 100) / 100
}

/** One of the fixed forms a shop lists a product in. */
export interface Variant {
  kind: PackagingKind
  units: number
  /** "Strip · 10 tablets" */
  label: string
  /** What one of these costs, after any discount. */
  price: number
  soldOut: boolean
}

/**
 * The variants the cart can switch a line between.
 *
 * "Custom amount" is left out on purpose: it is a number the shopper types on
 * the product page, not one of the shop's own listed forms.
 */
export function variantsFor(product: Product, size = product.packSize): Variant[] {
  // Two forms can land on the same amount — a five-piece pack counted out
  // loose is the pack. The first one listed wins; a repeat is just noise.
  const seen = new Set<number>()

  return packagingFor(product, size)
    .filter((option) => option.kind !== 'custom')
    .flatMap((option) => {
      const units = option.units ?? option.suggested ?? option.min ?? 1
      if (seen.has(units)) return []
      seen.add(units)

      return [{
        kind: option.kind,
        units,
        label: `${option.short} · ${units} ${unitLabel(product.unit, units)}`,
        price: roundMoney(itemPrice(product, units)),
        soldOut: product.soldOut?.includes(option.kind) ?? false,
      }]
    })
}

/** How one line's form and amount read, wherever they are shown. */
export function describeAmount(
  product: Product,
  packaging: PackagingKind,
  units: number,
  size?: number,
): string {
  const option = packagingFor(product, size ?? product.packSize).find(
    (candidate) => candidate.kind === packaging,
  )
  return `${option?.short ?? 'Custom'} · ${units} ${unitLabel(product.unit, units)}`
}
