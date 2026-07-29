-- Add explicit "deny all" policies to make intent clear in Supabase's
-- Security Advisor (silences the informational "RLS Enabled No Policy"
-- notices). Functionally identical to the previous state: with RLS enabled
-- and no permissive policy, anon/authenticated already had zero access.
-- These policies just document that lockout explicitly. Prisma's connection
-- role owns the tables and bypasses RLS, so the server is unaffected.

CREATE POLICY "Deny all access" ON "_prisma_migrations" FOR ALL TO public USING (false);
CREATE POLICY "Deny all access" ON "categories" FOR ALL TO public USING (false);
CREATE POLICY "Deny all access" ON "users" FOR ALL TO public USING (false);
CREATE POLICY "Deny all access" ON "producer_profiles" FOR ALL TO public USING (false);
CREATE POLICY "Deny all access" ON "farmer_profiles" FOR ALL TO public USING (false);
CREATE POLICY "Deny all access" ON "dc_profiles" FOR ALL TO public USING (false);
CREATE POLICY "Deny all access" ON "products" FOR ALL TO public USING (false);
CREATE POLICY "Deny all access" ON "addresses" FOR ALL TO public USING (false);
CREATE POLICY "Deny all access" ON "otp_tokens" FOR ALL TO public USING (false);
CREATE POLICY "Deny all access" ON "orders" FOR ALL TO public USING (false);
CREATE POLICY "Deny all access" ON "order_assignments" FOR ALL TO public USING (false);
CREATE POLICY "Deny all access" ON "order_items" FOR ALL TO public USING (false);
CREATE POLICY "Deny all access" ON "bookings" FOR ALL TO public USING (false);
CREATE POLICY "Deny all access" ON "notifications" FOR ALL TO public USING (false);
