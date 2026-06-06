-- Resync like_count and comment_count from actual data.
-- Run this once in Supabase SQL editor if counts look wrong.

UPDATE public.tracks t
SET like_count = (
  SELECT COUNT(*) FROM public.likes l WHERE l.track_id = t.id
);

UPDATE public.tracks t
SET comment_count = (
  SELECT COUNT(*) FROM public.comments c WHERE c.track_id = t.id
);
