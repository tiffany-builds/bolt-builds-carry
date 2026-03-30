/*
  # Add emoji column to items table

  1. Changes
    - Add `emoji` column to `items` table to store contextually appropriate emoji chosen by Claude
    - Column is nullable (text) to allow for items created before this feature
    
  2. Notes
    - Existing items will have NULL emoji values
    - New items will have emojis suggested by Claude based on context
*/

ALTER TABLE items ADD COLUMN IF NOT EXISTS emoji text;
