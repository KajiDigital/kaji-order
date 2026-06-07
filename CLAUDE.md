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
Automatic platform fee: commission_pct %
Webhook: /api/stripe/webhook

## Key Features
### Public Ordering
- /[slug] — restaurant menu
- /[slug]/basket — cart
- /[slug]/checkout — payment
- /[slug]/confirmation/[orderId] — confirmed
- /[slug]/track/[id] — order status (Sprint 11)

### Restaurant Dashboard
- /dashboard — overview
- /dashboard/orders — Kanban KDS
- /dashboard/menu — menu management
- /dashboard/settings — profile, hours, ordering, notifications, share/QR
- /dashboard/billing — subscription + commission + Stripe Connect

### Admin Panel
- /admin — platform overview
- /admin/restaurants — list all restaurants
- /admin/restaurants/[id] — restaurant detail, commission override
- /admin-login — admin authentication

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
| /api/orders/[id]/accept | POST | Accept order |
| /api/orders/[id]/reject | POST | Reject order |
| /api/orders/[id]/preparing | POST | Mark preparing |
| /api/orders/[id]/ready | POST | Mark ready |
| /api/orders/[id]/collected | POST | Mark collected |
| /api/restaurant/settings | GET, PATCH | Restaurant settings |
| /api/stripe/create-intent | POST | Payment + order creation |
| /api/stripe/webhook | POST | Payment confirmation |
| /api/stripe/connect | POST | Stripe Connect onboarding |
| /api/admin/restaurants | GET, POST | Admin restaurant list/create |
| /api/admin/restaurants/[id] | GET, PATCH | Admin restaurant detail |

## Lib Modules
- app/lib/prisma.ts — Prisma client singleton
- app/lib/auth.ts — JWT staff sessions (kaji_order_session)
- app/lib/admin-auth.ts — JWT admin sessions (kaji_order_admin_session)
- app/lib/email.ts — Resend order emails
- app/lib/stripe.ts — Stripe client
- app/lib/basket.ts — localStorage basket helpers
- app/lib/hours.ts — Opening hours validation
- app/lib/utils.ts — Formatting, slugs, URLs
- app/lib/orders.ts — Order number + ownership helpers

## KDS/Order Management
- Mobile-first Kanban board
- Sound alerts on new orders
- Browser push notifications
- Dynamic countdown timers
- Auto-accept configuration
- PWA (add to home screen)
- Dark mode

## Order Statuses
PENDING → ACCEPTED → PREPARING → READY → COLLECTED
         → REJECTED (with reason + auto refund)
         → CANCELLED (customer or timeout)

## Commission Tracking
- Every order records commission_pence
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
CommissionRecord, DeliveryZone, PostcodeRule, AdminUser

Restaurant fields added Sprint 10:
collection_enabled, min_order_pence, avg_prep_minutes,
auto_accept_delay_minutes, email_notifications, sound_alerts

OnlineOrder fields added Sprint 10:
stripe_payment_status (pending | paid | failed | refunded)

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
