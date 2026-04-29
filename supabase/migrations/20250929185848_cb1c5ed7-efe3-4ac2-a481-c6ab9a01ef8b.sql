-- Drop the previous function and create it with proper search_path
DROP FUNCTION IF EXISTS public.increment_views(UUID);

CREATE OR REPLACE FUNCTION public.increment_views(listing_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.listings
  SET views_count = COALESCE(views_count, 0) + 1
  WHERE id = listing_id;
END;
$$;