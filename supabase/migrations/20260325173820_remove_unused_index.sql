/*
  # Remove Unused Index

  1. Index Cleanup
    - Remove `idx_user_categories_user_id` index as reported unused by Supabase
    - The foreign key constraint itself provides sufficient performance
    - Removing unused indexes reduces storage overhead and improves write performance

  2. Notes
    - This addresses the security warning about unused index
    - No security policies are changed
    - Write operations on user_categories will be slightly faster
*/

-- Drop unused index
DROP INDEX IF EXISTS idx_user_categories_user_id;
