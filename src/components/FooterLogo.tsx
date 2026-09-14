import footerLogoImg from '../assets/footerLogo.png' // ← match your exact filename/extension

export function FooterLogo({
  height = 32,
  className = '',
}: {
  height?: number
  className?: string
}) {
  return (
    <img
      src={footerLogoImg}
      alt="PharmaLink"
      style={{ height }}
      className={`w-auto object-contain ${className}`}
    />
  )
}