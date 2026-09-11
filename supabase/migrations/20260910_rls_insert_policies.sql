-- Fix RLS policies to allow users to fully manage their own records during the client-side signup flow and beyond.

-- 1. Profiles Table Policies
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE TO authenticated USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can select own profile" ON profiles;
CREATE POLICY "Users can select own profile" ON profiles FOR SELECT TO authenticated USING (auth.uid() = id);

-- 2. Shops Table Policies
DROP POLICY IF EXISTS "Users can insert own shop" ON shops;
CREATE POLICY "Users can insert own shop" ON shops FOR INSERT TO authenticated WITH CHECK (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Users can update own shop" ON shops;
CREATE POLICY "Users can update own shop" ON shops FOR UPDATE TO authenticated USING (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Users can select own shop" ON shops;
CREATE POLICY "Users can select own shop" ON shops FOR SELECT TO authenticated USING (auth.uid() = owner_id);

-- 3. Subscriptions Table Policies
DROP POLICY IF EXISTS "Users can insert own subscriptions" ON subscriptions;
CREATE POLICY "Users can insert own subscriptions" ON subscriptions FOR INSERT TO authenticated WITH CHECK (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Users can update own subscriptions" ON subscriptions;
CREATE POLICY "Users can update own subscriptions" ON subscriptions FOR UPDATE TO authenticated USING (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Users can select own subscriptions" ON subscriptions;
CREATE POLICY "Users can select own subscriptions" ON subscriptions FOR SELECT TO authenticated USING (auth.uid() = owner_id);

-- 4. Orders Table Policies
DROP POLICY IF EXISTS "Users can insert own orders" ON orders;
CREATE POLICY "Users can insert own orders" ON orders FOR INSERT TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM shops WHERE shops.id = orders.shop_id AND shops.owner_id = auth.uid())
);

DROP POLICY IF EXISTS "Users can update own orders" ON orders;
CREATE POLICY "Users can update own orders" ON orders FOR UPDATE TO authenticated USING (
  EXISTS (SELECT 1 FROM shops WHERE shops.id = orders.shop_id AND shops.owner_id = auth.uid())
);

DROP POLICY IF EXISTS "Users can select own orders" ON orders;
CREATE POLICY "Users can select own orders" ON orders FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM shops WHERE shops.id = orders.shop_id AND shops.owner_id = auth.uid())
);

-- 5. Customers Table Policies
DROP POLICY IF EXISTS "Users can insert own customers" ON customers;
CREATE POLICY "Users can insert own customers" ON customers FOR INSERT TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM shops WHERE shops.id = customers.shop_id AND shops.owner_id = auth.uid())
);

DROP POLICY IF EXISTS "Users can update own customers" ON customers;
CREATE POLICY "Users can update own customers" ON customers FOR UPDATE TO authenticated USING (
  EXISTS (SELECT 1 FROM shops WHERE shops.id = customers.shop_id AND shops.owner_id = auth.uid())
);

DROP POLICY IF EXISTS "Users can select own customers" ON customers;
CREATE POLICY "Users can select own customers" ON customers FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM shops WHERE shops.id = customers.shop_id AND shops.owner_id = auth.uid())
);
