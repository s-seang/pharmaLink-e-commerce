import { useApp } from '../context/AppContext'
import type { CartLine, Product } from '../data'
import { defaultUnitType, itemCategoryFor } from '../lib/itemTypes'
import type { Variant } from '../lib/packaging'

/**
 * Reading and setting how many of each variant of one product are in the
 * basket — what the steppers inside a variant sheet drive.
 *
 * Shared so the sheet behaves the same whether it was opened from a product
 * card or from a line already in the cart.
 */
export function useVariantBasket(
  product: Product | undefined,
  /** The line the sheet was opened on, so its own row drives it. */
  preferred?: CartLine,
) {
  const { cart, addConfigured, setQuantity, removeFromCart } = useApp()

  const lineFor = (variant: Variant): CartLine | undefined => {
    if (!product) return undefined
    if (preferred?.packaging === variant.kind && preferred.units === variant.units) return preferred

    const form = defaultUnitType(product)
    return cart.find(
      (item) =>
        item.productId === product.id &&
        item.packaging === variant.kind &&
        item.units === variant.units &&
        !item.note &&
        (item.unitType ?? form) === form,
    )
  }

  return {
    quantityOf: (variant: Variant) => lineFor(variant)?.quantity ?? 0,

    setQuantityOf: (variant: Variant, quantity: number) => {
      if (!product) return

      const existing = lineFor(variant)
      if (existing) {
        if (quantity <= 0) removeFromCart(existing.lineId)
        else setQuantity(existing.lineId, quantity)
        return
      }
      if (quantity <= 0) return

      addConfigured({
        productId: product.id,
        quantity,
        packaging: variant.kind,
        units: variant.units,
        price: variant.price,
        itemCategory: itemCategoryFor(product),
        unitType: defaultUnitType(product),
      })
    },
  }
}
