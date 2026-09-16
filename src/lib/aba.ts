/**
 * Handing off to the ABA Mobile app.
 *
 * Opening ABA's own app scheme launches ABA Mobile when it is installed.
 * Pre-filling the amount and account inside the app needs a signed deeplink
 * issued by ABA's PayWay API from a live merchant backend, which this demo
 * has no access to — so the app opens to its own screen, and this side
 * records the order against the KHQR shown in the payment sheet.
 */

const ABA_APP_SCHEME = 'abamobilebank://ababank.com'

/** True on phones and tablets, where jumping into the ABA app is useful. */
export function isMobileDevice(): boolean {
  if (typeof navigator === 'undefined') return false
  const ua = navigator.userAgent
  // iPadOS asks for desktop sites by default and reports a Mac user agent, so
  // a "Mac" that takes touch input is really an iPad.
  const iPad = /Macintosh/.test(ua) && navigator.maxTouchPoints > 1
  return /android|iphone|ipad|ipod/i.test(ua) || iPad
}

export function openAbaApp(): void {
  window.location.href = ABA_APP_SCHEME
}
