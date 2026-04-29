-- Create enum for shop status
CREATE TYPE shop_status AS ENUM ('pending', 'approved', 'rejected', 'suspended');

-- Create trusted_shops table
CREATE TABLE public.trusted_shops (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  shop_name TEXT NOT NULL,
  shop_description TEXT,
  logo_url TEXT,
  cover_image_url TEXT,
  contact_email TEXT NOT NULL,
  contact_phone TEXT,
  address TEXT,
  city TEXT,
  website_url TEXT,
  status shop_status NOT NULL DEFAULT 'pending',
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMP WITH TIME ZONE,
  rejection_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create shop_products table
CREATE TABLE public.shop_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID NOT NULL REFERENCES public.trusted_shops(id) ON DELETE CASCADE,
  product_name TEXT NOT NULL,
  description TEXT,
  price NUMERIC NOT NULL,
  currency TEXT NOT NULL DEFAULT 'TND',
  images TEXT[] DEFAULT '{}',
  category TEXT,
  in_stock BOOLEAN DEFAULT true,
  stock_quantity INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user_roles table for admin management
CREATE TYPE app_role AS ENUM ('admin', 'user');

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);

-- Create security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Enable RLS on all tables
ALTER TABLE public.trusted_shops ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shop_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for trusted_shops
CREATE POLICY "Anyone can view approved shops"
  ON public.trusted_shops
  FOR SELECT
  USING (status = 'approved');

CREATE POLICY "Shop owners can view their own shop"
  ON public.trusted_shops
  FOR SELECT
  USING (auth.uid() = owner_id);

CREATE POLICY "Admins can view all shops"
  ON public.trusted_shops
  FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can create their own shop"
  ON public.trusted_shops
  FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Shop owners can update their pending shop"
  ON public.trusted_shops
  FOR UPDATE
  USING (auth.uid() = owner_id AND status = 'pending')
  WITH CHECK (auth.uid() = owner_id AND status = 'pending');

CREATE POLICY "Admins can update all shops"
  ON public.trusted_shops
  FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for shop_products
CREATE POLICY "Anyone can view products from approved shops"
  ON public.shop_products
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.trusted_shops
      WHERE id = shop_products.shop_id AND status = 'approved'
    )
  );

CREATE POLICY "Shop owners can view their own products"
  ON public.shop_products
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.trusted_shops
      WHERE id = shop_products.shop_id AND owner_id = auth.uid()
    )
  );

CREATE POLICY "Approved shop owners can create products"
  ON public.shop_products
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.trusted_shops
      WHERE id = shop_id AND owner_id = auth.uid() AND status = 'approved'
    )
  );

CREATE POLICY "Shop owners can update their own products"
  ON public.shop_products
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.trusted_shops
      WHERE id = shop_products.shop_id AND owner_id = auth.uid()
    )
  );

CREATE POLICY "Shop owners can delete their own products"
  ON public.shop_products
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.trusted_shops
      WHERE id = shop_products.shop_id AND owner_id = auth.uid()
    )
  );

-- RLS Policies for user_roles
CREATE POLICY "Users can view their own roles"
  ON public.user_roles
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles"
  ON public.user_roles
  FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage roles"
  ON public.user_roles
  FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- Create triggers for updated_at
CREATE TRIGGER update_trusted_shops_updated_at
  BEFORE UPDATE ON public.trusted_shops
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_shop_products_updated_at
  BEFORE UPDATE ON public.shop_products
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert admin user (yessinebenrjabb@gmail.com)
-- Note: This will need to be run after the user signs up
-- You can run this SQL manually in Supabase SQL editor after the user with this email exists:
-- INSERT INTO public.user_roles (user_id, role)
-- SELECT id, 'admin'::app_role
-- FROM auth.users
-- WHERE email = 'yessinebenrjabb@gmail.com'
-- ON CONFLICT (user_id, role) DO NOTHING;