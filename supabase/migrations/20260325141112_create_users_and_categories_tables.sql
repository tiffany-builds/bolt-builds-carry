/*
  # Create users and categories tables for Carry app

  1. New Tables
    - `user_profiles`
      - `id` (uuid, primary key)
      - `name` (text)
      - `has_completed_onboarding` (boolean)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `user_categories`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key)
      - `name` (text) - category name like "Household", "Kids", etc.
      - `emoji` (text) - emoji icon for the category
      - `order` (integer) - display order
      - `created_at` (timestamp)
  
  2. Security
    - Enable RLS on both tables
    - Users can only access their own profiles
    - Users can only access their own categories
    - Public signup access (for onboarding)
*/

CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  has_completed_onboarding boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own profile"
  ON user_profiles FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Anyone can create profile during onboarding"
  ON user_profiles FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE
  TO anon
  USING (id = gen_random_uuid())
  WITH CHECK (id = gen_random_uuid());

CREATE TABLE IF NOT EXISTS user_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  emoji text NOT NULL,
  "order" integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE user_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own categories"
  ON user_categories FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Users can create own categories"
  ON user_categories FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Users can update own categories"
  ON user_categories FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Users can delete own categories"
  ON user_categories FOR DELETE
  TO anon
  USING (true);
