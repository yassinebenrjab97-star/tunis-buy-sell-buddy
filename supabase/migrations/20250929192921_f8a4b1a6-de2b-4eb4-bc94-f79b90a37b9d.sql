-- Update remaining RLS policies to remove demo listing support
DROP POLICY IF EXISTS "Users can update their own listings or public demo listings" ON public.listings;
DROP POLICY IF EXISTS "Users can delete their own listings or public demo listings" ON public.listings;

CREATE POLICY "Users can update their own listings"
ON public.listings
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own listings"
ON public.listings
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);