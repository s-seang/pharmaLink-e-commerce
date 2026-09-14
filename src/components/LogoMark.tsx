/**
 * Hand-drawn stand-in for the PharmaLink mark: two interlocking chain links,
 * navy and teal. It is an approximation of the real artwork — drop the actual
 * file in at `public/logo.png` and `Logo` uses that instead.
 */
export function LogoMark({ size = 36, className = '' }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      role="img"
      aria-label="PharmaLink"
      className={className}
    >
      {/* Teal link, upper right. */}
      <rect
        x="26"
        y="12"
        width="32"
        height="21"
        rx="10.5"
        transform="rotate(-45 42 22.5)"
        stroke="#4A9A96"
        strokeWidth="7"
      />

      {/* Navy link, lower left, drawn over the teal so they read as linked. */}
      <rect
        x="6"
        y="31"
        width="32"
        height="21"
        rx="10.5"
        transform="rotate(-45 22 41.5)"
        stroke="#2B5C8A"
        strokeWidth="7"
      />

      {/* Short teal arc laid back over the navy, completing the interlock. */}
      <path
        d="M36.5 25.8a10.5 10.5 0 0 1 3.6 3.6"
        stroke="#4A9A96"
        strokeWidth="7"
        strokeLinecap="round"
      />
    </svg>
  )
}
