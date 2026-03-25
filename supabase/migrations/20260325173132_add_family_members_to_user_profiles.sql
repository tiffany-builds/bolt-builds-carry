/*
  # Add Family Members Support

  1. Schema Changes
    - Add `family_members` column to `user_profiles` table
    - This is a text array to store names of family members (partner, kids, etc.)
    - Users can add up to 4 family members during onboarding

  2. Important Notes
    - Column is nullable and defaults to empty array
    - No changes to RLS policies needed
    - This is a simple addition for personalization features
*/

-- Add family_members column to user_profiles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'family_members'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN family_members text[] DEFAULT ARRAY[]::text[];
  END IF;
END $$;
