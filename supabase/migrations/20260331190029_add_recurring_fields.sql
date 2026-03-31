/*
  # Add Recurring Fields to Items Table

  1. Changes
    - Add `recurring` boolean field (default: false)
    - Add `recurring_pattern` text field for pattern type (daily, weekly, monthly)
    - Add `recurring_day_of_week` integer field (0-6, Sunday-Saturday)
    - Add `recurring_parent_id` uuid field linking instances to parent item
  
  2. Security
    - Foreign key constraint on recurring_parent_id with CASCADE delete
    - Ensures when parent recurring item is deleted, all instances are also deleted
*/

ALTER TABLE items ADD COLUMN IF NOT EXISTS recurring boolean DEFAULT false;
ALTER TABLE items ADD COLUMN IF NOT EXISTS recurring_pattern text;
ALTER TABLE items ADD COLUMN IF NOT EXISTS recurring_day_of_week integer;
ALTER TABLE items ADD COLUMN IF NOT EXISTS recurring_parent_id uuid REFERENCES items(id) ON DELETE CASCADE;
