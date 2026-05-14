## Goal

Add a Product Catalog page available to all roles (admin, manager, rep, dealer) that mirrors the screenshot UI, syncs products from BigCommerce, supports a quote cart, and submits quotes to Acctivate / customer service as a sales order.

## Scope

### 1. Roles & Auth
- Add `dealer` role to existing `app_role` enum (currently admin/manager/rep).
- New table `user_dealers` linking auth users to a dealer (mirrors `user_reps` / `user_managers`).
- Helper SQL fn `current_dealer_id()`.
- Update `useUserRole` hook to detect dealer role and `dealerId`.

### 2. BigCommerce sync (catalog source of truth)
- New edge function `sync-bigcommerce` — pulls products + variants + images + price lists + customer groups from BigCommerce via Store API (`/v3/catalog/products`).
- Extend `products` table with: `bc_product_id`, `description`, `image_url`, `base_price`, `is_active`, `stock_status`, `inventory_level`.
- New table `product_price_tiers` (product_id, customer_group_label, price) for dealer-tier pricing pulled from BigCommerce price lists.
- Map `dealers.buying_group` (or new `dealers.price_tier` column) → BigCommerce customer group label so each dealer sees the right price.
- Required secrets: `BIGCOMMERCE_STORE_HASH`, `BIGCOMMERCE_ACCESS_TOKEN`.

### 3. Quote cart
- New tables:
  - `quotes` (id, user_id, dealer_id, status [draft/submitted/processed], submitted_at, notes, total).
  - `quote_items` (quote_id, product_id, sku, name, qty, unit_price, line_total).
- RLS: users see/edit own draft quotes; admins/managers see all; dealers see own.
- React Query hooks `useQuotes`, `useCart` (draft quote per user).

### 4. UI
- New page `/catalog` (`src/pages/CatalogPage.tsx`) accessible to all authenticated users — added to `App.tsx` routes and sidebar nav.
- Components:
  - `CatalogGrid` — card grid matching screenshot (image, SKU, name, brand chip, category chip, price, Add to Cart, Out of Stock badge).
  - Search bar + Brand filter dropdown + Category filter dropdown + grid/list view toggle + "New Arrivals" filter.
  - `QuoteCartDrawer` — slide-out cart with line items, qty, remove, totals, Submit Quote button.
- New page `/catalog/quotes` listing user's submitted quotes.

### 5. Submit Quote → Acctivate
- New edge function `submit-quote-to-acctivate` — receives quote id, validates, marks status `submitted`, then either:
  - Posts to Acctivate Web API (if endpoint/credentials provided), OR
  - Sends a transactional email to customer service (existing email infra) with quote details + creates an internal notification.
- Required secret (optional now): `ACCTIVATE_API_URL`, `ACCTIVATE_API_KEY`. Without it, fall back to email-only flow.
- Customer service email recipient stored as secret `CUSTOMER_SERVICE_EMAIL`.

## Technical details

- Backend: schema migration adds `dealer` enum value, `user_dealers`, extends `products`, adds `product_price_tiers`, `quotes`, `quote_items`. RLS policies for each. Helper fns.
- Edge functions deploy automatically. Sync function callable manually or on cron.
- Pricing resolution at read time: join `products` → `product_price_tiers` filtered by current user's dealer tier; fallback to `base_price`.
- Cart persists server-side (one draft quote per user) so it survives reload and is visible to support staff.

## Out of scope (this iteration)
- Real-time BigCommerce stock webhooks
- Payment / BigCommerce checkout
- Image upload / management (we use BC's image URLs directly)

## Open items I'll request after approval
- BigCommerce Store Hash + Access Token (via secret prompt)
- Customer service email address
- Optional Acctivate API endpoint/key — if not provided, quotes go to customer service via email + portal notification
