/*
  # Add caring_for column to profiles table

  1. Changes
    - Add `caring_for` column to `profiles` table to store who the user is caring for
    - Column is a text array that can include: children, pets, partner, parents, just_me
    - Defaults to empty array
    
  2. Notes
    - Used to personalize Claude's categorization prompts
    - Helps determine how Family category should be interpreted
*/

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS caring_for text[] DEFAULT '{}';
