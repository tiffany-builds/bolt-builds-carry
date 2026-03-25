/*
  # Add lookforward fields to items table

  1. Changes
    - Add `start_date` column for lookforward items (date field for multi-day events)
    - Add `end_date` column for lookforward items (optional end date for trips)
    - Add `excitement` column for lookforward items (warm description text)

  2. Notes
    - These fields are optional and only used for type='lookforward' items
    - Existing items are not affected
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'items' AND column_name = 'start_date'
  ) THEN
    ALTER TABLE items ADD COLUMN start_date date;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'items' AND column_name = 'end_date'
  ) THEN
    ALTER TABLE items ADD COLUMN end_date date;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'items' AND column_name = 'excitement'
  ) THEN
    ALTER TABLE items ADD COLUMN excitement text;
  END IF;
END $$;
