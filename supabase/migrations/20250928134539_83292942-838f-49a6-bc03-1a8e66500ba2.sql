-- Temporarily modify RLS policies to allow NULL user_id for public listings
DROP POLICY IF EXISTS "Users can insert their own listings" ON public.listings;
DROP POLICY IF EXISTS "Users can update their own listings" ON public.listings;
DROP POLICY IF EXISTS "Users can delete their own listings" ON public.listings;

-- Create new policies that allow NULL user_id for demo listings
CREATE POLICY "Users can insert their own listings or public demo listings" 
ON public.listings 
FOR INSERT 
WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can update their own listings or public demo listings" 
ON public.listings 
FOR UPDATE 
USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can delete their own listings or public demo listings" 
ON public.listings 
FOR DELETE 
USING (auth.uid() = user_id OR user_id IS NULL);

-- Temporarily allow NULL user_id in the constraint
ALTER TABLE public.listings ALTER COLUMN user_id DROP NOT NULL;