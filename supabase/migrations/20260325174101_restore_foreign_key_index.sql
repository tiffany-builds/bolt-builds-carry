/*
  # Restore Foreign Key Index

  1. Performance Optimization
    - Add index on `user_categories.user_id` to support foreign key constraint
    - Supabase reports this index is needed for optimal query performance
    - Foreign keys without covering indexes can cause table scans and poor performance

  2. Notes
    - This addresses the security warning about unindexed foreign keys
    - No security policies are changed
    - Query performance on user_categories will be optimized
*/

-- Add index for user_categories.user_id foreign key
CREATE INDEX IF NOT EXISTS idx_user_categories_user_id ON user_categories(user_id);
