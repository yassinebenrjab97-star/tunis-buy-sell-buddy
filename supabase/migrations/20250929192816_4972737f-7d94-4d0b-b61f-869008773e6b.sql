-- Delete all fake/demo listings (where user_id is NULL)
DELETE FROM public.listings WHERE user_id IS NULL;

-- Update RLS policy to prevent NULL user_id inserts
DROP POLICY IF EXISTS "Users can insert their own listings or public demo listings" ON public.listings;

CREATE POLICY "Users can insert their own listings"
ON public.listings
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Update the listings table to make user_id NOT NULL
ALTER TABLE public.listings ALTER COLUMN user_id SET NOT NULL;

-- Add a check to ensure at least one image is present
ALTER TABLE public.listings ADD CONSTRAINT listings_images_not_empty 
CHECK (array_length(images, 1) > 0);