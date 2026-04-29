-- Functions
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

-- Enums
CREATE TYPE public.property_type AS ENUM ('car', 'building', 'land');
CREATE TYPE public.condition_type AS ENUM ('new', 'excellent', 'good', 'fair', 'needs_work');
CREATE TYPE public.user_role AS ENUM ('buyer', 'seller');
CREATE TYPE public.shop_status AS ENUM ('pending', 'approved', 'rejected', 'suspended');
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- Profiles
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT, phone TEXT, avatar_url TEXT, location TEXT,
  role public.user_role NOT NULL DEFAULT 'buyer',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_profiles_role ON public.profiles(role);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Anyone can view seller profiles" ON public.profiles FOR SELECT USING (role = 'seller');
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- User roles + has_role
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE POLICY "Users can view their own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all roles" ON public.user_roles FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can manage roles" ON public.user_roles FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Listings
CREATE TABLE public.listings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL, description TEXT,
  property_type public.property_type NOT NULL,
  price DECIMAL(12,2) NOT NULL, currency TEXT NOT NULL DEFAULT 'TND',
  location TEXT NOT NULL, city TEXT NOT NULL,
  condition public.condition_type, year_built INTEGER,
  area DECIMAL(10,2), area_unit TEXT DEFAULT 'm²',
  features JSONB DEFAULT '{}',
  contact_phone TEXT, contact_email TEXT,
  images TEXT[] DEFAULT '{}',
  is_featured BOOLEAN DEFAULT false, is_active BOOLEAN DEFAULT true,
  views_count INTEGER DEFAULT 0,
  lat DECIMAL(10,8), lng DECIMAL(11,8),
  bidding_enabled BOOLEAN DEFAULT false,
  starting_bid NUMERIC, current_highest_bid NUMERIC, bid_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT listings_images_not_empty CHECK (array_length(images, 1) > 0)
);
ALTER TABLE public.listings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view active listings" ON public.listings FOR SELECT USING (is_active = true);
CREATE POLICY "Users can insert their own listings" ON public.listings FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own listings" ON public.listings FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own listings" ON public.listings FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins can delete any listing" ON public.listings FOR DELETE USING (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER update_listings_updated_at BEFORE UPDATE ON public.listings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- AI conversations
CREATE TABLE public.ai_conversations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id TEXT NOT NULL,
  messages JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.ai_conversations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own conversations" ON public.ai_conversations FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);
CREATE POLICY "Users can insert their own conversations" ON public.ai_conversations FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);
CREATE POLICY "Users can update their own conversations" ON public.ai_conversations FOR UPDATE USING (auth.uid() = user_id OR user_id IS NULL);
CREATE TRIGGER update_ai_conversations_updated_at BEFORE UPDATE ON public.ai_conversations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Tunisia votes
CREATE TABLE public.tunisia_app_votes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  voted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ip_address TEXT, user_agent TEXT
);
ALTER TABLE public.tunisia_app_votes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can vote" ON public.tunisia_app_votes FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can view votes" ON public.tunisia_app_votes FOR SELECT USING (true);
CREATE INDEX idx_tunisia_votes_voted_at ON public.tunisia_app_votes(voted_at DESC);

-- Bids
CREATE TABLE public.bids (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  listing_id UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  bidder_id UUID NOT NULL,
  bidder_name TEXT NOT NULL, bidder_email TEXT NOT NULL, bidder_phone TEXT,
  bid_amount NUMERIC NOT NULL CHECK (bid_amount > 0),
  currency TEXT NOT NULL DEFAULT 'TND',
  message TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'outbid')),
  is_verified_bidder BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_bids_listing_id ON public.bids(listing_id);
CREATE INDEX idx_bids_bidder_id ON public.bids(bidder_id);
ALTER TABLE public.bids ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can place bids" ON public.bids FOR INSERT TO authenticated WITH CHECK (auth.uid() = bidder_id);
CREATE POLICY "Listing owners can view all bids" ON public.bids FOR SELECT USING (EXISTS (SELECT 1 FROM public.listings WHERE listings.id = bids.listing_id AND listings.user_id = auth.uid()));
CREATE POLICY "Bidders can view their own bids" ON public.bids FOR SELECT USING (auth.uid() = bidder_id);
CREATE POLICY "Listing owners can update bid status" ON public.bids FOR UPDATE USING (EXISTS (SELECT 1 FROM public.listings WHERE listings.id = bids.listing_id AND listings.user_id = auth.uid())) WITH CHECK (EXISTS (SELECT 1 FROM public.listings WHERE listings.id = bids.listing_id AND listings.user_id = auth.uid()));
CREATE POLICY "Admins can delete any bid" ON public.bids FOR DELETE USING (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER update_bids_updated_at BEFORE UPDATE ON public.bids FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- User verifications
CREATE TABLE public.user_verifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  full_name TEXT NOT NULL, cin_number TEXT NOT NULL, cin_photo_url TEXT NOT NULL,
  address TEXT NOT NULL, city TEXT NOT NULL, postal_code TEXT,
  phone_number TEXT NOT NULL, date_of_birth DATE,
  verification_status TEXT NOT NULL DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'rejected', 'needs_review')),
  verification_notes TEXT, verified_at TIMESTAMPTZ, verified_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.user_verifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own verification" ON public.user_verifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own verification" ON public.user_verifications FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their pending verification" ON public.user_verifications FOR UPDATE USING (auth.uid() = user_id AND verification_status = 'pending') WITH CHECK (auth.uid() = user_id AND verification_status = 'pending');
CREATE TRIGGER update_user_verifications_updated_at BEFORE UPDATE ON public.user_verifications FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Trusted shops
CREATE TABLE public.trusted_shops (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  shop_name TEXT NOT NULL, shop_description TEXT,
  logo_url TEXT, cover_image_url TEXT,
  contact_email TEXT NOT NULL, contact_phone TEXT,
  address TEXT, city TEXT, website_url TEXT,
  status public.shop_status NOT NULL DEFAULT 'pending',
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMPTZ, rejection_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.trusted_shops ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view approved shops" ON public.trusted_shops FOR SELECT USING (status = 'approved');
CREATE POLICY "Shop owners can view their own shop" ON public.trusted_shops FOR SELECT USING (auth.uid() = owner_id);
CREATE POLICY "Admins can view all shops" ON public.trusted_shops FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can create their own shop" ON public.trusted_shops FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Shop owners can update their pending shop" ON public.trusted_shops FOR UPDATE USING (auth.uid() = owner_id AND status = 'pending') WITH CHECK (auth.uid() = owner_id AND status = 'pending');
CREATE POLICY "Admins can update all shops" ON public.trusted_shops FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete any shop" ON public.trusted_shops FOR DELETE USING (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER update_trusted_shops_updated_at BEFORE UPDATE ON public.trusted_shops FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Shop products
CREATE TABLE public.shop_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID NOT NULL REFERENCES public.trusted_shops(id) ON DELETE CASCADE,
  product_name TEXT NOT NULL, description TEXT,
  price NUMERIC NOT NULL, currency TEXT NOT NULL DEFAULT 'TND',
  images TEXT[] DEFAULT '{}', category TEXT,
  in_stock BOOLEAN DEFAULT true, stock_quantity INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.shop_products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view products from approved shops" ON public.shop_products FOR SELECT USING (EXISTS (SELECT 1 FROM public.trusted_shops WHERE id = shop_products.shop_id AND status = 'approved'));
CREATE POLICY "Shop owners can view their own products" ON public.shop_products FOR SELECT USING (EXISTS (SELECT 1 FROM public.trusted_shops WHERE id = shop_products.shop_id AND owner_id = auth.uid()));
CREATE POLICY "Approved shop owners can create products" ON public.shop_products FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.trusted_shops WHERE id = shop_id AND owner_id = auth.uid() AND status = 'approved'));
CREATE POLICY "Shop owners can update their own products" ON public.shop_products FOR UPDATE USING (EXISTS (SELECT 1 FROM public.trusted_shops WHERE id = shop_products.shop_id AND owner_id = auth.uid()));
CREATE POLICY "Shop owners can delete their own products" ON public.shop_products FOR DELETE USING (EXISTS (SELECT 1 FROM public.trusted_shops WHERE id = shop_products.shop_id AND owner_id = auth.uid()));
CREATE TRIGGER update_shop_products_updated_at BEFORE UPDATE ON public.shop_products FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Shop conversations & messages
CREATE TABLE public.shop_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID NOT NULL REFERENCES public.trusted_shops(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL,
  last_message_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(shop_id, customer_id)
);
ALTER TABLE public.shop_conversations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Customers can view their own conversations" ON public.shop_conversations FOR SELECT USING (auth.uid() = customer_id);
CREATE POLICY "Shop owners can view their shop conversations" ON public.shop_conversations FOR SELECT USING (EXISTS (SELECT 1 FROM public.trusted_shops WHERE id = shop_conversations.shop_id AND owner_id = auth.uid()));
CREATE POLICY "Customers can create conversations" ON public.shop_conversations FOR INSERT WITH CHECK (auth.uid() = customer_id);
CREATE POLICY "Auto update last_message_at" ON public.shop_conversations FOR UPDATE USING (auth.uid() = customer_id OR EXISTS (SELECT 1 FROM public.trusted_shops WHERE id = shop_conversations.shop_id AND owner_id = auth.uid()));
CREATE TRIGGER update_shop_conversations_updated_at BEFORE UPDATE ON public.shop_conversations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.shop_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.shop_conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL,
  sender_type TEXT NOT NULL CHECK (sender_type IN ('customer', 'shop')),
  message_type TEXT NOT NULL DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'voice')),
  content TEXT, media_url TEXT,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.shop_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view messages in their conversations" ON public.shop_messages FOR SELECT USING (EXISTS (SELECT 1 FROM public.shop_conversations WHERE id = shop_messages.conversation_id AND (customer_id = auth.uid() OR EXISTS (SELECT 1 FROM public.trusted_shops WHERE id = shop_conversations.shop_id AND owner_id = auth.uid()))));
CREATE POLICY "Users can send messages in their conversations" ON public.shop_messages FOR INSERT WITH CHECK (auth.uid() = sender_id AND EXISTS (SELECT 1 FROM public.shop_conversations WHERE id = conversation_id AND (customer_id = auth.uid() OR EXISTS (SELECT 1 FROM public.trusted_shops WHERE id = shop_conversations.shop_id AND owner_id = auth.uid()))));
CREATE POLICY "Users can mark messages as read" ON public.shop_messages FOR UPDATE USING (EXISTS (SELECT 1 FROM public.shop_conversations WHERE id = shop_messages.conversation_id AND (customer_id = auth.uid() OR EXISTS (SELECT 1 FROM public.trusted_shops WHERE id = shop_conversations.shop_id AND owner_id = auth.uid()))));

CREATE INDEX idx_shop_conversations_shop_id ON public.shop_conversations(shop_id);
CREATE INDEX idx_shop_conversations_customer_id ON public.shop_conversations(customer_id);
CREATE INDEX idx_shop_messages_conversation_id ON public.shop_messages(conversation_id);

CREATE OR REPLACE FUNCTION public.update_conversation_timestamp()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.shop_conversations SET last_message_at = NEW.created_at, updated_at = now() WHERE id = NEW.conversation_id;
  RETURN NEW;
END; $$;
CREATE TRIGGER update_conversation_on_message AFTER INSERT ON public.shop_messages FOR EACH ROW EXECUTE FUNCTION public.update_conversation_timestamp();

-- Seller ratings
CREATE TABLE public.seller_ratings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  seller_id UUID NOT NULL,
  rater_id UUID NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 10),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(seller_id, rater_id)
);
ALTER TABLE public.seller_ratings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view ratings" ON public.seller_ratings FOR SELECT USING (true);
CREATE POLICY "Users can rate sellers" ON public.seller_ratings FOR INSERT WITH CHECK (auth.uid() = rater_id AND auth.uid() != seller_id);
CREATE POLICY "Users can update their own ratings" ON public.seller_ratings FOR UPDATE USING (auth.uid() = rater_id);
CREATE POLICY "Users can delete their own ratings" ON public.seller_ratings FOR DELETE USING (auth.uid() = rater_id);
CREATE TRIGGER update_seller_ratings_updated_at BEFORE UPDATE ON public.seller_ratings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Increment views function
CREATE OR REPLACE FUNCTION public.increment_views(listing_id UUID)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN UPDATE public.listings SET views_count = COALESCE(views_count, 0) + 1 WHERE id = listing_id; END;
$$;

-- Handle new user trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, role)
  VALUES (new.id, new.raw_user_meta_data ->> 'full_name', COALESCE((new.raw_user_meta_data ->> 'role')::public.user_role, 'buyer'));
  RETURN new;
END; $$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Storage buckets
INSERT INTO storage.buckets (id, name, public) VALUES ('property-images', 'property-images', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('cin-documents', 'cin-documents', false, 5242880, ARRAY['image/jpeg', 'image/png', 'image/jpg', 'image/webp'])
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Anyone can view property images" ON storage.objects FOR SELECT USING (bucket_id = 'property-images');
CREATE POLICY "Authenticated users can upload property images" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'property-images' AND auth.role() = 'authenticated');
CREATE POLICY "Users can update their own property images" ON storage.objects FOR UPDATE USING (bucket_id = 'property-images' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can upload their own CIN" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'cin-documents' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can view their own CIN" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'cin-documents' AND auth.uid()::text = (storage.foldername(name))[1]);