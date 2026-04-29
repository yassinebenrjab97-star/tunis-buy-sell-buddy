-- Create user verification table for CIN and identity verification
CREATE TABLE public.user_verifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  cin_number TEXT NOT NULL,
  cin_photo_url TEXT NOT NULL,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  postal_code TEXT,
  phone_number TEXT NOT NULL,
  date_of_birth DATE,
  verification_status TEXT NOT NULL DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'rejected', 'needs_review')),
  verification_notes TEXT,
  verified_at TIMESTAMP WITH TIME ZONE,
  verified_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for faster queries
CREATE INDEX idx_user_verifications_user_id ON public.user_verifications(user_id);
CREATE INDEX idx_user_verifications_status ON public.user_verifications(verification_status);
CREATE INDEX idx_user_verifications_cin ON public.user_verifications(cin_number);

-- Enable Row Level Security
ALTER TABLE public.user_verifications ENABLE ROW LEVEL SECURITY;

-- Users can view their own verification
CREATE POLICY "Users can view their own verification"
ON public.user_verifications
FOR SELECT
USING (auth.uid() = user_id);

-- Users can create their own verification
CREATE POLICY "Users can create their own verification"
ON public.user_verifications
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own pending verification
CREATE POLICY "Users can update their pending verification"
ON public.user_verifications
FOR UPDATE
USING (auth.uid() = user_id AND verification_status = 'pending')
WITH CHECK (auth.uid() = user_id AND verification_status = 'pending');

-- Add trigger for updated_at
CREATE TRIGGER update_user_verifications_updated_at
BEFORE UPDATE ON public.user_verifications
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for CIN photos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'cin-documents', 
  'cin-documents', 
  false,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/jpg', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for CIN documents
CREATE POLICY "Users can upload their own CIN"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'cin-documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view their own CIN"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'cin-documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Update bids table to require verification
ALTER TABLE public.bids
ADD COLUMN is_verified_bidder BOOLEAN DEFAULT false;

-- Create function to check if user is verified
CREATE OR REPLACE FUNCTION public.is_user_verified(check_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_verifications
    WHERE user_id = check_user_id
    AND verification_status = 'verified'
  )
$$;

-- Update bid policy to require verification for placing bids
DROP POLICY IF EXISTS "Authenticated users can place bids" ON public.bids;

CREATE POLICY "Verified users can place bids"
ON public.bids
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = bidder_id 
  AND public.is_user_verified(auth.uid())
);