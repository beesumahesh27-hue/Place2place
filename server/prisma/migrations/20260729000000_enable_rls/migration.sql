-- Enable Row Level Security on all public tables.
--
-- This app only ever talks to Postgres via Prisma using the connection role
-- configured in DATABASE_URL, which owns these tables (table owners bypass
-- RLS by default). No Supabase client (anon/authenticated keys) is used
-- anywhere in this codebase. Enabling RLS with no policies simply blocks the
-- default anon/authenticated PostgREST roles from reading/writing these
-- tables directly through Supabase's auto-generated REST API, while leaving
-- the Prisma-based server unaffected.

ALTER TABLE "_prisma_migrations" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "categories" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "users" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "producer_profiles" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "farmer_profiles" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "dc_profiles" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "products" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "addresses" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "otp_tokens" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "orders" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "order_assignments" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "order_items" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "bookings" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "notifications" ENABLE ROW LEVEL SECURITY;
