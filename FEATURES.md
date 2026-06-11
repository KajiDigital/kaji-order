# kaji-order — Feature Specification

## Phase 1 (Sprint 10 — Build Now)

### 1. SaaS Multi-Restaurant Framework
- Admin creates restaurant accounts
- Restaurant self-registers
- Each restaurant has unique slug
- White label: logo, colors, description
- Admin panel: list, view, manage all restaurants

### 2. Restaurant Profile
- Name, address, postcode, phone
- Logo upload (URL for now)
- Banner image URL
- Description
- Primary brand color

### 3. Opening Hours
- Per day: open/closed toggle
- Open time + close time per day
- Holiday mode (pause all orders)
- Holiday message shown to customers
- Auto-close outside opening hours

### 4. Menu Management
- Categories (name, color, sort order)
- Products (name, description, base price, image, dietary flags, featured)
- Option groups — SINGLE / MULTIPLE / OPTIONAL (size, filling, extras)
- Combo groups — set meals with course selection (ITEMS, CATEGORY, or ANY source)
- 4-tab item editor: Basic, Options, Combo (bundles), Pricing
- Drag to reorder (future)
- Bulk price change (future)

### 5. Public Menu Page /[slug]
- Restaurant branding (logo, banner, colors)
- Category tabs (horizontal scroll)
- Product grid (2-3 columns, mobile first)
- Product modal (dietary badges, option groups, combo courses, live price, validation)
- Basket floating button (item count + total)
- Collection only (Phase 1)
- Closed state (outside hours or holiday mode)

### 6. Basket
- localStorage persistence (v2 key with full selection snapshots)
- Add/remove/update quantities
- Selections shown per item (options + combo picks)
- Order notes
- Subtotal + delivery fee + total
- Minimum order check

### 7. Checkout
- Customer name (required)
- Email (required)
- Phone (optional)
- Notes (optional)
- Order summary (read only)
- Stripe Payment Element
- Apple Pay / Google Pay automatic
- Place order button

### 8. Payment (Stripe Connect)
- Customer pays via Stripe
- Platform fee automatically split
- Restaurant receives: total - commission%
- Kaji receives: commission%
- Payment confirmation webhook

### 9. Order Confirmation
- Confirmation page with order number
- Customer email: order details + estimated time
- Restaurant email: new order alert

### 10. KDS Kanban Dashboard
- Mobile-first 4-column Kanban
- Columns: Pending | Accepted | Preparing | Ready
- Order cards with: number, customer, items, total, timer
- One-tap status updates
- Sound alert on new order
- Browser push notifications
- Dynamic countdown (accept within X minutes)
- Auto-accept option (configurable)
- Dark mode
- PWA (add to home screen)

### 11. Order Management
- Accept order (with estimated time)
- Reject order (with reason)
- Mark preparing
- Mark ready
- Mark collected
- Order history
- Search/filter orders

### 12. Commission Tracking
- Every order records: total, %, commission pence
- Dashboard: today/week/month commission
- Admin: all restaurants commission report
- Monthly Stripe invoice generation
- Payment status tracking

### 13. Admin Panel
- List all restaurants
- Create restaurant account
- Send invite email
- View restaurant details
- Override commission %
- Generate invoice
- View all orders
- Commission report

## Phase 2 (Sprint 11)

### 14. Delivery
- Enable/disable per restaurant
- Delivery radius (km)
- UK postcode validation
- Custom postcode rules (include/exclude)
- Delivery fee per zone
- Address autocomplete (Google Places)
- Minimum order for delivery

### 15. Customer Accounts
- Register/login
- Order history
- Saved addresses
- Favourite restaurants

### 16. Loyalty Points
- Points per £ spent
- Redeem at checkout
- Restaurant configures rate

### 17. Menu Scheduling
- Category available from/until time
- e.g. Breakfast until 11am
- Automatic hide/show

### 18. Product Photos
- Upload via URL (Phase 1)
- Direct upload (Phase 2)
- Cloudflare R2 or similar

## Phase 3 (Sprint 12)

### 19. White Label Custom Domains
- Restaurant enters: order.theirsite.co.uk
- Vercel API adds domain automatically
- SSL provisioned automatically
- Full white label (no Kaji branding)

### 20. Stripe Connect Automation
- Restaurant onboards Stripe
- Automatic platform fee collection
- No manual invoicing needed

### 21. kaji-pos Integration
- Menu sync from POS to OOS
- Online orders appear on KDS
- Bidirectional menu sync
