# Sprint 13 — POS + Online Ordering Integration

> Cross-repo sprint. Same spec in `kaji-order`, `kaji-cloud`, and `kaji-pos`.
> Work is **not started**. Online orders do **not** appear on POS today.

**Goal:** A restaurant with both kaji-pos and kaji-order sees website orders on the till Kitchen and Takeaway boards, with the same repeating alarm, and can accept them there.

**Architecture:** Three apps, three databases, API only. kaji-cloud is the broker. POS stays the menu source of truth for linked accounts. kaji-order pushes paid orders to cloud; the till pulls them and writes status back.

**Locked stack:** Next.js 15.5.15 · Prisma 6.19.3 · prices in pence · no Prisma 7

---

## Current state (Oct 2026)

| Path | Status |
|------|--------|
| kaji-order KDS (`/dashboard/orders`) | Live. Website orders stay here. Loud alarm repeats until accept. |
| kaji-pos Kitchen / Takeaway | Live for till-created tickets only. Same alarm pattern. |
| `Restaurant.kaji_cloud_id` + `menu_source: kaji_sync` | Schema exists. No admin link UI. Almost all venues are `manual`. |
| `OnlineOrder.pos_order_id` / `OnlineOrderItem.pos_item_id` | Columns exist. Never written. |
| `queueKajiCloudMenuSync` → `POST /api/oos/menu/changes` | Stub. Cloud route does **not** exist. |
| Cloud `online_ordering` feature flag | Label exists. Seeded **off**. No OOS APIs. |
| POS → cloud sync | Live: menu / staff / settings / **closed** orders **up**. Menu-change **pull**. No inbound online-order pull. |

Until this sprint ships, run both boards: website orders on kaji-order KDS, till orders on POS.

---

## Target flow

```
Customer pays on order.kajipos.co.uk
        │
        ▼
kaji-order writes OnlineOrder (own DB)
        │  POST /api/oos/orders   (KAJI_CLOUD_API_URL + API key)
        ▼
kaji-cloud queues inbound order (pending pull)
        │  GET /api/pos/sync/online-orders  (licence header, ~5s poll)
        ▼
kaji-pos creates TAKEAWAY or DELIVERY
  status OPEN · takeawayProgress NEW · lines SENT
  OnlineOrder.pos_order_id set via callback
        │
        ▼
POS Kitchen + Takeaway alarm until ACCEPT
        │  POST /api/pos/sync/online-orders/status
        ▼
kaji-order updates OnlineOrder status (customer waiting page / email)
```

OOS-only restaurants (`menu_source: manual`) are unchanged. They never hit this path.

---

## Account link

A venue has both products when:

1. kaji-cloud `Restaurant` exists and POS is linked (`CloudConfig` / till licence).
2. kaji-order `Restaurant.kaji_cloud_id` = that cloud id.
3. kaji-order `menu_source` = `kaji_sync`.
4. Cloud feature `online_ordering` is on for that restaurant.

**Admin (kaji-order):** restaurant Details tab — paste / pick cloud restaurant id, set source to `kaji_sync`. Do not guess ids.

**Admin (kaji-cloud):** enable `online_ordering`. Show whether OOS is linked.

---

## Status and type mapping

| kaji-order | kaji-pos order | kaji-pos takeawayProgress | kaji-pos lines |
|------------|----------------|---------------------------|----------------|
| PENDING | OPEN (incoming) | NEW | SENT |
| ACCEPTED | OPEN (confirmed) | PREPARING | COOKING |
| PREPARING | OPEN (cooking) | PREPARING | COOKING |
| READY | PAID (ready) | READY | READY |
| COLLECTED | CLOSED | COMPLETED | READY / SERVED |
| REJECTED | CANCELLED | — | VOIDED |
| CANCELLED | CANCELLED | — | VOIDED |
| REFUNDED | stays as paid/closed + POS refund if needed | — | — |

**Order type:** `COLLECTION` → `TAKEAWAY`. `DELIVERY` → `DELIVERY`.

Accept on **either** board is source of truth for that transition. Write back immediately so the customer waiting page does not stall.

---

## Menu (linked accounts only)

POS is source of truth.

1. POS already pushes menu snapshots to cloud (`POST /api/pos/sync/menu`).
2. kaji-order **pulls** that snapshot into OOS categories/items when `menu_source === kaji_sync`.
3. Map POS `VariationGroup` / `Variation` → OOS `OptionGroup` / `Option`.
4. Set meals / `ComboGroup` stay OOS-only (no POS equivalent).
5. Store POS item id on `OnlineOrderItem.pos_item_id` at checkout so the till can create lines without name-matching.

Do **not** implement OOS → POS menu write in this sprint. The existing `queueKajiCloudMenuSync` stub stays unused for `kaji_sync` venues (or no-ops).

Photos stay on the order VPS (`uploads/`). Cloud does not store menu images.

---

## Promotions on the pushed order

| kaji-order | kaji-pos |
|------------|----------|
| `PERCENTAGE_OFF` | `discount_type: PERCENTAGE` |
| `FIXED_OFF` | `discount_type: FIXED` |
| `CouponCode.code` | `promo_code` |
| `OrderDiscount.discount_pence` | same pence on the POS discount line |

BUY_X_GET_Y / FREE_ITEM / HAPPY_HOUR: send as a single `OrderDiscount` pence total if POS has no matching type yet.

---

## Work by repo

### kaji-order

- [ ] Admin: link `kaji_cloud_id`, set `menu_source`.
- [ ] After payment confirm (webhook + dev create-intent): if linked, `POST` order payload to cloud. Retry + log failures. Do not fail the customer payment if POS is offline.
- [ ] Payload: order id, number, type, customer, items (`pos_item_id` when known), selections, totals, service fee, discounts, notes, `is_preorder` / `preorder_for`, accept mode.
- [ ] Receive POS status callbacks; update `OnlineOrder` + customer emails the same as local KDS accept/reject.
- [ ] Pull POS menu snapshot on a short interval (or webhook from cloud) for `kaji_sync` venues.
- [ ] Keep local OOS KDS working even when POS is down (source of truth for payment is still kaji-order).

### kaji-cloud

- [ ] `POST /api/oos/orders` — API key from kaji-order. Queue inbound order (`pending` until POS acks).
- [ ] `GET /api/pos/sync/online-orders` — licence auth. Return pending inbound orders for that `restaurant_id`.
- [ ] `PATCH` ack with `pos_order_id`.
- [ ] `POST /api/pos/sync/online-orders/status` — POS → OOS status relay.
- [ ] Persist queue (new model, e.g. `OnlineOrderPush`). Do not stuff this into `SyncRecord` menu JSON.
- [ ] Feature flag `online_ordering` gates the APIs.
- [ ] Admin: show queue / last push / last POS pull.

### kaji-pos

- [ ] Poll inbound online orders every few seconds while cloud-linked (not the 15‑minute backup interval).
- [ ] Create `Order` + lines + takeaway fields. Kitchen ticket + `/takeaway` row.
- [ ] Existing `IncomingOrderAlert` covers NEW / `needsAccept` — no second sound system.
- [ ] ACCEPT on Kitchen / Mark preparing on Takeaway writes status back to cloud.
- [ ] Reject / cancel on POS writes back (OOS cancels/refunds per existing payment rules).
- [ ] Offline: queue status writes; never block local till if cloud is down.
- [ ] `source` or notes: mark ticket as Online so staff can tell it from counter takeaway.

---

## Out of scope

- Loyalty
- Multi-site (Sprint 12 / POS Sprint 11)
- White-label domains
- Stripe Connect automation
- Shared database
- POS taking card payment for the online order (already paid on Stripe Connect)
- OOS editing the POS menu

---

## Test plan

1. Link a local venue: cloud restaurant + POS token + OOS `kaji_cloud_id` / `kaji_sync`.
2. Place a collection order on OOS (manual accept). Confirm it stays on OOS KDS.
3. Confirm it appears on POS Takeaway as NEW and Kitchen as a takeaway ticket within a few seconds.
4. Alarm repeats on POS until Accept.
5. Accept on POS → OOS moves to ACCEPTED, customer waiting page / email updates, alarm stops.
6. Reject on POS → OOS CANCELLED / not charged (manual) or refund rules (if already captured).
7. Unplug POS: customer can still pay; order remains on OOS KDS; cloud queue holds the push.
8. OOS-only venue (no `kaji_cloud_id`) is unaffected.

---

## Env

```
# kaji-order
KAJI_CLOUD_API_URL=http://localhost:3001   # prod: https://app.kajipos.co.uk
KAJI_CLOUD_API_KEY=

# kaji-pos (already used)
CLOUD_API_URL=http://localhost:3001        # prod: https://app.kajipos.co.uk
```

Ports stay **3002** (order) · **3001** (cloud dev) · **3000** (POS). Cloud production is port 3000 behind Nginx.
