# kaji-order — Master Architecture
# Paste at start of any architectural discussion

---

## What It Is
**Standalone white-label online ordering SaaS** — part of Kaji POS ecosystem, runs independently.

| Repo | Path | Role |
|------|------|------|
| kaji-order | ~/kaji-order | This app (OOS) |
| kaji-cloud | ~/kaji-cloud | SaaS platform |
| kaji-pos | ~/kaji-pos | Local POS |

---

## Stack (locked versions)

| Layer | Tech | Version | Rule |
|-------|------|---------|------|
| Framework | Next.js | **15.5.15** | NOT 16.x |
| UI | React | 19.x | |
| DB | PostgreSQL | 17.x | DB: `kaji_order` |
| ORM | Prisma | **6.19.3** | NEVER v7 |
| Payments | Stripe Connect | latest | Platform fees |
| Email | Resend | latest | |
| CSS | Tailwind | 4.x | |

---

## Ports & URLs

| Env | Port / URL |
|-----|------------|
| kaji-order dev | **3002** |
| kaji-pos | 3000 |
| kaji-cloud dev | 3001 |
| Production | order.kajipos.co.uk |

---

## Data & Integration

```
kaji-order (own DB: kaji_order)
    │
    ├── NO shared tables with kaji-cloud
    │
    └── API only → kaji-cloud (KAJI_CLOUD_API_URL)
            ├── Menu sync (POS linked)
            ├── Order push → POS KDS
            └── Restaurant verification
```

**Restaurant types**
| Type | menu_source | Behaviour |
|------|-------------|-----------|
| OOS only | `manual` | Menu in kaji-order dashboard |
| POS + OOS | `kaji_sync` | Sync via kaji-cloud; orders → KDS; `kaji_cloud_id` links |

---

## Pricing Plans

| Plan | Price | Commission |
|------|-------|------------|
| COMMISSION (default) | £0/mo | 5%/order |
| MONTHLY | £39/mo | 0% |
| WEEKLY | £9.99/wk | 0% |
| BUNDLE | £29/mo | 0% (with kaji-pos CLOUD) |

**Stripe Connect:** Kaji Digital platform → restaurant Express accounts → auto fee at `commission_pct%` → webhook `/api/stripe/webhook`

---

## Routes

**Public:** `/[slug]` · `/[slug]/basket` · `/[slug]/checkout` · `/[slug]/confirmation/[id]` · `/[slug]/track/[id]`

**Dashboard:** `/dashboard` · `/dashboard/orders` (KDS) · `/dashboard/menu` · `/dashboard/settings` · `/dashboard/billing`

**Admin:** `/admin` · `/admin/restaurants` · `/admin/commission`

---

## Order Flow

```
PENDING → ACCEPTED → PREPARING → READY → COLLECTED
       ↘ REJECTED (reason + auto refund)
       ↘ CANCELLED (customer / timeout)
```

**KDS:** Mobile Kanban · sound + push alerts · countdown timers · auto-accept · PWA · dark mode

**Commission:** `commission_pence` per order → admin monthly report → Stripe invoice (Sprint 12: auto collection)

---

## Delivery (Sprint 11+)
postcodes.io validation · radius (km) · include/exclude rules · zone fees & minimums · Google Places autocomplete

---

## Critical Rules
- Next.js **15.5.15** · Prisma **6.19.3** · `PORT=3002` in dev
- All prices in **pence** (integers)
- Never commit `.env`
- Prisma `binaryTargets`: `native`, `debian-openssl-3.0.x`, `linux-musl-openssl-3.0.x`
- `force-dynamic` on all DB/auth pages
- JSX apostrophes: `&apos;`

---

## Deploy (IONOS VPS)
PM2 + Nginx + Let's Encrypt

```bash
cd /var/www/kaji-order && git pull origin main
npm install && npx prisma migrate deploy && npm run build
pm2 restart kaji-order && pm2 save
```

---

## Sprint Snapshot
**S10 (now):** setup · SaaS/admin · onboarding · menu · public pages · checkout · Stripe · KDS · commission · email

**S11:** delivery · scheduling · photos · customer accounts · loyalty · POS KDS

**S12:** Stripe automation · custom domains · multi-site

---

## Models
`Restaurant` · `RestaurantStaff` · `MenuCategory` · `MenuItem` · `ModifierGroup` · `Modifier` · `OnlineOrder` · `OnlineOrderItem` · `CommissionRecord` · `DeliveryZone` · `PostcodeRule` · `AdminUser`

→ Full schema: `prisma/schema.prisma`
