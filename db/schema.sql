-- DZone Commerce 1.0 — PostgreSQL schema. Run `npm run db:init` once.
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE TABLE IF NOT EXISTS users (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), full_name text NOT NULL,
 email text NOT NULL UNIQUE, phone text NOT NULL DEFAULT '', password_hash text NOT NULL,
 role text NOT NULL DEFAULT 'customer' CHECK (role IN ('customer','staff','admin')),
 is_active boolean NOT NULL DEFAULT true,
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS categories (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), parent_id uuid REFERENCES categories(id) ON DELETE SET NULL,
 name text NOT NULL, slug text NOT NULL UNIQUE, icon text NOT NULL DEFAULT '✦',
 sort_order int NOT NULL DEFAULT 0, active boolean NOT NULL DEFAULT true
);
CREATE TABLE IF NOT EXISTS products (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), category_id uuid REFERENCES categories(id) ON DELETE SET NULL,
 name text NOT NULL, slug text NOT NULL UNIQUE, description text NOT NULL DEFAULT '',
 details text NOT NULL DEFAULT '', images text[] NOT NULL DEFAULT '{}',
 status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published','archived')),
 featured boolean NOT NULL DEFAULT false, seo_title text NOT NULL DEFAULT '', seo_description text NOT NULL DEFAULT '',
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS product_variants (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
 label text NOT NULL DEFAULT 'Default', sku text NOT NULL UNIQUE,
 price_cents bigint NOT NULL CHECK (price_cents >= 0), compare_cents bigint,
 on_hand int NOT NULL DEFAULT 0 CHECK (on_hand >= 0),
 sort_order int NOT NULL DEFAULT 0, active boolean NOT NULL DEFAULT true
);
CREATE TABLE IF NOT EXISTS inventory_movements (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), variant_id uuid REFERENCES product_variants(id) ON DELETE SET NULL,
 delta int NOT NULL, reason text NOT NULL, reference_id text, actor_id uuid REFERENCES users(id) ON DELETE SET NULL,
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS coupons (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), code text NOT NULL UNIQUE,
 kind text NOT NULL CHECK(kind IN ('percent','fixed')),
 amount int NOT NULL CHECK(amount > 0), min_spend_cents bigint NOT NULL DEFAULT 0,
 usage_limit int, used_count int NOT NULL DEFAULT 0,
 starts_at timestamptz, ends_at timestamptz, enabled boolean NOT NULL DEFAULT true,
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS shipping_zones (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), name text NOT NULL,
 districts text[] NOT NULL DEFAULT '{}', fee_cents bigint NOT NULL DEFAULT 0,
 free_above_cents bigint NOT NULL DEFAULT 0, enabled boolean NOT NULL DEFAULT true
);
CREATE TABLE IF NOT EXISTS orders (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), order_number text NOT NULL UNIQUE,
 user_id uuid REFERENCES users(id) ON DELETE SET NULL,
 customer_name text NOT NULL, email text NOT NULL, phone text NOT NULL,
 address_line text NOT NULL, city text NOT NULL, district text NOT NULL, postal_code text NOT NULL DEFAULT '',
 subtotal_cents bigint NOT NULL, discount_cents bigint NOT NULL DEFAULT 0,
 shipping_cents bigint NOT NULL DEFAULT 0, total_cents bigint NOT NULL,
 coupon_id uuid REFERENCES coupons(id) ON DELETE SET NULL,
 payment_method text NOT NULL CHECK(payment_method IN ('cod','bank')),
 payment_status text NOT NULL DEFAULT 'unpaid' CHECK(payment_status IN ('unpaid','pending_verification','paid','refund_pending','refunded')),
 status text NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','confirmed','processing','shipped','delivered','cancelled','returned')),
 bank_reference text NOT NULL DEFAULT '', receipt_url text NOT NULL DEFAULT '', receipt_token_hash text NOT NULL DEFAULT '',
 courier text NOT NULL DEFAULT '', tracking_number text NOT NULL DEFAULT '',
 customer_notes text NOT NULL DEFAULT '', admin_notes text NOT NULL DEFAULT '',
 idempotency_key text UNIQUE,
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS order_items (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
 product_id uuid REFERENCES products(id) ON DELETE SET NULL,
 variant_id uuid REFERENCES product_variants(id) ON DELETE SET NULL,
 product_name text NOT NULL, variant_label text NOT NULL, sku text NOT NULL,
 quantity int NOT NULL CHECK(quantity > 0), unit_cents bigint NOT NULL, line_total_cents bigint NOT NULL
);
CREATE TABLE IF NOT EXISTS order_events (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
 actor_id uuid REFERENCES users(id) ON DELETE SET NULL, event text NOT NULL,
 note text NOT NULL DEFAULT '', created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS reviews (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
 user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 rating int NOT NULL CHECK(rating BETWEEN 1 AND 5), body text NOT NULL,
 status text NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','approved','rejected')),
 created_at timestamptz NOT NULL DEFAULT now(), UNIQUE(product_id,user_id)
);
CREATE TABLE IF NOT EXISTS returns (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
 user_id uuid NOT NULL REFERENCES users(id), reason text NOT NULL,
 status text NOT NULL DEFAULT 'requested' CHECK(status IN ('requested','approved','rejected','completed')),
 admin_note text NOT NULL DEFAULT '', created_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(order_id,user_id)
);
CREATE TABLE IF NOT EXISTS tickets (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid REFERENCES users(id) ON DELETE SET NULL,
 name text NOT NULL, email text NOT NULL, subject text NOT NULL,
 message text NOT NULL, status text NOT NULL DEFAULT 'open' CHECK(status IN ('open','in_progress','resolved')),
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS ticket_replies (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), ticket_id uuid NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
 staff_id uuid REFERENCES users(id) ON DELETE SET NULL, message text NOT NULL, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS banners (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), title text NOT NULL, subtitle text NOT NULL DEFAULT '',
 image_url text NOT NULL DEFAULT '', button_label text NOT NULL DEFAULT 'Shop now',
 button_url text NOT NULL DEFAULT '/shop', sort_order int NOT NULL DEFAULT 0, enabled boolean NOT NULL DEFAULT true
);
CREATE TABLE IF NOT EXISTS pages (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), title text NOT NULL, slug text NOT NULL UNIQUE,
 content text NOT NULL DEFAULT '', seo_title text NOT NULL DEFAULT '', seo_description text NOT NULL DEFAULT '',
 published boolean NOT NULL DEFAULT true, updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS settings (
 key text PRIMARY KEY, value text NOT NULL, updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS audit_logs (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), actor_id uuid REFERENCES users(id) ON DELETE SET NULL,
 action text NOT NULL, entity_type text NOT NULL, entity_id text NOT NULL DEFAULT '',
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS rate_limits (
 key text PRIMARY KEY, attempts int NOT NULL DEFAULT 0, expires_at timestamptz NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id,status);
CREATE INDEX IF NOT EXISTS idx_products_status ON products(status,featured,created_at DESC);
CREATE INDEX IF NOT EXISTS idx_variants_product ON product_variants(product_id);
CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id,created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_created ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_email ON orders(email);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_reviews_product ON reviews(product_id,status);
CREATE INDEX IF NOT EXISTS idx_stock_history ON inventory_movements(variant_id,created_at DESC);
