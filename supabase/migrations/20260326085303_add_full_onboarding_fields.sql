/*
  # Add full onboarding fields to user_profiles

  1. Changes
    - Add `birthday_day` column (1-31)
    - Add `birthday_month` column (1-12)
    - Add `household` column (JSONB array for household members)
    - Add `has_children` column (boolean)
    - Add `children` column (JSONB array for children details)
    - Add `week_structure` column (text: mostly_home, mix, mostly_out, varies)
    - Add `day_start_time` column (text: time in HH:MM format)
    - Add `priority_areas` column (JSONB array)
    - Add `nudge_preference` column (text: daily, only_when_needed, weekly)
    - Add `onboarding_complete` column (boolean, default false)

  2. Notes
    - All fields are optional and only filled during onboarding
    - Existing users are not affected
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'birthday_day'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN birthday_day integer;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'birthday_month'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN birthday_month integer;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'household'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN household jsonb DEFAULT '[]'::jsonb;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'has_children'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN has_children boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'children'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN children jsonb DEFAULT '[]'::jsonb;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'week_structure'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN week_structure text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'day_start_time'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN day_start_time text DEFAULT '07:00';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'priority_areas'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN priority_areas jsonb DEFAULT '[]'::jsonb;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'nudge_preference'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN nudge_preference text DEFAULT 'daily';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'onboarding_complete'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN onboarding_complete boolean DEFAULT false;
  END IF;
END $$;
