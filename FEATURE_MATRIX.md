# DZone Commerce — Delivered Features and Status

| Area | Source implementation | Production notes |
|---|---|---|
| Storefront white theme | Included | Editable branding via settings |
| Homepage / hero / banners | Included | Demo assets must be replaced |
| Products / categories / variants | Included | Multiple SKU support and SQL inventory |
| Search / category filter / sort | Included | PostgreSQL ILIKE; upgrade for large catalogs |
| Cart / wishlist | Included | Device-local, not cross-device sync |
| Customer account / order history | Included | Password reset and email verify not included |
| Guest checkout | Included | Stock, coupon and shipping computed server-side |
| COD / bank transfer | Included | No online payment gateway |
| Receipt upload | Optional | Separate private Vercel Blob store required |
| Admin order management | Included | Manual courier updates, transitions enforced |
| Product inventory | Included | Stock logs and transactional order deduction |
| Returns | Included | Whole-order requests; no partial RMA |
| Customer review moderation | Included | Only verified delivered-order buyers |
| Promotions | Coupons + sale price | No automated campaign engine |
| Shipping | District zones + threshold | No courier API |
| Customer support | Tickets + admin replies | SMTP required for outgoing reply email |
| CMS pages / product SEO | Included | Plain-text page editor (not rich builder) |
| Sitemap and robots | Included | Set NEXT_PUBLIC_SITE_URL |
| Reports / exports | Included | CSV and basic dashboard metrics |
| Email notification | Optional | SMTP required |
| Authentication / roles | Included | Admin/staff/customer |
| Audit logs / rate limit | Included | Add platform monitoring before scaling |
| Vercel source/config | Included | Installation and actual build verification pending |
