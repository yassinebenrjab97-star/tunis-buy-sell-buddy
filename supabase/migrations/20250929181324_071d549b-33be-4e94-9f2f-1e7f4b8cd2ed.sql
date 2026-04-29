-- Add user_role enum
CREATE TYPE public.user_role AS ENUM ('buyer', 'seller');

-- Add role column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN role public.user_role NOT NULL DEFAULT 'buyer';

-- Create index on role for faster queries
CREATE INDEX idx_profiles_role ON public.profiles(role);

-- Update the handle_new_user function to include role
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, role)
  VALUES (
    new.id, 
    new.raw_user_meta_data ->> 'full_name',
    COALESCE((new.raw_user_meta_data ->> 'role')::user_role, 'buyer')
  );
  RETURN new;
END;
$$;

-- Allow users to update their own role
CREATE POLICY "Users can switch to seller role"
ON public.profiles
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);