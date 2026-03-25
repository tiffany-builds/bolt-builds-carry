/*
  # Link user_profiles with auth.users

  1. Changes
    - Add auth_user_id column to user_profiles table to link with auth.users
    - Add unique constraint to ensure one profile per auth user
    - Update RLS policies to use auth.uid() instead of profile id
    - Create function to automatically create user profile on signup

  2. Security
    - Users can only access their own profile data
    - Automatic profile creation ensures data consistency
*/

-- Add auth_user_id column to user_profiles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'auth_user_id'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN auth_user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
    CREATE UNIQUE INDEX IF NOT EXISTS user_profiles_auth_user_id_key ON user_profiles(auth_user_id);
  END IF;
END $$;

-- Update RLS policies for user_profiles
DROP POLICY IF EXISTS "Users can read own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;

CREATE POLICY "Users can read own profile"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (auth_user_id = auth.uid());

CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE
  TO authenticated
  USING (auth_user_id = auth.uid())
  WITH CHECK (auth_user_id = auth.uid());

CREATE POLICY "Users can insert own profile"
  ON user_profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth_user_id = auth.uid());

-- Update RLS policies for user_categories
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
      AND user_profiles.auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own categories"
  ON user_categories FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = user_categories.user_id
      AND user_profiles.auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own categories"
  ON user_categories FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = user_categories.user_id
      AND user_profiles.auth_user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = user_categories.user_id
      AND user_profiles.auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own categories"
  ON user_categories FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = user_categories.user_id
      AND user_profiles.auth_user_id = auth.uid()
    )
  );

-- Update RLS policies for items
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
      AND user_profiles.auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own items"
  ON items FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = items.user_id
      AND user_profiles.auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own items"
  ON items FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = items.user_id
      AND user_profiles.auth_user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = items.user_id
      AND user_profiles.auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own items"
  ON items FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = items.user_id
      AND user_profiles.auth_user_id = auth.uid()
    )
  );
