# Sparkbuys — Angular PWA Frontend

## Project Overview
Headless e-commerce PWA for Sparkbuys built with Angular 21 + Shopify Storefront API.
Deployed as static files on S3, served via Cloudflare Worker at `sparkbuys.in`.

## Tech Stack
- **Framework**: Angular 21, standalone components, zoneless change detection, Angular Signals
- **Styling**: Tailwind CSS v4
- **API**: Shopify Storefront API via Apollo Angular (GraphQL)
- **Auth**: Custom OTP via `sparkbuys-api` REST endpoints (`/signin`, `/verify`)
- **PWA**: Angular Service Worker

## Key Commands
```bash
npm start          # dev server on port 4300
npm run build      # production build
npm run watch      # watch mode (dev)
```

## Architecture
- `src/app/core/services/` — singleton services (auth, cart, seo, pixel)
- `src/app/core/graphql/queries/` — all GraphQL query/mutation definitions
- `src/app/core/graphql/shopify.types.ts` — Shopify TypeScript interfaces
- `src/app/features/` — page-level components (home, catalog, product, cart, account, auth)
- `src/app/shared/components/` — reusable components (header, footer, product-card)
- `src/app/shared/pipes/` — InrPipe (currency formatting)
- `src/environments/` — environment config (apiBaseURL, shopify tokens)

## Shopify Integration
- **Storefront API**: public token `29487c34d6331341ec4e7db25f7dc35c`, version `2026-01`
- **Store**: `sparkbuys26.myshopify.com`
- **Checkout domain**: `checkout.sparkbuys.in` (CNAME → `shops.myshopify.com`)
- Apollo client configured in `app.config.ts` with Storefront API headers
- Always use `apollo.query()` with `fetchPolicy: 'network-only'` — never `watchQuery().valueChanges` (returns `DeepPartialObject`)

## Auth Flow
- `AuthService.sendOtp(phone)` → `POST /signin` with `{ phone }`
- `AuthService.verifyOtp(phone, code)` → `POST /verify` → returns `{ token, shopifyToken }`
- JWT stored in `localStorage` as `sb_token`
- Shopify customer access token stored as `sb_shopify_token` (expires 30 days)
- `CartService.linkCustomer(shopifyToken)` called after login to associate cart with customer

## Cart Flow
- Cart ID persisted in `localStorage` as `sb_cart_id`
- `CartService.addItem()` creates cart if none exists, links customer if logged in
- `cart.toast` signal shows "Added to cart!" confirmation for 2.5s
- `InitiateCheckout` pixel event fires on checkout button click

## Meta Pixel
Three pixel IDs initialised in `index.html`:
- `1973983356809326`, `1534417167601705`, `1338347834062353`
- `PixelService` handles: `pageView()`, `viewContent()`, `addToCart()`, `initiateCheckout()`
- `PageView` fires on every `NavigationEnd` in `AppComponent`

## Colors / Brand
- Primary orange: `#F05A28`
- Navy: `#1A2744`

## Important Patterns
- Use `isPlatformBrowser(platformId)` before any `localStorage`, `window`, `navigator`, `IntersectionObserver` access (SSR safety)
- `apollo.query()` returns `Observable<ApolloQueryResult<T>>` — access data via `result.data`
- Pixel events must be wrapped in try/catch (`fbq` may not be loaded)
- `PRODUCT_CARD_FRAGMENT` includes `variants(first: 1) { nodes { id } }` — required for add-to-cart on list pages

## API Base URL
- Production: `https://sparkbuys-api-820618709776.asia-south1.run.app`
- Local dev: configured in `src/environments/environment.ts`
