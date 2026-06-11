# kaji-order — Online Ordering System
# Master reference for all development

## Overview
Standalone white-label online ordering SaaS.
Part of Kaji POS ecosystem but works independently.

## Repositories
- kaji-order: ~/kaji-order (this repo)
- kaji-cloud: ~/kaji-cloud (SaaS platform)
- kaji-pos: ~/kaji-pos (local POS)

## Tech Stack
| Layer | Choice | Version | Notes |
|-------|--------|---------|-------|
| Framework | Next.js | 15.5.15 | NOT 16.x |
| React | React | 19.x | |
| Database | PostgreSQL | 17.x | Own DB |
| ORM | Prisma | 6.19.3 | NEVER upgrade to 7 |
| Payments | Stripe Connect | latest | Platform fees |
| Email | Resend | latest | |
| Styling | Tailwind CSS | 4.x | |

## Ports
- Dev: 3002
- kaji-pos: 3000
- kaji-cloud dev: 3001
- Production: order.kajipos.co.uk

## Database
Own PostgreSQL database: kaji_order
Does NOT share tables with kaji-cloud
Communicates with kaji-cloud via API only

## API Connection to kaji-cloud
Base URL: process.env.KAJI_CLOUD_API_URL
Used for:
- Menu sync (if restaurant has kaji-pos)
- Online order push to POS KDS
- Restaurant verification (if POS linked)

## Restaurant Types
1. OOS Only (no POS)
   - menu_source: "manual"
   - Menu managed in kaji-order dashboard
   - Independent of kaji-cloud

2. POS + OOS (integrated)
   - menu_source: "kaji_sync"
   - Menu synced from kaji-pos via kaji-cloud
   - Orders pushed to KDS
   - kaji_cloud_id links accounts

## Pricing Plans
| Plan | Price | Commission | Notes |
|------|-------|-----------|-------|
| COMMISSION | £0/month | 5% per order | Default |
| MONTHLY | £39/month | 0% | Flat fee |
| WEEKLY | £9.99/week | 0% | Flat fee |
| BUNDLE | £29/month | 0% | With kaji-pos CLOUD |

## Stripe Connect
Platform account: Kaji Digital
Restaurant connected accounts via Express
Automatic platform fee: commission_pct % on food subtotal + service fee
Webhook: /api/stripe/webhook

## Service Fee
- Default: 49p (£0.49) per order — configurable in Platform Settings (`service_fee_pence`)
- Added to customer total at checkout (subtotal + service fee + delivery)
- Commission calculated on **food subtotal only** (not service fee)
- Stripe Connect `application_fee_amount` = food commission + service fee
- Restaurant receives: subtotal − food commission
- Platform keeps: food commission + service fee
- Stored on `OnlineOrder.service_fee_pence`
- `CommissionRecord` tracks: `food_commission_pence`, `service_fee_pence`, `total_platform_pence`

## Key Features
### Public Ordering
- /[slug] — restaurant menu
- /[slug]/basket — cart
- /[slug]/checkout — payment
- /[slug]/confirmation/[orderId] — confirmed
- /[slug]/waiting/[orderId] — manual acceptance polling (PENDING → confirmation or cancel)
- /[slug]/track/[id] — order status (Sprint 11)

### Restaurant Dashboard
- /dashboard — overview (orders today, revenue today, **avg order value** — not commission)
- /dashboard/orders — KDS with Live / Today / Archive tabs
- /dashboard/menu — menu management
- /dashboard/promotions — deals, promotions, coupon codes
- /dashboard/settings — profile, hours, ordering, notifications, share/QR
- /dashboard/billing — subscription + **Platform fee** (commission) + Stripe Connect

### Admin Panel
- /admin — platform overview
- /admin/restaurants — list all restaurants
- /admin/restaurants/[id] — restaurant detail, commission override
- /admin/restaurants/[id]/emails — email template editor
- /admin-login — admin authentication

- /admin/settings — registration mode toggle

### Auth
- /login — restaurant staff login
- /register — multi-step restaurant registration
- /admin-login — platform admin login

## API Routes (Sprint 10)
| Route | Methods | Purpose |
|-------|---------|---------|
| /api/auth/register | POST | Create restaurant + owner staff |
| /api/auth/login | POST | Staff login |
| /api/auth/logout | POST | Clear session |
| /api/auth/admin-login | POST, DELETE | Admin login/logout |
| /api/menu/[slug] | GET | Public menu data |
| /api/menu/categories | GET, POST | Category CRUD |
| /api/menu/categories/[id] | PATCH, DELETE | Update/delete category |
| /api/menu/products | GET, POST | Product CRUD |
| /api/menu/products/[id] | PATCH, DELETE | Update/delete product |
| /api/orders | GET | Active orders for KDS |
| /api/orders/[id] | GET | Order detail |
| /api/orders/[id]/accept | POST | Accept order (`prep_time_mins` sets `ready_at`) |
| /api/orders/[id]/reject | POST | Reject order |
| /api/orders/[id]/status | GET | Public order status poll (waiting page) |
| /api/orders/check-expired | GET | Cancel PENDING orders past `accept_by` |
| /api/orders/[id]/preparing | POST | Mark preparing |
| /api/orders/[id]/ready | POST | Mark ready |
| /api/orders/[id]/collected | POST | Mark collected |
| /api/orders/[id]/refund | POST | Cancel or refund payment |
| /api/admin/orders/[id]/refund | POST | Admin refund (partial OK) |
| /api/restaurant/settings | GET, PATCH | Restaurant settings |
| /api/stripe/create-intent | POST | Payment + order creation |
| /api/stripe/webhook | POST | Payment confirmation |
| /api/stripe/connect | POST | Stripe Connect onboarding |
| /api/admin/restaurants | GET, POST | Admin restaurant list/create |
| /api/admin/settings | GET, PATCH | Platform settings (registration mode) |
| /api/admin/restaurants/[id]/approve | POST | Approve pending registration |
| /api/admin/restaurants/[id]/reject | POST | Reject pending registration |
| /api/admin/restaurants/[id] | GET, PATCH | Admin restaurant detail |
| /api/admin/restaurants/[id]/email-templates | GET, POST | List/save email templates |
| /api/admin/restaurants/[id]/email-templates/[type] | PATCH, POST | Update/reset/preview/test template |
| /api/settings/registration | GET | Public registration mode |
| /api/dashboard/promotions | GET, POST | List/create promotions |
| /api/dashboard/promotions/[id] | PATCH, DELETE | Update/pause/delete promotion |
| /api/dashboard/promotions/[id]/coupons | GET, POST | Coupon codes for promotion |
| /api/promotions/validate | POST | Validate coupon or auto-apply order discount |

## Promotions & Coupon Codes
- Models: `Promotion`, `CouponCode`, `OrderDiscount` (migration: `add_promotions_coupons`)
- Promotion types: `PERCENTAGE_OFF`, `FIXED_OFF`, `BUY_X_GET_Y`, `FREE_ITEM`, `HAPPY_HOUR`
- Set meals / bundles are **menu items** (`MenuItem.is_bundle = true`) with modifier groups — not promotions
- `applies_to`: `order` (whole order), `category`, `items` — with `applicable_ids` JSON
- Conditions: min order, date range, days of week, happy-hour time range, max uses
- Menu badges: `badge_text`, `badge_color`, `show_on_menu` — shown on public menu
- Coupon flow: customer enters code on basket → `POST /api/promotions/validate` → stored in localStorage basket → passed to `create-intent`
- Auto-apply: order-level promotions **without** linked coupon codes apply best discount at basket
- Order fields: `discount_total`, `coupon_code`; `OrderDiscount` records audit trail
- Commission calculated on **discounted** food subtotal (`app/lib/service-fee.ts`)
- Dashboard: `/dashboard/promotions` — create, pause, delete; admin view on `/admin/restaurants/[id]`
- Lib: `app/lib/promotions.ts` — validation, discount calculation, menu promos, usage increment
- Lib: `app/lib/promotion-config.ts` — type-specific config, previews, banner text
- Dashboard form: type-specific fields per promo (`PERCENTAGE_OFF`, `FIXED_OFF`, `BUY_X_GET_Y`, `FREE_ITEM`, `HAPPY_HOUR`) with live preview
- Extended config stored in `promo_config` JSON (buy/get scopes, free item target)
- Set meals: Menu → Add item → enable “Set meal / bundle” → add modifier groups (`Select Starter`, `Select Main`); fixed `price_pence`; public menu shows “Set meal” badge
- Public menu: scrolling promotions banner; basket shows hints and free-item claim flow
- Validate API: per-type discount logic, hints mode, free-item qualification check

### kaji-order ↔ kaji-pos promotions mapping (future sync)
| kaji-order | kaji-pos Discount |
|------------|-------------------|
| `PERCENTAGE_OFF` | `discount_type: PERCENTAGE` |
| `FIXED_OFF` | `discount_type: FIXED` |
| `CouponCode.code` | `promo_code` |
| `OrderDiscount` | POS order discount line |
| `discount_pence` | same value on both systems |

When an online order syncs to POS, `OrderDiscount` rows map to POS order discounts with matching `discount_pence`.

## Lib Modules
- app/lib/prisma.ts — Prisma client singleton
- app/lib/auth.ts — JWT staff sessions (kaji_order_session)
- app/lib/admin-auth.ts — JWT admin sessions (kaji_order_admin_session)
- app/lib/email.ts — Resend order emails (uses template system)
- app/lib/email-renderer.ts — Mustache-style template rendering + DB lookup
- app/lib/email-templates/ — Template types, variables, default HTML
- prisma/email-template-defaults.ts — Global default template HTML (seeded)
- app/lib/stripe.ts — Stripe client
- app/lib/basket.ts — localStorage basket helpers
- app/lib/opening-hours.ts — UK timezone open/pre-order status (`getOpenStatus`)
- app/lib/hours.ts — re-exports from opening-hours.ts (deprecated direct use)
- app/lib/utils.ts — Formatting, slugs, URLs
- app/lib/orders.ts — Order number + ownership helpers
- app/lib/order-expiry.ts — `accept_by` expiry, PI cancel, prep fields on accept
- app/lib/promotions.ts — promotion validation, discount calc, auto-apply, menu badges

## KDS/Order Management
- Tabs: **Live** (Kanban, active statuses, ~15s refresh), **Today** (all today’s orders + stats), **Archive** (date range, search, filters, CSV export)
- Mobile-first Kanban board (Live tab)
- Sound alerts on new orders; urgent alert + accept countdown in **manual** mode
- Browser push notifications
- Dynamic countdown timers (`accept_by`, prep)
- Accept modal: chef picks prep minutes → `ready_at` + customer email
- PWA (add to home screen)
- Dark mode

## Order acceptance modes
Restaurant settings (Ordering tab): `order_mode` + `acceptance_timer_mins` (1–15, manual only).

| Mode | Value | Behaviour |
|------|-------|-----------|
| Instant | `instant` (default) | Order confirmed after payment; `ready_at` from `avg_prep_minutes` (Settings → default preparation time) |
| Manual | `manual` | Stays `PENDING` until accept/reject; `accept_by` = now + timer; customer on `/[slug]/waiting/[orderId]` |

- **Instant prep:** `restaurant.avg_prep_minutes` → `prep_time_mins`, `ready_at`, `estimated_time` on webhook (`payment_intent.succeeded`) or dev create-intent; customer sees “Ready at 4:45pm” on confirmation + email
- **Manual accept:** `POST /api/orders/[id]/accept` with `{ prep_time_mins }` (chef picks in KDS modal) → `ready_at`, `estimated_time`, confirmation email
- **Reject / timeout:** reject API or `check-expired` / status poll → `CANCELLED`, PaymentIntent cancelled
- Checkout redirects to waiting page when `order_mode === 'manual'`

## Waiting page flow
`/[slug]/waiting/[orderId]` polls `GET /api/orders/[id]/status` every 3s.

- **PENDING:** spinner, acceptance countdown (`accept_by`)
- **ACCEPTED:** ready time + prep; redirect to confirmation after 3s
- **REJECTED / CANCELLED:** not charged; link back to menu

## kaji-order ↔ kaji-pos status mapping
Future POS sync reference: `OnlineOrder.pos_order_id`, `OnlineOrderItem.pos_item_id`.

| kaji-order | kaji-pos OrderStatus |
|------------|----------------------|
| PENDING | OPEN (incoming) |
| ACCEPTED | OPEN (confirmed) |
| PREPARING | OPEN (cooking) |
| READY | PAID (ready for collection) |
| COLLECTED | CLOSED |
| REJECTED | CANCELLED |
| CANCELLED | CANCELLED |

**Order type:** `COLLECTION` → kaji-pos `TAKEAWAY`; `DELIVERY` → `DELIVERY`.

## OnlineOrder reporting fields
Populated at order creation (`getWeekNumber()` in `app/lib/utils.ts`) for analytics aligned with kaji-pos:

- `payment_method` (default `CARD`), `source` (default `online`)
- `day_of_week`, `hour_of_day`, `week_number`, `month_number`
- Manual acceptance: `accept_by`, `prep_time_mins`, `estimated_time`, `ready_at`, `estimated_ready_at`

## Order Statuses
PENDING → ACCEPTED → PREPARING → READY → COLLECTED
         → REJECTED (with reason)
         → CANCELLED (payment cancelled before capture)
         → REFUNDED (payment refunded after capture)

## Refunds
- POST `/api/orders/[id]/refund` — restaurant staff (full refund only)
- POST `/api/admin/orders/[id]/refund` — admin override (partial allowed)
- Payment phases: `authorised` (cancel PI) | `captured` (Stripe refund) | `cancelled` | `refunded`
- Legacy statuses `pending`/`paid` map to authorised/captured
- CommissionRecord status set to REFUNDED on refund
- Webhook `charge.refunded` confirms refund in DB
- Customer email: refund amount + 3–5 working days notice (template: `refund_confirmation`)

## Email Templates
- `EmailTemplate` model: per-restaurant custom or global default (`restaurant_id = null`)
- Template types: `order_confirmation`, `new_order_alert`, `refund_confirmation`
- Renderer supports `{{variable}}`, `{{#if}}`, `{{#each}}`, and `[PRIMARY_COLOR]`
- Global defaults seeded via `npx prisma db seed` (migration: `add_email_templates`)
- Admin editor: `/admin/restaurants/[id]/emails` — edit subject/HTML, preview, send test, reset
- Order confirmation: receipt-style items block (`ORDER RECEIPT`), `ready_at` + prep when set
- New order alert: urgent design with Accept/Reject dashboard links
- Fallback chain: restaurant custom → global DB → built-in defaults

## Opening Hours and Pre-orders
- All hour checks use **Europe/London** timezone via `getOpenStatus()` in `app/lib/opening-hours.ts`
- Supports both hour JSON formats: `{ monday: { openTime, closeTime } }` and `{ mon: { from, to } }`
- Null/empty `opening_hours` → always open
- Restaurant settings (Ordering tab):
  - `show_menu_when_closed` — browse menu when closed vs closed page only
  - `accept_preorders` — allow checkout outside hours (before open AND after close)
  - `preorder_days_ahead` — max days ahead for next open slot (1–7)
  - `collection_enabled` — master ordering switch (blocks all orders when false)
- Pre-orders stored on `OnlineOrder.is_preorder` + `preorder_for`
- Only blocked when `holiday_mode` or `collection_enabled = false`
- Migration: `add_preorder_settings`

## Commission Tracking
- Restaurant dashboard does **not** show commission; use **Platform fee** on `/dashboard/billing` only
- Every order records food commission in `commission_pence` (OnlineOrder)
- Service fee stored in `OnlineOrder.service_fee_pence`
- `CommissionRecord` splits: food commission, service fee, total platform revenue
- Monthly commission report in admin
- Stripe invoice generated per restaurant
- Stripe Connect automates collection (Sprint 12)

## Delivery Features
- UK postcode validation (postcodes.io free API)
- Delivery radius (km)
- Custom postcode include/exclude rules
- Delivery fee per zone
- Minimum order per zone
- Address autocomplete (Google Places)

## Critical Rules
- Next.js 15.5.15 ONLY
- Prisma 6.19.3 ONLY — never upgrade to 7
- PORT=3002 always in dev
- All prices in pence (integers only)
- Never commit .env files
- binaryTargets: ["native", "debian-openssl-3.0.x", "linux-musl-openssl-3.0.x"]
- force-dynamic on all DB/auth pages
- Apostrophes in JSX: use &apos;

## Deployment
Server: New IONOS VPS (order.kajipos.co.uk)
Process: PM2
Proxy: Nginx
SSL: Let's Encrypt

Deploy commands:
ssh user@OOS_SERVER_IP
cd /var/www/kaji-order
git stash
git pull origin main
npm install
npx prisma migrate deploy
npm run build
pm2 restart kaji-order
pm2 save

## Sprint Status
Sprint 10 — Complete
- [x] Project setup
- [x] SaaS framework + admin
- [x] Restaurant onboarding
- [x] Menu management
- [x] Public menu page
- [x] Basket + checkout
- [x] Stripe Connect (scaffold + dev fallback)
- [x] KDS Kanban dashboard
- [x] Sound alerts + notifications
- [x] Order management
- [x] Commission tracking
- [x] Email notifications
- [x] PWA manifest
- [x] QR code + share links in settings

Sprint 11 (planned)
- Delivery + postcode validation
- Menu scheduling
- Product photos upload
- Customer accounts
- Loyalty points
- kaji-pos KDS integration

Sprint 12 (planned)
- Stripe Connect automation
- White label custom domains
- Multi-site per restaurant

## Models (see prisma/schema.prisma for full details)
Restaurant, RestaurantStaff, MenuCategory, MenuItem,
ModifierGroup, Modifier, OnlineOrder, OnlineOrderItem,
CommissionRecord, DeliveryZone, PostcodeRule, AdminUser, PlatformSettings,
EmailTemplate, Promotion, CouponCode, OrderDiscount

Restaurant.status: pending | active | suspended
PlatformSettings.registration_mode: request | self_serve

Restaurant fields added Sprint 10:
collection_enabled, min_order_pence, avg_prep_minutes,
auto_accept_delay_minutes, email_notifications, sound_alerts

Restaurant fields added Sprint 11:
accept_preorders, preorder_days_ahead, show_menu_when_closed

Restaurant fields (acceptance / prep):
order_mode (`instant` | `manual`), acceptance_timer_mins

OnlineOrder fields added Sprint 10:
stripe_payment_status (pending | paid | failed | refunded)

OnlineOrder fields added Sprint 11:
service_fee_pence (default 49)
is_preorder, preorder_for

OnlineOrder fields (acceptance / reporting / POS):
ready_at, estimated_ready_at, estimated_time, prep_time_mins, accept_by
payment_method, source, day_of_week, hour_of_day, week_number, month_number, pos_order_id

OnlineOrder fields (promotions):
discount_total, coupon_code; relation `discounts` → OrderDiscount

MenuItem fields (set meals):
is_bundle — fixed-price combo with modifier choice groups; shown as “Set meal” on public menu

OnlineOrderItem: pos_item_id, modifiers_text

PlatformSettings fields added Sprint 11:
service_fee_pence (default 49)

CommissionRecord fields added Sprint 11:
food_commission_pence, service_fee_pence, total_platform_pence

## Session Log
Session 1 (June 2026):
- Project initialized
- Full schema created
- CLAUDE.md written
- GitHub repo created

Session 2 (June 2026):
- Sprint 10 Phase 1 complete
- Auth, dashboard, KDS, menu, public ordering, admin panel
- Stripe + email integration (with dev fallbacks)
- PWA manifest + QR/share in settings

Session 3 (June 2026):
- Professional HTML email templates (order confirmation, new order alert, refund)
- EmailTemplate model + admin template editor with preview/test
- Mustache-style renderer with global defaults seeded in DB

Session 4 (June 2026):
- Order acceptance modes (instant/manual), waiting page, prep timer on accept
- KDS Live/Today/Archive, order expiry API, reporting fields + POS status mapping docs
- Dashboard avg order value; billing Platform fee label; receipt-style confirmation email
