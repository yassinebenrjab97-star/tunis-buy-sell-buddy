-- Create bids table for auction/bidding system
CREATE TABLE public.bids (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  listing_id UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  bidder_id UUID NOT NULL,
  bidder_name TEXT NOT NULL,
  bidder_email TEXT NOT NULL,
  bidder_phone TEXT,
  bid_amount NUMERIC NOT NULL CHECK (bid_amount > 0),
  currency TEXT NOT NULL DEFAULT 'TND',
  message TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'outbid')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for faster queries
CREATE INDEX idx_bids_listing_id ON public.bids(listing_id);
CREATE INDEX idx_bids_bidder_id ON public.bids(bidder_id);
CREATE INDEX idx_bids_status ON public.bids(status);
CREATE INDEX idx_bids_created_at ON public.bids(created_at DESC);

-- Enable Row Level Security
ALTER TABLE public.bids ENABLE ROW LEVEL SECURITY;

-- Allow anyone to view bids for a listing
CREATE POLICY "Anyone can view bids for active listings"
ON public.bids
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.listings 
    WHERE listings.id = bids.listing_id 
    AND listings.is_active = true
  )
);

-- Allow authenticated users to place bids
CREATE POLICY "Authenticated users can place bids"
ON public.bids
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = bidder_id);

-- Allow listing owners to view all bids on their listings
CREATE POLICY "Listing owners can view all bids"
ON public.bids
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.listings 
    WHERE listings.id = bids.listing_id 
    AND listings.user_id = auth.uid()
  )
);

-- Allow listing owners to update bid status (accept/reject)
CREATE POLICY "Listing owners can update bid status"
ON public.bids
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.listings 
    WHERE listings.id = bids.listing_id 
    AND listings.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.listings 
    WHERE listings.id = bids.listing_id 
    AND listings.user_id = auth.uid()
  )
);

-- Allow bidders to view their own bids
CREATE POLICY "Bidders can view their own bids"
ON public.bids
FOR SELECT
USING (auth.uid() = bidder_id);

-- Add trigger for updated_at
CREATE TRIGGER update_bids_updated_at
BEFORE UPDATE ON public.bids
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add bidding_enabled column to listings
ALTER TABLE public.listings 
ADD COLUMN bidding_enabled BOOLEAN DEFAULT false,
ADD COLUMN starting_bid NUMERIC,
ADD COLUMN current_highest_bid NUMERIC,
ADD COLUMN bid_count INTEGER DEFAULT 0;