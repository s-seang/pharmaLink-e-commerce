/**
 * KHQR payload building.
 *
 * KHQR is Cambodia's EMVCo QR standard, so the payload is a string of
 * tag-length-value triples ending in a CRC. Building it properly rather than
 * encoding a made-up string means the QR carries the merchant account and the
 * exact amount in the shape a banking app expects to read.
 *
 * The merchant accounts in this app are mock, so no real transfer can complete
 * — but the amount, currency and reference in the code are the real ones.
 */

/** Tag-length-value: two-digit tag, two-digit length, then the value. */
function tlv(tag: string, value: string): string {
  return `${tag}${value.length.toString().padStart(2, '0')}${value}`
}

/** CRC-16/CCITT-FALSE over the payload, as EMVCo tag 63 requires. */
function crc16(input: string): string {
  let crc = 0xffff
  for (let i = 0; i < input.length; i += 1) {
    crc ^= input.charCodeAt(i) << 8
    for (let bit = 0; bit < 8; bit += 1) {
      crc = crc & 0x8000 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0')
}

export interface KhqrRequest {
  /** The shop's ABA account. */
  account: string
  merchantName: string
  city: string
  amount: number
  /** Order reference, so a payment can be matched to an order. */
  reference: string
  currency?: 'USD' | 'KHR'
}

export function khqrPayload({
  account,
  merchantName,
  city,
  amount,
  reference,
  currency = 'USD',
}: KhqrRequest): string {
  const body = [
    tlv('00', '01'), // payload format indicator
    tlv('01', '12'), // dynamic: this code carries an amount, so it is single-use
    tlv('29', tlv('00', 'kh.com.aba') + tlv('01', account)),
    tlv('52', '5912'), // merchant category: drug stores and pharmacies
    tlv('53', currency === 'USD' ? '840' : '116'),
    tlv('54', amount.toFixed(2)),
    tlv('58', 'KH'),
    tlv('59', merchantName.slice(0, 25)),
    tlv('60', city.slice(0, 15)),
    tlv('62', tlv('01', reference.slice(0, 25))),
  ].join('')

  // The CRC covers the payload including tag 63 and its length.
  const withCrcTag = `${body}6304`
  return `${withCrcTag}${crc16(withCrcTag)}`
}
