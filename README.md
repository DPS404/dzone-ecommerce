# DZone Commerce

A clean rebuild of DZone, a Sri Lankan single-vendor e-commerce platform.

## Stack
- Next.js App Router + TypeScript
- React
- Tailwind CSS v4
- Neon PostgreSQL + Drizzle ORM
- Vercel deployment

## Database setup
1. Create a PostgreSQL project in Neon.
2. Copy the pooled connection string from the Neon dashboard.
3. Put it in `.env.local` as `DATABASE_URL=...` (never commit this file).
4. Run `npm install`.
5. Run `npm run db:generate` and then `npm run db:migrate`.

## Development
Requires Node.js 22.18 or newer.

```bash
npm install
cp .env.example .env.local
npm run dev
```

## Commerce scope
- Single-vendor catalogue and inventory
- Customer accounts, cart, checkout and order tracking
- Admin dashboard for products, categories, orders, customers, promotions and reports
- Cash on Delivery and manual bank transfer; no payment gateway in the initial release

No production credentials or admin account are committed to this repository.
