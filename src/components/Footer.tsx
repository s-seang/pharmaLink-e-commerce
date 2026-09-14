import { Phone } from 'lucide-react'
import { Link } from 'react-router-dom'
import { CATEGORIES } from '../data'
import { Logo } from './Logo'

const SUPPORT_PHONE = '+855 23 900 100'

export function Footer() {
  return (
    <footer data-app-footer className="mt-12 bg-navy-deep text-navy-tint">
      <div className="app-container py-10">
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 lg:grid-cols-5">
          <Group title="Company">
            <FooterLink to="/about">About us</FooterLink>
            <FooterLink to="/corporate">Corporate</FooterLink>
            <FooterLink to="/faqs">FAQs</FooterLink>
            <FooterLink to="/contact">Contact us</FooterLink>
          </Group>

          <Group title="Categories">
            {CATEGORIES.map((category) => (
              <FooterLink key={category} to={`/search?category=${category}`}>
                {category}
              </FooterLink>
            ))}
          </Group>

          <Group title="Browse">
            <FooterLink to="/stores">Browse stores</FooterLink>
            <FooterLink to="/stores">View all pharmacies</FooterLink>
            <FooterLink to="/discounts">Discounts</FooterLink>
          </Group>

          <Group title="Our services">
            <FooterLink to="/services/consultation">Consultation</FooterLink>
            <FooterLink to="/services/prescription">Medical prescription by doctor</FooterLink>
          </Group>

          <Group title="Policy">
            <FooterLink to="/policy/privacy">Privacy</FooterLink>
            <FooterLink to="/policy/terms">Terms and conditions</FooterLink>
            <FooterLink to="/policy/returns">Return and refund</FooterLink>
            <FooterLink to="/policy/delivery">Medicine delivery and cancellation</FooterLink>
          </Group>
        </div>

        <div className="my-7 h-px bg-white/15" />

        <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
          <Link to="/" className="flex items-center gap-2" aria-label="PharmaLink home">
            <Logo size={32} />
            <span className="text-sm font-semibold text-white">PharmaLink</span>
          </Link>

          <div className="flex items-center gap-2">
            <SocialLink href="https://facebook.com" label="Facebook">
              <FacebookMark />
            </SocialLink>
            <SocialLink href="https://t.me/pharmalink" label="Telegram">
              <TelegramMark />
            </SocialLink>
            <a
              href={`tel:${SUPPORT_PHONE.replace(/[^\d+]/g, '')}`}
              className="flex items-center gap-2 rounded-full bg-white/10 px-3 py-2 text-sm text-white transition-colors hover:bg-white/20"
            >
              <Phone size={16} />
              {SUPPORT_PHONE}
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="mb-3 text-sm font-semibold text-white">{title}</h3>
      <ul className="space-y-2">{children}</ul>
    </div>
  )
}

function FooterLink({ to, children }: { to: string; children: React.ReactNode }) {
  return (
    <li>
      <Link to={to} className="text-sm text-navy-tint/80 transition-colors hover:text-white">
        {children}
      </Link>
    </li>
  )
}

function SocialLink({
  href,
  label,
  children,
}: {
  href: string
  label: string
  children: React.ReactNode
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      aria-label={label}
      className="rounded-full bg-white/10 p-2.5 text-white transition-colors hover:bg-white/20"
    >
      {children}
    </a>
  )
}

/* Brand marks — lucide dropped its brand icon set. */
function FacebookMark() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M22 12.06C22 6.5 17.52 2 12 2S2 6.5 2 12.06c0 5.02 3.66 9.18 8.44 9.94v-7.03H7.9v-2.9h2.54V9.85c0-2.52 1.5-3.91 3.77-3.91 1.09 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.78-1.63 1.57v1.89h2.78l-.45 2.9h-2.33V22c4.78-.76 8.44-4.92 8.44-9.94Z" />
    </svg>
  )
}

function TelegramMark() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M21.6 4.3 2.9 11.5c-1 .4-1 1.8.03 2.13l4.6 1.44 1.77 5.42c.23.7 1.13.9 1.64.36l2.56-2.7 4.63 3.4c.63.47 1.54.13 1.72-.64l3.1-14.1c.2-.9-.68-1.66-1.35-1.4ZM8.9 14.2l9.1-5.6-7.5 6.9-.3 3.2-1.3-4.5Z" />
    </svg>
  )
}
