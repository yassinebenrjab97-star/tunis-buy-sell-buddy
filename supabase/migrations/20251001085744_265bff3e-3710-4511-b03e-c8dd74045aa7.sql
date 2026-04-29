-- Fix: Restrict profiles table to prevent PII harvesting
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;

-- Allow authenticated users to view only their own profile
CREATE POLICY "Users can view their own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);