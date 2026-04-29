-- Create shop_conversations table
CREATE TABLE public.shop_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID NOT NULL REFERENCES public.trusted_shops(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL,
  last_message_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(shop_id, customer_id)
);

-- Create shop_messages table
CREATE TABLE public.shop_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.shop_conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL,
  sender_type TEXT NOT NULL CHECK (sender_type IN ('customer', 'shop')),
  message_type TEXT NOT NULL DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'voice')),
  content TEXT,
  media_url TEXT,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.shop_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shop_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for shop_conversations
CREATE POLICY "Customers can view their own conversations"
  ON public.shop_conversations
  FOR SELECT
  USING (auth.uid() = customer_id);

CREATE POLICY "Shop owners can view their shop conversations"
  ON public.shop_conversations
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.trusted_shops
      WHERE id = shop_conversations.shop_id AND owner_id = auth.uid()
    )
  );

CREATE POLICY "Customers can create conversations"
  ON public.shop_conversations
  FOR INSERT
  WITH CHECK (auth.uid() = customer_id);

CREATE POLICY "Auto update last_message_at"
  ON public.shop_conversations
  FOR UPDATE
  USING (
    auth.uid() = customer_id OR 
    EXISTS (
      SELECT 1 FROM public.trusted_shops
      WHERE id = shop_conversations.shop_id AND owner_id = auth.uid()
    )
  );

-- RLS Policies for shop_messages
CREATE POLICY "Users can view messages in their conversations"
  ON public.shop_messages
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.shop_conversations
      WHERE id = shop_messages.conversation_id 
      AND (customer_id = auth.uid() OR EXISTS (
        SELECT 1 FROM public.trusted_shops
        WHERE id = shop_conversations.shop_id AND owner_id = auth.uid()
      ))
    )
  );

CREATE POLICY "Users can send messages in their conversations"
  ON public.shop_messages
  FOR INSERT
  WITH CHECK (
    auth.uid() = sender_id AND
    EXISTS (
      SELECT 1 FROM public.shop_conversations
      WHERE id = conversation_id 
      AND (customer_id = auth.uid() OR EXISTS (
        SELECT 1 FROM public.trusted_shops
        WHERE id = shop_conversations.shop_id AND owner_id = auth.uid()
      ))
    )
  );

CREATE POLICY "Users can mark messages as read"
  ON public.shop_messages
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.shop_conversations
      WHERE id = shop_messages.conversation_id 
      AND (customer_id = auth.uid() OR EXISTS (
        SELECT 1 FROM public.trusted_shops
        WHERE id = shop_conversations.shop_id AND owner_id = auth.uid()
      ))
    )
  );

-- Create indexes for performance
CREATE INDEX idx_shop_conversations_shop_id ON public.shop_conversations(shop_id);
CREATE INDEX idx_shop_conversations_customer_id ON public.shop_conversations(customer_id);
CREATE INDEX idx_shop_conversations_last_message ON public.shop_conversations(last_message_at DESC);
CREATE INDEX idx_shop_messages_conversation_id ON public.shop_messages(conversation_id);
CREATE INDEX idx_shop_messages_created_at ON public.shop_messages(created_at DESC);

-- Create trigger to update last_message_at
CREATE OR REPLACE FUNCTION public.update_conversation_timestamp()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.shop_conversations
  SET last_message_at = NEW.created_at,
      updated_at = now()
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_conversation_on_message
  AFTER INSERT ON public.shop_messages
  FOR EACH ROW
  EXECUTE FUNCTION public.update_conversation_timestamp();

-- Trigger for updated_at
CREATE TRIGGER update_shop_conversations_updated_at
  BEFORE UPDATE ON public.shop_conversations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();