# DZone Commerce — White Edition

A self-hosted-code, **single-vendor e-commerce starter application** for Sri Lanka built with Next.js App Router, React, PostgreSQL, server-side checkout and a custom admin dashboard. Ready for **configuration and deployment to Vercel**. No online payment gateway is integrated.

> **Important:** This is a complete source-code handoff, not a hosted/live website. It has not yet been validated with a live database, npm installation or a successful Vercel build in the creation environment. You must complete the installation, run an end-to-end test and set real business information **before** accepting customers. Demo items and template policies are not legally reviewed.

## What's included

### Storefront
- White DZone storefront; responsive desktop/mobile pages.
- Homepage with editable hero, categories, featured products and new arrivals.
- Search, category filtering, price sorting, product details and multiple variants.
- Device-persisted cart and wishlist, Buy Now, guest checkout.
- Checkout with server-calculated prices, district delivery fee and coupons.
- Cash on delivery and manual bank transfer only (no payment gateway).
- Optional private bank receipt upload when a private Vercel Blob store is connected.
- Customer registration, login, order history, cancellations, returns and verified-purchase review requests.
- Order status tracking by order number **and** email; contact/support form.
- Dynamic SEO metadata, `robots.txt`, `sitemap.xml`, editable content/policies.

### Administration (`/admin`)
- Dashboard with collected revenue, orders, low-stock counts and simple 7-day chart.
- Product/catalog create/edit, product images, variants, SKU, price and stock.
- Category manager, stock adjustments and inventory movement records.
- Order fulfillment, payment status verification, shipping tracking, invoice/order-slip page.
- Customer directory with account enable/disable, sales reports and CSV exports.
- Coupons, shipping zones, homepage banners, CMS content pages, store settings.
- Return approval/completion with stock restoration; review moderation; support ticket replies.
- Admin vs staff authorization; cookie/JWT session, server-side checks and audit logging.
- Optional order-confirmation and support-response emails through SMTP.

## Technology

- Next.js 16, React 19, TypeScript
- PostgreSQL + `pg` (SQL schema included; intentionally no ORM generation needed)
- `jose` sessions + bcrypt password hashing
- Lucide icons and custom responsive white CSS
- Optional public/private Vercel Blob
- Optional SMTP for transactional email

## Prerequisites

1. Node.js 24 LTS (recommended, >=24.11); Node.js >=22.18 is also accepted.
2. PostgreSQL database; use a **pooled SSL connection string** (Neon, Prisma Postgres or another compatible provider).
3. Vercel account for deployment; commercial stores must use an appropriate commercial plan (Vercel Hobby is non-commercial only).
4. GitHub for easiest deployment (or the Vercel CLI).

## Quick start (Windows PowerShell)

```powershell
# Extract ZIP, open PowerShell in the extracted dzone-commerce folder.
node -v
npm -v
npm install
Copy-Item .env.example .env
```

Edit `.env` with your actual PostgreSQL connection string and a strong secret:

```powershell
node -e "console.log(require('node:crypto').randomBytes(48).toString('hex'))"
```

Copy the generated secret into `AUTH_SECRET`. Set your desired `ADMIN_EMAIL` and **strong** `ADMIN_PASSWORD` (>=12 characters with uppercase and digits) in `.env`. Do not share these credentials.

Then run each command separately:

```powershell
npm run db:init
npm run db:seed
npm run admin:create
npm run dev
```

Open:
- Store: http://localhost:3000
- Admin: http://localhost:3000/admin
- Health: http://localhost:3000/api/health

**Important:** The database scripts should be run only with a PostgreSQL URL you control. `db:init` creates tables if missing; `db:seed` inserts demo content without overwriting existing product slugs/settings. `admin:create` refuses to overwrite an existing account. Never commit `.env`.

## Deploy on Vercel

### Option A — GitHub integration

1. Extract the ZIP and create a **private GitHub repository** (recommended for early development).
2. Upload all source files, preserving `src/`, `db/`, `scripts/`, `public/` and `package.json`.
3. Create/connect a PostgreSQL database. Run `npm run db:init`, `npm run db:seed`, `npm run admin:create` from your local machine using the **same database** before opening the live store.
4. On Vercel, **Add New Project → Import Git Repository**.
5. Set **Framework Preset: Next.js**, **Root Directory: project root**, **Node.js: 24.x**, and the standard `npm run build` command.
6. Set **Environment Variables**:
   - `DATABASE_URL` — pooled SSL PostgreSQL connection URL.
   - `AUTH_SECRET` — random 32+ character secret.
   - `NEXT_PUBLIC_SITE_URL` — full HTTPS website URL, e.g. `https://yourdomain.lk`.
   - Optional `BLOB_PUBLIC_READ_WRITE_TOKEN` and `BLOB_PRIVATE_READ_WRITE_TOKEN` (see below).
   - Optional SMTP settings, if sending emails.
7. Deploy. Open `/api/health` and confirm `database: connected`, then visit `/` and `/admin`.
8. In Admin → Store Settings, update store identity, email/phone, COD/bank toggles, shipping, bank details and site text.
9. Replace all demo products, image assets and sample policies before selling.
10. Test real (non-payment) checkout, stock change, cancellation, return, admin order management and mobile UX on **staging** before opening production.

If you initially deploy with the default `NEXT_PUBLIC_SITE_URL`, update the value when you assign your actual domain and redeploy so generated links are correct.

### Option B — Vercel CLI

```powershell
npm install -g vercel
vercel login
vercel link
vercel
# after testing and configuring a production database/domain:
vercel --prod
```

Production deployment is **not** performed by the ZIP itself.

## Images and receipts (optional)

For product images, create a **public** Vercel Blob store and set `BLOB_PUBLIC_READ_WRITE_TOKEN`. Product image uploads in the Admin use this token. Alternatively, paste your own HTTPS image URLs directly into the product editor.

For bank slips, create a **separate private** Vercel Blob store and set `BLOB_PRIVATE_READ_WRITE_TOKEN`. Receipt uploads use `access: 'private'` and bank slips are streamed only to authenticated admin/staff routes. This uses `@vercel/blob` >= 2.3. Do **not** use the public store for bank receipts.

If the private store is not configured, orders can still be placed using a bank reference. Receipt upload will fail with a notice and the customer can contact support. A customer-visible tracking lookup never exposes their receipt.

## Order and stock rules

- Checkout revalidates quantities, current prices, product status, coupons, district and stock on the server.
- Products are locked in a consistent order during checkout; payment-gateway processing is not involved.
- Stock is deducted when an order is successfully created, including unpaid COD/bank orders.
- Cancelling a pending order restores its stock. Admin cancellation also restores stock. A completed whole-order return restores stock.
- Payment and order status are separate fields. Paid bank transfers are verified manually by admin. COD can be marked paid once delivery is confirmed.
- The return flow currently handles **whole orders**, not partial line-item returns.
- Discounts do not include loyalty points, gift cards or tax calculation. Configure separate legal/tax handling before production if applicable.

## Environment configuration

See `.env.example` for all variables. The only essential runtime variables are `DATABASE_URL` and `AUTH_SECRET`; other integrations are optional. The setup-only `ADMIN_EMAIL` and `ADMIN_PASSWORD` should not be placed in Vercel environment variables.

## Limitations to address before commercial launch

- **No full production build was executed at packaging time.** Run `npm install`, `npm run lint`, `npm run build` and test the deployed app against your PostgreSQL database.
- No card/online payment gateway by design. Manual refunds are recorded in admin, not executed automatically.
- No real courier API (tracking numbers/status are updated by admin).
- No rich drag-and-drop page builder, automated supplier sync, live chat, mobile native apps, loyalty points or advanced recommendation engine.
- Device-local wishlist/cart; a customer logged in on another device will not see their saved browser cart/wishlist.
- Password reset/email verification are not implemented in this package. Set up a verified SMTP workflow before production if required by your policies.
- Email sending requires SMTP credentials. With SMTP unset, forms/orders are saved but no email is delivered.
- Product and banner illustrations are editable **demo assets**, not real merchandise. Business contact, bank info, return policy and privacy policy are placeholders.
- Email/IP database rate limiting is baseline protection; use Vercel WAF and monitoring for real traffic.
- This package is intended as a deployable **functional foundation**; load testing, accessibility audit, data privacy/legal review and end-to-end order/stock verification remain required.

## Project structure

```text
src/app/           Storefront, admin pages and secure route handlers
src/components/    Client cart, product components, responsive admin UI
src/lib/           SQL, authentication, pricing, validation, emails
scripts/           Database init, demo seed, one-time admin creation
db/schema.sql      PostgreSQL schema
public/demo/       Original editable illustration placeholders
.env.example       Required environment variable template
vercel.json        Vercel framework/build settings
```

## Troubleshooting

- `DATABASE_URL is missing`: create `.env` locally or set it in Vercel.
- `AUTH_SECRET must contain at least 32 characters`: generate and set a long secret.
- `relation "products" does not exist`: run `npm run db:init` on the correct database.
- `Invalid email or password`: confirm you ran `npm run admin:create`, admin credentials and case-insensitive email.
- Blob uploads return `503`: configure the correct public/private Blob store tokens; product images can be pasted via URLs in the meantime.
- `500` on product pages: check DB SSL configuration, schema initialization and Vercel logs.
- `npm` or build version errors: upgrade to Node 24 LTS, delete `node_modules` and reinstall.

## Deployment references

- Vercel Git deploy: https://vercel.com/docs/git
- Next.js deploy: https://nextjs.org/docs/app/getting-started/deploying
- Vercel private Blob: https://vercel.com/docs/vercel-blob/private-storage
- Vercel Hobby commercial restrictions: https://vercel.com/docs/limits/fair-use-guidelines
