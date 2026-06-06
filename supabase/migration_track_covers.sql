-- Add cover_url to tracks (run this in Supabase SQL editor)
ALTER TABLE public.tracks ADD COLUMN IF NOT EXISTS cover_url text;
