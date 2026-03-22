-- =============================================
-- Migration Script: Add missing columns to tables
-- Run this in your Supabase SQL Editor
-- =============================================

-- Add title and description columns to cases table
ALTER TABLE public.cases ADD COLUMN IF NOT EXISTS title TEXT DEFAULT 'Untitled Case';
ALTER TABLE public.cases ADD COLUMN IF NOT EXISTS description TEXT DEFAULT '';

-- Add user_id to attorneys table to link to profiles
ALTER TABLE public.attorneys ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);
ALTER TABLE public.attorneys ADD COLUMN IF NOT EXISTS hourly_rate_zar DECIMAL(10,2);
ALTER TABLE public.attorneys ADD COLUMN IF NOT EXISTS bio TEXT DEFAULT '';
ALTER TABLE public.attorneys ADD COLUMN IF NOT EXISTS full_name TEXT DEFAULT '';

-- Create index on attorneys user_id
CREATE INDEX IF NOT EXISTS idx_attorneys_user_id ON public.attorneys(user_id);

-- Reload schema cache
NOTIFY pgrst, 'reload schema';
