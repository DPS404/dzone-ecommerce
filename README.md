# DZone Commerce

A clean rebuild of DZone, a Sri Lankan single-vendor e-commerce platform.

## Stack
- Next.js App Router + TypeScript
- React
- Tailwind CSS v4
- Neon PostgreSQL + Drizzle ORM
- Vercel deployment

## Product direction
- White, clean storefront
- Sri Lankan Rupee (LKR) pricing
- Single-vendor catalogue and inventory
- Customer accounts, cart, checkout and order tracking
- Admin dashboard for products, categories, orders, customers, promotions and reports
- Cash on Delivery and manual bank transfer; no payment gateway in the initial release

## Development
Requires Node.js 22.18 or newer.

```bash
npm install
cp .env.example .env.local
npm run dev
```

Database schema, authentication, commerce APIs and admin workflows will be added in subsequent implementation steps. No production credentials or admin account are committed to this repository.
