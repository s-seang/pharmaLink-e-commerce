/**
 * Placeholder logo mark — swap the SVG for the real artwork when it lands.
 * Mark only: the wordmark and tagline are deliberately not part of this.
 */
export function Logo({ size = 36, className = '' }: { size?: number; className?: string }) {
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
      <rect width="64" height="64" rx="16" fill="#2B5C8A" />
      <path
        d="M32 15c-6.6 0-12 5.4-12 12v10c0 6.6 5.4 12 12 12s12-5.4 12-12V27c0-6.6-5.4-12-12-12Z"
        fill="#EAF1F7"
      />
      <path d="M20 32h24v5c0 6.6-5.4 12-12 12s-12-5.4-12-12v-5Z" fill="#4A9A96" />
      <path d="M29 21h6v4h4v6h-4v4h-6v-4h-4v-6h4v-4Z" fill="#2B5C8A" />
    </svg>
  )
}
