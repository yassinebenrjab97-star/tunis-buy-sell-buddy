-- Create seller ratings table
CREATE TABLE public.seller_ratings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  seller_id UUID NOT NULL,
  rater_id UUID NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 10),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(seller_id, rater_id)
);

-- Enable RLS
ALTER TABLE public.seller_ratings ENABLE ROW LEVEL SECURITY;

-- Anyone can view ratings
CREATE POLICY "Anyone can view ratings"
ON public.seller_ratings
FOR SELECT
USING (true);

-- Authenticated users can rate sellers (not themselves)
CREATE POLICY "Users can rate sellers"
ON public.seller_ratings
FOR INSERT
WITH CHECK (auth.uid() = rater_id AND auth.uid() != seller_id);

-- Users can update their own ratings
CREATE POLICY "Users can update their own ratings"
ON public.seller_ratings
FOR UPDATE
USING (auth.uid() = rater_id);

-- Users can delete their own ratings
CREATE POLICY "Users can delete their own ratings"
ON public.seller_ratings
FOR DELETE
USING (auth.uid() = rater_id);

-- Add trigger for updated_at
CREATE TRIGGER update_seller_ratings_updated_at
BEFORE UPDATE ON public.seller_ratings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Update profiles RLS to allow viewing seller profiles publicly
CREATE POLICY "Anyone can view seller profiles"
ON public.profiles
FOR SELECT
USING (role = 'seller');