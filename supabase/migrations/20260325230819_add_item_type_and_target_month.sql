/*
  # Add item type and target month fields

  1. Changes
    - Add `type` column to items table (event, task, reminder, idea, mind)
    - Add `target_month` column for month-specific items without exact dates
    - Add index on type for efficient filtering
  
  2. Notes
    - Default type is 'task' for backwards compatibility
    - target_month is nullable for items without month-specific timeframes
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'items' AND column_name = 'type'
  ) THEN
    ALTER TABLE items ADD COLUMN type text DEFAULT 'task';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'items' AND column_name = 'target_month'
  ) THEN
    ALTER TABLE items ADD COLUMN target_month integer;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE tablename = 'items' AND indexname = 'idx_items_type'
  ) THEN
    CREATE INDEX idx_items_type ON items(type);
  END IF;
END $$;