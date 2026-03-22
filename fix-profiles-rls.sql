-- ============================================
-- FIX RLS POLICIES FOR PROFILES TABLE
-- Run this in Supabase SQL Editor
-- ============================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can create own profile during signup" ON public.profiles;

-- Recreate policies with correct permissions

-- Allow users to INSERT their own profile during signup
CREATE POLICY "Enable insert for authenticated users"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Allow users to SELECT their own profile
CREATE POLICY "Enable read access for own profile"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Allow users to UPDATE their own profile
CREATE POLICY "Enable update for own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Verify the policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd
FROM pg_policies
WHERE tablename = 'profiles'
ORDER BY policyname;
