-- Allow admins to delete any listing
CREATE POLICY "Admins can delete any listing" 
ON public.listings 
FOR DELETE 
USING (public.has_role(auth.uid(), 'admin'));

-- Allow admins to delete any shop
CREATE POLICY "Admins can delete any shop" 
ON public.trusted_shops 
FOR DELETE 
USING (public.has_role(auth.uid(), 'admin'));