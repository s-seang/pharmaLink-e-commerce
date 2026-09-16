/**
 * Delivery pricing, in one place so the cart and the checkout quote the same
 * numbers. There is no courier integration — these are the app's own rules.
 */

/** Where an order is going. Editable at checkout and kept between visits. */
export interface DeliveryAddress {
  label: string
  phone: string
  line1: string
  area: string
  city: string
}

/**
 * A starting address so checkout has something to show. Mock, like the stores
 * and products — there is no account to read a real one from.
 */
export const DEFAULT_ADDRESS: DeliveryAddress = {
  label: 'Home',
  phone: '+855 12 345 678',
  line1: 'No. 15, Street 240',
  area: 'Chey Chumneas, Daun Penh',
  city: 'Phnom Penh, 12206',
}

export type DeliveryKey = 'standard' | 'express'

export interface DeliveryChoice {
  value: DeliveryKey
  label: string
  /** What it costs before any voucher. */
  fee: number
  /** Minutes off the shop's own estimate. */
  minutesSaved: number
  note: string
}

export const DELIVERY_CHOICES: DeliveryChoice[] = [
  {
    value: 'standard',
    label: 'Standard delivery',
    fee: 1.5,
    minutesSaved: 0,
    note: 'Arrives in the usual window',
  },
  {
    value: 'express',
    label: 'Express delivery',
    fee: 2.5,
    minutesSaved: 10,
    note: 'Roughly 10 minutes sooner',
  },
]

export const STANDARD_FEE = DELIVERY_CHOICES[0].fee

/** Spend this much and delivery is on us. */
export const FREE_DELIVERY_OVER = 20

export function deliveryChoice(key: DeliveryKey): DeliveryChoice {
  return DELIVERY_CHOICES.find((choice) => choice.value === key) ?? DELIVERY_CHOICES[0]
}

/**
 * What the free-delivery voucher takes off. It is worth the standard fee, so
 * upgrading to express still costs the difference rather than riding free —
 * the same "free shipping up to X" shape most checkouts use.
 */
export function voucherValue({
  fee,
  cartTotal,
  storeFreeDelivery,
}: {
  fee: number
  cartTotal: number
  storeFreeDelivery?: boolean
}): number {
  const earned = storeFreeDelivery === true || cartTotal >= FREE_DELIVERY_OVER
  return earned ? Math.min(fee, STANDARD_FEE) : 0
}
