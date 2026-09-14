/*
# Create items table with needs_date column

1. New Tables
   - `items`
     - `id` (uuid, primary key)
     - `user_id` (uuid, references auth.users, owns the row)
     - `title` (text, not null)
     - `description` (text, nullable)
     - `category` (text, not null)
     - `completed` (boolean, default false)
     - `time_frame` (text, default 'anytime')
     - `date` (date, nullable)
     - `time` (time, nullable)
     - `has_date_time` (boolean, default false)
     - `needs_date` (boolean, default false) — true when item needs a date but none was given
     - `type` (text, default 'task')
     - `target_month` (integer, nullable)
     - `start_date` (date, nullable)
     - `end_date` (date, nullable)
     - `excitement` (text, nullable)
     - `emoji` (text, nullable)
     - `recurring` (boolean, default false)
     - `recurring_pattern` (text, nullable)
     - `recurring_day_of_week` (integer, nullable)
     - `recurring_parent_id` (uuid, nullable, self-referencing FK with CASCADE)
     - `created_at` (timestamptz, default now())

2. Security
   - Enable RLS on items
   - Owner-scoped CRUD: authenticated users can only access their own rows
   - user_id defaults to auth.uid() so inserts that omit it still satisfy policy

3. Indexes
   - Index on user_id for RLS performance
   - Index on date for timeline queries
   - Index on type for filtering
   - Index on recurring_parent_id for recurring item lookups
*/

CREATE TABLE IF NOT EXISTS items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  category text NOT NULL,
  completed boolean NOT NULL DEFAULT false,
  time_frame text DEFAULT 'anytime',
  date date,
  time time,
  has_date_time boolean DEFAULT false,
  needs_date boolean DEFAULT false,
  type text DEFAULT 'task',
  target_month integer,
  start_date date,
  end_date date,
  excitement text,
  emoji text,
  recurring boolean DEFAULT false,
  recurring_pattern text,
  recurring_day_of_week integer,
  recurring_parent_id uuid REFERENCES items(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own items" ON items;
CREATE POLICY "Users can read own items"
  ON items FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can insert own items" ON items;
CREATE POLICY "Users can insert own items"
  ON items FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can update own items" ON items;
CREATE POLICY "Users can update own items"
  ON items FOR UPDATE
  TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can delete own items" ON items;
CREATE POLICY "Users can delete own items"
  ON items FOR DELETE
  TO authenticated
  USING (user_id = (select auth.uid()));

CREATE INDEX IF NOT EXISTS items_user_id_idx ON items(user_id);
CREATE INDEX IF NOT EXISTS idx_items_date ON items(date) WHERE date IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_items_type ON items(type);
CREATE INDEX IF NOT EXISTS idx_items_recurring_parent_id ON items(recurring_parent_id) WHERE recurring_parent_id IS NOT NULL;