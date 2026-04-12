/*
  # Add index for recurring_parent_id foreign key

  1. Performance Improvements
    - Add covering index for `items_recurring_parent_id_fkey` foreign key
    - This index will optimize queries that filter or join on recurring_parent_id
    - Prevents suboptimal query performance when looking up recurring item instances

  2. Implementation
    - Create index on `items(recurring_parent_id)` where recurring_parent_id is not null
    - Use `IF NOT EXISTS` to prevent errors if index already exists
*/

-- Add index for the recurring_parent_id foreign key to improve query performance
CREATE INDEX IF NOT EXISTS idx_items_recurring_parent_id 
  ON items(recurring_parent_id) 
  WHERE recurring_parent_id IS NOT NULL;
