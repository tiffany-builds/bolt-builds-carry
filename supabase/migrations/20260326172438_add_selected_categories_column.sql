/*
  # Add selected_categories column to user_profiles

  1. Changes
    - Add `selected_categories` column (text array) to store user's chosen category names
    - Column is nullable to support existing users
  
  2. Notes
    - This replaces the need for a separate user_categories table
    - Categories are stored as an array of category names (e.g., ['Kids', 'Work', 'Health'])
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'selected_categories'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN selected_categories text[];
  END IF;
END $$;