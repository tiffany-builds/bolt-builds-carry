/*
  # Optimize RLS Policies and Remove Unused Indexes

  1. Performance Optimization
    - Replace `auth.uid()` with `(select auth.uid())` in all RLS policies
    - This prevents re-evaluation of auth functions for each row
    - Significantly improves query performance at scale

  2. Security Improvements
    - Remove overly permissive anon policies from initial migration
    - Ensure all policies properly check authentication
    - Fix policies that had `WITH CHECK (true)` which bypass security

  3. Index Cleanup
    - Remove unused index `idx_items_completed`
    - Remove unused index `idx_user_categories_user_id`
    - Keep only indexes that are actively used by queries

  4. Tables Affected
    - `user_profiles`: Optimized 3 policies
    - `user_categories`: Optimized 4 policies
    - `items`: Optimized 4 policies
*/

-- Drop old policies from first migration that are overly permissive
DROP POLICY IF EXISTS "Anyone can create profile during onboarding" ON user_profiles;
DROP POLICY IF EXISTS "Users can create own categories" ON user_categories;
DROP POLICY IF EXISTS "Users can create own items" ON items;

-- Optimize user_profiles RLS policies
DROP POLICY IF EXISTS "Users can read own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;

CREATE POLICY "Users can read own profile"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (auth_user_id = (select auth.uid()));

CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE
  TO authenticated
  USING (auth_user_id = (select auth.uid()))
  WITH CHECK (auth_user_id = (select auth.uid()));

CREATE POLICY "Users can insert own profile"
  ON user_profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth_user_id = (select auth.uid()));

-- Optimize user_categories RLS policies
DROP POLICY IF EXISTS "Users can read own categories" ON user_categories;
DROP POLICY IF EXISTS "Users can insert own categories" ON user_categories;
DROP POLICY IF EXISTS "Users can update own categories" ON user_categories;
DROP POLICY IF EXISTS "Users can delete own categories" ON user_categories;

CREATE POLICY "Users can read own categories"
  ON user_categories FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = user_categories.user_id
      AND user_profiles.auth_user_id = (select auth.uid())
    )
  );

CREATE POLICY "Users can insert own categories"
  ON user_categories FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = user_categories.user_id
      AND user_profiles.auth_user_id = (select auth.uid())
    )
  );

CREATE POLICY "Users can update own categories"
  ON user_categories FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = user_categories.user_id
      AND user_profiles.auth_user_id = (select auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = user_categories.user_id
      AND user_profiles.auth_user_id = (select auth.uid())
    )
  );

CREATE POLICY "Users can delete own categories"
  ON user_categories FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = user_categories.user_id
      AND user_profiles.auth_user_id = (select auth.uid())
    )
  );

-- Optimize items RLS policies
DROP POLICY IF EXISTS "Users can read own items" ON items;
DROP POLICY IF EXISTS "Users can insert own items" ON items;
DROP POLICY IF EXISTS "Users can update own items" ON items;
DROP POLICY IF EXISTS "Users can delete own items" ON items;

CREATE POLICY "Users can read own items"
  ON items FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = items.user_id
      AND user_profiles.auth_user_id = (select auth.uid())
    )
  );

CREATE POLICY "Users can insert own items"
  ON items FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = items.user_id
      AND user_profiles.auth_user_id = (select auth.uid())
    )
  );

CREATE POLICY "Users can update own items"
  ON items FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = items.user_id
      AND user_profiles.auth_user_id = (select auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = items.user_id
      AND user_profiles.auth_user_id = (select auth.uid())
    )
  );

CREATE POLICY "Users can delete own items"
  ON items FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = items.user_id
      AND user_profiles.auth_user_id = (select auth.uid())
    )
  );

-- Remove unused indexes
DROP INDEX IF EXISTS idx_items_completed;
DROP INDEX IF EXISTS idx_user_categories_user_id;
