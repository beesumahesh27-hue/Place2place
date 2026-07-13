-- Migration: 001_initial_schema
-- Description: Initial tables for Place2place

CREATE TYPE "ProductStatus" AS ENUM ('AVAILABLE', 'LOW_STOCK', 'OUT_OF_STOCK', 'UPDATING');
CREATE TYPE "OrderStatus"   AS ENUM ('CONFIRMED', 'PACKED', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED');

-- ── Categories ────────────────────────────────────────────────────────────────
CREATE TABLE categories (
  id    TEXT PRIMARY KEY,
  slug  TEXT NOT NULL UNIQUE,
  label TEXT NOT NULL,
  icon  TEXT NOT NULL
);

-- ── Factories ─────────────────────────────────────────────────────────────────
CREATE TABLE factories (
  id       TEXT PRIMARY KEY,
  name     TEXT NOT NULL UNIQUE,
  location TEXT
);

-- ── Products ──────────────────────────────────────────────────────────────────
CREATE TABLE products (
  id            TEXT          PRIMARY KEY,
  name          TEXT          NOT NULL UNIQUE,
  description   TEXT          NOT NULL,
  price         DOUBLE PRECISION NOT NULL,
  unit          TEXT          NOT NULL,
  variants      TEXT[]        NOT NULL DEFAULT '{}',
  image         TEXT          NOT NULL,
  quantity      INTEGER       NOT NULL DEFAULT 0,
  status        "ProductStatus" NOT NULL DEFAULT 'AVAILABLE',
  delivery_time TEXT          NOT NULL,
  organic       BOOLEAN       NOT NULL DEFAULT false,
  category_id   TEXT          NOT NULL REFERENCES categories(id),
  factory_id    TEXT          NOT NULL REFERENCES factories(id),
  created_at    TIMESTAMPTZ   NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ   NOT NULL DEFAULT now()
);

-- ── Users ─────────────────────────────────────────────────────────────────────
CREATE TABLE users (
  id         TEXT        PRIMARY KEY,
  name       TEXT        NOT NULL,
  mobile     TEXT        NOT NULL UNIQUE,
  email      TEXT        UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── Addresses ─────────────────────────────────────────────────────────────────
CREATE TABLE addresses (
  id         TEXT        PRIMARY KEY,
  user_id    TEXT        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  label      TEXT        NOT NULL,
  line1      TEXT        NOT NULL,
  line2      TEXT,
  city       TEXT        NOT NULL,
  state      TEXT        NOT NULL,
  pincode    TEXT        NOT NULL,
  is_default BOOLEAN     NOT NULL DEFAULT false
);

-- ── OTP Tokens ────────────────────────────────────────────────────────────────
CREATE TABLE otp_tokens (
  id         TEXT        PRIMARY KEY,
  contact    TEXT        NOT NULL,
  otp        TEXT        NOT NULL,
  user_id    TEXT        REFERENCES users(id) ON DELETE SET NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used       BOOLEAN     NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_otp_contact_used ON otp_tokens(contact, used);

-- ── Orders ────────────────────────────────────────────────────────────────────
CREATE TABLE orders (
  id             TEXT          PRIMARY KEY,
  user_id        TEXT          NOT NULL REFERENCES users(id),
  address_id     TEXT          REFERENCES addresses(id),
  total          DOUBLE PRECISION NOT NULL,
  status         "OrderStatus" NOT NULL DEFAULT 'CONFIRMED',
  payment_method TEXT          NOT NULL,
  created_at     TIMESTAMPTZ   NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ   NOT NULL DEFAULT now()
);

-- ── Order Items ───────────────────────────────────────────────────────────────
CREATE TABLE order_items (
  id         TEXT             PRIMARY KEY,
  order_id   TEXT             NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id TEXT             NOT NULL REFERENCES products(id),
  variant    TEXT             NOT NULL,
  quantity   INTEGER          NOT NULL,
  price      DOUBLE PRECISION NOT NULL
);
