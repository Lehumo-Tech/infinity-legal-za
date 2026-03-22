-- Fix RLS Policy for Profile Creation
-- Run this in Supabase SQL Editor

-- Add INSERT policy for profiles table
CREATE POLICY "Users can create own profile during signup"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Verify policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'profiles';
