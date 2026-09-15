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
| `/` | Home | Banners, discounts, order again (once you have ordered), nearest box, sortable browse |
| `/search` | Product results | `?category=` and `?q=`; compact search pill, filter row below |
| `/product/:id` | Product detail | Store card, add to cart, consult, related rails |
| `/store/:id` | Pharmacy | Navy band, about section, product grid, floating Consult button |
| `/stores` | All pharmacies | `?type=`; searchable, sortable by distance or rating |
| `/discounts` | All discounts | Filter by category, sort by discount / price / rating |
| `/account` | Account | Stub — "Coming soon" |
| `/orders` | Your previous orders | Every pharmacy ordered from; own top bar, no header |

Footer destinations (`/about`, `/policy/*`, `/services/*`) render a shared placeholder.

## Structure

- `src/data/` — types plus mock stores and products, and the selectors over them
- `src/context/AppContext.tsx` — auth, cart, favourites, geolocation; persisted to `localStorage`
- `src/hooks/` — `useHideOnScroll` (header), `useBackdropTone` (contrast), `useFooterClearance`, `useIsTouch`
- `src/components/CartBar.tsx` — the bottom cart bar shown on pharmacy pages;
  `CartStoreDialog.tsx` — the one-pharmacy prompt; `FilterBar.tsx` — the filter pills used by
  home and search; `OrderAgainRow.tsx` — a past shop and its rail;
  `StoreBannerCard.tsx` — the full-width shop card on `/orders`
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

- **The cart bar belongs to the shop you are standing in.** `Layout`'s `cartBar` defaults
  to false and only `/store/:id` opts in. Everywhere else the cart is reached through the
  icon in the header, so the bar does not trail the shopper around the app. Store pages
  are the mirror image: they pass `floatingCart={false}`, so the bar is the only cart
  control there rather than a second one.
- **Search filters are pills, and their sheets are not popovers.** `FilterSelect` opens
  its choices in a sheet from the bottom of the screen because the filter row scrolls
  sideways, and anything absolutely positioned inside a scrolling row is clipped by it.
  A pill carries its chosen value once it is off its default, so the row reads as the
  current state of the search. "Open now" reads `store.hours` through `isOpenNow`, and
  "Ratings 4.0+" ranks by the selling store, like every other rating in the app.
- **Delivery estimates are prep time plus the ride.** `Store.prepMinutes` is how long the
  shop needs before anything moves; `deliveryMinutes()` in `src/lib/geo.ts` adds the ride at
  `RIDE_SPEED_KMH`. Keeping prep in the number is what makes home's "Fast delivery" sort
  different from "Distance" — a slow shop next door loses to a quick one a kilometre away.
  Estimates always render as a range (`formatEta`), because an exact minute would be a
  promise the app cannot keep.
- **Home's Category filter reads two different things.** "Pharmacy" and "Medicine" match
  `Store.type`; the rest match what a shop actually stocks. "Skincare Store" is the narrower
  of the two cosmetics filters — a shop whose *biggest* shelf is cosmetics (`leadingCategory`)
  rather than any shop carrying some — so it is a proper subset of "Cosmetic" (4 shops of 6
  today) rather than a second name for the same list.
- **"Order again" does not re-offer what was bought.** `topPicks()` leads with whatever is
  on offer at that shop now. Someone returning to a pharmacy is returning to the shop, not
  repeating a box of paracetamol.
- **Orders are real, and nothing seeds them.** `orders` lives in `AppContext` beside the
  cart and persists to `localStorage`; `placeOrder()` writes one. Until the first checkout
  the list is empty, so the home page's "Order again" section is absent rather than empty,
  and `/orders` shows its own empty state. There is no mock order history — seeding one
  would have made the section lie about what the shopper has done.
- **Home's two shop lists answer different questions.** "Nearest to you" is a sideways rail
  sorted by distance that takes no filters — it answers "what is closest". The "Explore
  shops" section below it is the one the filter pills drive, stacked vertically, where
  the shopper decides what "best" means. Keeping the filters off the rail is what stops its
  heading from contradicting a sort like "Rating (high to low)". Both use the same
  `StoreRow`; the rail just gives each row a fixed width.
- **Store artwork is drawn, like product artwork.** `StoreBannerCard` paints the shop's own
  `logoColor` and leads with its deepest discount (`bestDiscount`). Stores have no photos,
  and the app has no external image dependency to lean on.
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
- Home's "Most purchased" sort ranks by `reviewCount` — there are no cross-shopper order
  counts to rank by without a backend.
- Somewhere to see favourites. The heart on product cards and product detail writes to
  `favourites` in `AppContext` and persists, but no screen lists what is in it yet —
  `/account` is the obvious home for it.
- Payment. "Proceed to payment" records the order, empties the cart and lands on
  `/orders` — but nothing is charged, and the payment method row is a fixed "Pay on
  delivery" placeholder. The order summary is real: subtotal, the discount the sale prices
  add up to, and a $1.50 delivery fee waived over $20.
- Order detail. `/orders` lists the pharmacies ordered from, not the orders themselves;
  `Order.lines` and `Order.total` are recorded but nothing reads them yet.
# pharmaLink-e-commerce
