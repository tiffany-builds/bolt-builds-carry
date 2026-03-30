/*
  # Fix Security Issues - RLS Performance and Missing Index

  1. Index Changes
    - Add index on items(user_id) to support foreign key constraint and improve query performance

  2. RLS Policy Optimization
    - Optimize all RLS policies to use (select auth.uid()) instead of auth.uid()
    - This prevents re-evaluation of auth.uid() for each row, significantly improving performance at scale
    - Applies to:
      - profiles table: read, insert, update policies
      - items table: read, insert, update, delete policies

  3. Security Notes
    - Using (select auth.uid()) evaluates the function once and reuses the result
    - Maintains the same security guarantees while improving performance
    - No changes to access control logic, only performance optimization
*/

-- Add missing index on items.user_id foreign key
CREATE INDEX IF NOT EXISTS items_user_id_idx ON items(user_id);

-- Optimize RLS policies for profiles table
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

CREATE POLICY "Users can read own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (id = (select auth.uid()));

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (id = (select auth.uid()));

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (id = (select auth.uid()))
  WITH CHECK (id = (select auth.uid()));

-- Optimize RLS policies for items table
DROP POLICY IF EXISTS "Users can read own items" ON items;
DROP POLICY IF EXISTS "Users can insert own items" ON items;
DROP POLICY IF EXISTS "Users can update own items" ON items;
DROP POLICY IF EXISTS "Users can delete own items" ON items;

CREATE POLICY "Users can read own items"
  ON items FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

CREATE POLICY "Users can insert own items"
  ON items FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can update own items"
  ON items FOR UPDATE
  TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can delete own items"
  ON items FOR DELETE
  TO authenticated
  USING (user_id = (select auth.uid()));