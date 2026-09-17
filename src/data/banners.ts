import sunscreenSale from '../assets/image6.png'
import vegansSale from '../assets/image2.png'
import vitaminC from '../assets/image3.png'
import dermaCo from '../assets/image4.png'
import cosmeticsSale from '../assets/image5.png'
import primeDay from '../assets/image7.png'

export interface Banner {
  id: string
  /** The banner is the artwork — there is no drawn version underneath it. */
  image: string
  /** What the artwork says, for anyone who cannot see it. */
  alt: string
  to: string
  /**
   * Which edge to keep when a banner is wider than the frame and has to be
   * cropped. Set where the wording sits off-centre; the middle is fine
   * otherwise.
   */
  position?: string
}

export const banners: Banner[] = [
  {
    id: 'sunscreen-sale',
    image: sunscreenSale,
    alt: 'Prime Day, 23 to 26 June — buy two sunscreens and get 10% off',
    to: '/search?category=Cosmetic',
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
    position: 'object-left',
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
  {
    id: 'prime-day',
    image: primeDay,
    alt: 'Prime Day, 23 to 26 June — up to 30% off selected items',
    to: '/discounts',
  },
]
