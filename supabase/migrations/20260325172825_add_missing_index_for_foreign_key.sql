/*
  # Add Missing Index for Foreign Key

  1. Performance Optimization
    - Add index on `user_categories.user_id` to support foreign key constraint
    - This index was previously removed but is needed for optimal query performance
    - Foreign keys without covering indexes can cause table scans and poor performance

  2. Security Note
    - This migration only adds performance optimization
    - No security policies are changed
*/

-- Add index for user_categories.user_id foreign key
CREATE INDEX IF NOT EXISTS idx_user_categories_user_id ON user_categories(user_id);
