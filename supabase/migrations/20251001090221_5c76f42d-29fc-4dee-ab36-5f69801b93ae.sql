-- Fix: Remove public access to bids table to prevent contact information harvesting
-- Drop the overly permissive policy that allows anyone to view bids
DROP POLICY IF EXISTS "Anyone can view bids for active listings" ON public.bids;

-- The following policies remain in place and provide proper access control:
-- 1. "Listing owners can view all bids" - allows owners to manage their listings
-- 2. "Bidders can view their own bids" - allows bidders to see their own bid history
-- 3. "Listing owners can update bid status" - allows owners to accept/reject bids
-- 4. "Verified users can place bids" - allows verified users to submit bids

-- This ensures bidder contact information (email, phone) is only visible to:
-- - The listing owner (for communication about accepted bids)
-- - The bidder themselves (their own information)