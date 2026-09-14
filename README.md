# PharmaLink — Healthcare Connections

Mobile-first online pharmacy marketplace for Cambodia. React + TypeScript + Vite,
Tailwind for styling, React Router for navigation. All data is mock data — there
is no backend yet.

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # type-check + production bundle
npm run lint
```

## Routes

| Route | Page | Notes |
| --- | --- | --- |
| `/` | Home | Store carousel (auto-scrolls), discount rail (manual scroll), nearest pharmacies |
| `/search` | Product results | `?category=` and `?q=`; compact search pill instead of the logo row |
| `/product/:id` | Product detail | Store card, add to cart, consult, related rails |
| `/store/:id` | Pharmacy | Navy band, about section, product grid, floating Consult button |
| `/stores` | All pharmacies | `?type=`; searchable, sortable by distance or rating |
| `/discounts` | All discounts | Filter by category, sort by discount / price / rating |
| `/account` | Account | Stub — "Coming soon" |

Footer destinations (`/about`, `/policy/*`, `/services/*`) render a shared placeholder.

## Structure

- `src/data/` — types plus mock stores and products, and the selectors over them
- `src/context/AppContext.tsx` — auth, cart, favourites, geolocation; persisted to `localStorage`
- `src/hooks/` — `useAutoScroll` (the store carousel only), `useHideOnScroll` (header), `useIsTouch`
- `src/components/` — shell (header, footer, layout, modals) and shared cards
- `src/lib/geo.ts` — haversine distance, Phnom Penh fallback, `tel:` and map links

## Taxonomy

Two independent axes, matching the two chip rows in the header:

- **Store type** (`Store.type`) — `Medicine` or `Pharmacy`. The "Filter by store" chips
  link to `/stores?type=…`.
- **Product category** (`Product.category`) — `Medicine`, `Cosmetic`, `Supplement`,
  `Medical Equipment`. The "Filter by product" chips link to `/search?category=…` and
  cover the last three; medicine products are reached through the store filter, the
  footer, or search.

Skincare is folded into `Cosmetic` — the header has no Skincare chip, so keeping it as a
separate category would have made those products unreachable by chip.

## Conventions worth knowing

- **Products are not rated — stores are.** `Product` has no rating field. Wherever a
  product shows stars, they are the rating of the store selling it (`storeRating()` in
  `src/data/index.ts`), which is also what the "Store rating" sort ranks by.
- **The same product can be listed by several stores.** Listings share a name and differ
  by id, `storeId` and price; `otherStoresFor()` powers the "Also at these stores"
  section on product detail. Search matches word by word, so "bio derma sleeping mask"
  finds the Bioderma mask at each store that carries it.
- **Product artwork is generated,** not fetched. `ProductImage` draws an SVG from the
  product's `imageSeed` and category, so the app has no external image dependency.
  Swap it for real photography when assets exist.
- **The logo is a placeholder** (`src/components/Logo.tsx` and `public/logo.svg`).
  It is the mark only — no wordmark, no tagline.
- **Consultation numbers are per store** (`store.phone`), used by the call button on
  product cards, the Consult button on product detail, and the floating button on
  store pages.
- **Auth is mocked.** The modal accepts anything and derives a display name from the
  email or phone; there is no validation beyond matching passwords on sign-up.

## Not built yet

- `/account` beyond the stub, and real authentication
- Prescription upload for "Medical prescription by doctor"
- Khmer / English language toggle and USD / KHR currency display
- Review submission — ratings are display-only
- Checkout: the cart drawer's Checkout button is inert
# pharmaLink-e-commerce
