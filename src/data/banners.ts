import collagenSale from '../assets/image1.png'
import vegansSale from '../assets/image2.png'
import vitaminC from '../assets/image3.png'
import dermaCo from '../assets/image4.png'
import cosmeticsSale from '../assets/image5.png'

export interface Banner {
  id: string
  /** The banner is the artwork — there is no drawn version underneath it. */
  image: string
  /** What the artwork says, for anyone who cannot see it. */
  alt: string
  to: string
}

export const banners: Banner[] = [
  {
    id: 'collagen-sale',
    image: collagenSale,
    alt: 'Pay day sale — flat 10% plus an extra 5% off beauty protein collagen',
    to: '/search?category=Supplement',
  },
  {
    id: 'vegans-sale',
    image: vegansSale,
    alt: 'Extra 30% off everything, applied at checkout',
    to: '/discounts',
  },
  {
    id: 'vitamin-c',
    image: vitaminC,
    alt: 'Best seller — glow boosting vitamin C with glutathione',
    to: '/search?category=Cosmetic',
  },
  {
    id: 'derma-co',
    image: dermaCo,
    alt: 'Sale is live — buy one get one free across skincare',
    to: '/discounts',
  },
  {
    id: 'cosmetics-sale',
    image: cosmeticsSale,
    alt: 'Premium cosmetics — 40% off',
    to: '/search?category=Cosmetic',
  },
]
