/*
  # Add date/time fields to items table

  1. Changes
    - Add `date` column (date type, nullable) for storing the specific date of an item
    - Add `time` column (time type, nullable) for storing the specific time of an item
    - Add `has_date_time` column (boolean, default false) to indicate if item has date/time info
    - Add index on date for efficient timeline queries
  
  2. Notes
    - These fields are optional and only populated when user specifies a date/time
    - Items without date/time remain in the boxes view only
    - Items with date/time appear in both timeline and their category box
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'items' AND column_name = 'date'
  ) THEN
    ALTER TABLE items ADD COLUMN date date;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'items' AND column_name = 'time'
  ) THEN
    ALTER TABLE items ADD COLUMN time time;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'items' AND column_name = 'has_date_time'
  ) THEN
    ALTER TABLE items ADD COLUMN has_date_time boolean DEFAULT false;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_items_date ON items(date) WHERE date IS NOT NULL;
