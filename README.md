# PharmaLink — Healthcare Connections

Mobile-first online pharmacy marketplace for Cambodia. React + TypeScript + Vite,
Tailwind for styling, React Router for navigation. All data is mock data — there
is NO BACKEND YET.

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # type-check + production bundle
npm run lint
```

## Routes

| Route | Page | Notes |
| --- | --- | --- |
| `/` | Home | Promo banners, discount grid, nearest pharmacies |
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
- `src/hooks/` — `useHideOnScroll` (header), `useBackdropTone` (contrast), `useFooterClearance`, `useIsTouch`
- `src/components/CartBar.tsx` — the app-wide bottom cart bar; `CartStoreDialog.tsx` — the
  one-pharmacy prompt
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

- **A cart holds one pharmacy at a time.** Each pharmacy packs and delivers its own order,
  so there is no way to check out across two of them. `addToCart` compares the product's
  `storeId` against `cartStoreId` (the store of the first line in the cart) and, when they
  differ, parks the add in `cartConflict` instead of applying it. `CartStoreDialog` then
  offers the only two ways out: empty the cart and start again at the new pharmacy, or keep
  the cart as it is. Nothing else may write a second store into the cart — `setQuantity`
  and `removeFromCart` are safe because they only touch lines already there, and a cart
  restored from `localStorage` is pruned to its first store on load.
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
- **The logo loads from `public/logo.png`.** Drop the real artwork in at that path
  and it appears everywhere. Until that file exists, `Logo.tsx` falls back to a drawn
  placeholder, so nothing renders a broken image.
- **Consultation numbers are per store** (`store.phone`), used by the Consult button on
  product detail and the floating button on store pages. Product cards do not carry one —
  a grid of cards is for choosing, and the pharmacy is one tap away when there is
  something to ask about.
- **The add control on a card has three states**, in `CartStepper`: a plain `+` when
  nothing is in the cart, an open trash / count / `+` stepper, and a filled circle showing
  the count. Adding opens the stepper for three seconds and then folds it away, so one tap
  stays one tap; every press restarts that countdown, and tapping the count opens it again.
  It stays closed when the add is one the one-pharmacy prompt will hold back, since there
  is no quantity to step yet.
- **One product card, everywhere.** `ProductCard` is used by search, discounts, store
  pages, product detail and the home grid. It leads with the artwork, names the pharmacy
  under it, and only then gives the product name and pricing — who is selling it is part
  of the decision, not a footnote, because of the one-pharmacy rule above. Pass
  `showStore={false}` where the pharmacy is already the context, and `action="none"` to
  drop the corner control: the card's top-right corner is a favourite toggle everywhere
  except inside a pharmacy's own page, where browsing one shelf stays down to the single
  gesture that matters — add.
- **Product rails are grids.** Nothing scrolls sideways except the promo banners, which
  stay inside the page gutter so a banner lines up with the sections around it.
- **Auth is mocked.** The modal accepts anything and derives a display name from the
  email or phone; there is no validation beyond matching passwords on sign-up.

## Not built yet

- `/account` beyond the stub, and real authentication
- Prescription upload for "Medical prescription by doctor"
- Khmer / English language toggle and USD / KHR currency display
- Review submission — ratings are display-only
- Somewhere to see favourites. The heart on product cards and product detail writes to
  `favourites` in `AppContext` and persists, but no screen lists what is in it yet —
  `/account` is the obvious home for it.
- Checkout: the cart's "Proceed to payment" button is inert, and the payment method row
  is a fixed "Pay on delivery" placeholder. The order summary above it is real — subtotal,
  the discount the sale prices add up to, and a $1.50 delivery fee waived over $20.
# pharmaLink-e-commerce
