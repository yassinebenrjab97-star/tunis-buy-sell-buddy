-- Create table for Tunisia app votes
CREATE TABLE public.tunisia_app_votes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  voted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ip_address TEXT,
  user_agent TEXT
);

-- Enable Row Level Security
ALTER TABLE public.tunisia_app_votes ENABLE ROW LEVEL SECURITY;

-- Create policy to allow anyone to vote (insert)
CREATE POLICY "Anyone can vote"
ON public.tunisia_app_votes
FOR INSERT
WITH CHECK (true);

-- Create policy to allow anyone to view vote count
CREATE POLICY "Anyone can view votes"
ON public.tunisia_app_votes
FOR SELECT
USING (true);

-- Create index on voted_at for faster queries
CREATE INDEX idx_tunisia_votes_voted_at ON public.tunisia_app_votes(voted_at DESC);