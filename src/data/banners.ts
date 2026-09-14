export interface Banner {
  id: string
  headline: string
  subline: string
  cta: string
  to: string
  /** Background, foreground text and decorative accent. */
  background: string
  foreground: string
  accent: string
}

export const banners: Banner[] = [
  {
    id: 'delivery',
    headline: 'Free delivery over $20',
    subline: 'Across Phnom Penh, same day',
    cta: 'Shop now',
    to: '/search',
    background: '#1F4466',
    foreground: '#FFFFFF',
    accent: '#4A9A96',
  },
  {
    id: 'skincare-sale',
    headline: 'Up to 30% off skincare',
    subline: 'Sunscreen, serums and cleansers',
    cta: 'See discounts',
    to: '/discounts',
    background: '#4A9A96',
    foreground: '#FFFFFF',
    accent: '#EAF1F7',
  },
  {
    id: 'consultation',
    headline: 'Talk to a pharmacist',
    subline: 'Free consultation, seven days a week',
    cta: 'Find a pharmacy',
    to: '/stores',
    background: '#EAF1F7',
    foreground: '#1F4466',
    accent: '#2B5C8A',
  },
  {
    id: 'supplements',
    headline: 'Daily vitamins, delivered',
    subline: 'Immune, bone and gut support',
    cta: 'Browse supplements',
    to: '/search?category=Supplement',
    background: '#2B5C8A',
    foreground: '#FFFFFF',
    accent: '#4A9A96',
  },
  {
    id: 'equipment',
    headline: 'Home health equipment',
    subline: 'Monitors, nebulisers and first aid',
    cta: 'Shop equipment',
    to: '/search?category=Medical%20Equipment',
    background: '#E4F0EF',
    foreground: '#1F4466',
    accent: '#4A9A96',
  },
]
