/** Central Phnom Penh — the fallback when the browser denies geolocation. */
export const PHNOM_PENH = { lat: 11.5564, lng: 104.9282 }

const EARTH_RADIUS_KM = 6371

const toRad = (deg: number) => (deg * Math.PI) / 180

export interface Coords {
  lat: number
  lng: number
}

/** Great-circle distance in kilometres. */
export function distanceKm(a: Coords, b: Coords): number {
  const dLat = toRad(b.lat - a.lat)
  const dLng = toRad(b.lng - a.lng)
  const lat1 = toRad(a.lat)
  const lat2 = toRad(b.lat)

  const h =
    Math.sin(dLat / 2) ** 2 + Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2)

  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(h))
}

export function formatDistance(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)} m`
  return `${km.toFixed(1)} km`
}

/** Google Maps directions link for a store's coordinates. */
export function directionsUrl(lat: number, lng: number, label?: string): string {
  const query = label ? `${encodeURIComponent(label)}` : `${lat},${lng}`
  return `https://www.google.com/maps/search/?api=1&query=${query}&center=${lat},${lng}`
}

/** Strip spaces and punctuation so tel: links dial correctly. */
export function telHref(phone: string): string {
  return `tel:${phone.replace(/[^\d+]/g, '')}`
}

/** Riding speed used to turn a distance into a delivery estimate, km/h. */
const RIDE_SPEED_KMH = 18

/**
 * Minutes until an order lands: the shop's own prep time plus the ride. Keeping
 * prep in the number is what makes "Fast delivery" different from "Distance" —
 * a busy shop next door can be slower than a quick one a kilometre away.
 */
export function deliveryMinutes(prepMinutes: number, km: number): number {
  return Math.round(prepMinutes + (km / RIDE_SPEED_KMH) * 60)
}

/** "20–30 min" — a range, because an exact minute would be a promise. */
export function formatEta(minutes: number): string {
  const low = Math.max(5, Math.round(minutes / 5) * 5)
  return `${low}\u2013${low + 10} min`
}
