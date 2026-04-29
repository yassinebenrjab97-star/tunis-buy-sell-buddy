import React, { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Send, Image as ImageIcon, Mic, Loader, X, MessageCircle } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useTranslation } from "react-i18next";

interface Message {
  id: string;
  sender_type: 'customer' | 'shop';
  message_type: 'text' | 'image' | 'voice';
  content: string | null;
  media_url: string | null;
  created_at: string;
}

interface ShopChatDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  shopId: string;
  shopName: string;
}

const ShopChatDialog: React.FC<ShopChatDialogProps> = ({
  open,
  onOpenChange,
  shopId,
  shopName,
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { t } = useTranslation();

  useEffect(() => {
    if (open) {
      initConversation();
    }
  }, [open, shopId]);

  useEffect(() => {
    if (conversationId) {
      const channel = supabase
        .channel(`conversation:${conversationId}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'shop_messages',
            filter: `conversation_id=eq.${conversationId}`
          },
          (payload) => {
            setMessages(prev => [...prev, payload.new as Message]);
            scrollToBottom();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [conversationId]);

  const scrollToBottom = () => {
    setTimeout(() => {
      scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const initConversation = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      let { data: conversation, error: convError } = await supabase
        .from('shop_conversations')
        .select('*')
        .eq('shop_id', shopId)
        .eq('customer_id', user.id)
        .single();

      if (convError && convError.code === 'PGRST116') {
        const { data: newConv, error: createError } = await supabase
          .from('shop_conversations')
          .insert({
            shop_id: shopId,
            customer_id: user.id,
          })
          .select()
          .single();

        if (createError) throw createError;
        conversation = newConv;
      } else if (convError) {
        throw convError;
      }

      setConversationId(conversation.id);

      const { data: msgs, error: msgsError } = await supabase
        .from('shop_messages')
        .select('*')
        .eq('conversation_id', conversation.id)
        .order('created_at', { ascending: true });

      if (msgsError) throw msgsError;
      setMessages((msgs || []) as Message[]);
      scrollToBottom();
    } catch (error) {
      console.error('Error initializing conversation:', error);
      toast({
        title: "Error",
        description: "Failed to load conversation",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async (messageType: 'text' | 'image' | 'voice', content?: string, mediaUrl?: string) => {
    if (!conversationId) return;
    if (messageType === 'text' && !content?.trim()) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: newMsg, error } = await supabase
        .from('shop_messages')
        .insert({
          conversation_id: conversationId,
          sender_id: user.id,
          sender_type: 'customer',
          message_type: messageType,
          content: content || null,
          media_url: mediaUrl || null,
        })
        .select()
        .single();

      if (error) throw error;

      // Add message to local state immediately
      if (newMsg) {
        setMessages(prev => [...prev, newMsg as Message]);
        scrollToBottom();
      }

      if (messageType === 'text') {
        setNewMessage("");
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      });
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid File",
        description: "Please select an image file",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError, data } = await supabase.storage
        .from('property-images')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('property-images')
        .getPublicUrl(fileName);

      await sendMessage('image', null, publicUrl);
    } catch (error) {
      console.error('Error uploading image:', error);
      toast({
        title: "Upload Failed",
        description: "Failed to upload image",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] h-[80vh] flex flex-col p-0">
        <DialogHeader className="p-4 sm:p-6 border-b">
          <DialogTitle className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-[hsl(var(--tunisia-gold))]" />
            {shopName}
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="flex-1 p-4">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <Loader className="w-8 h-8 animate-spin text-[hsl(var(--tunisia-gold))]" />
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              <p>{t('chat.startConversation')}</p>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.sender_type === 'customer' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[70%] rounded-2xl px-4 py-2 ${
                      msg.sender_type === 'customer'
                        ? 'bg-gradient-tunisia text-white'
                        : 'bg-muted'
                    }`}
                  >
                    {msg.message_type === 'text' && (
                      <p className="break-words">{msg.content}</p>
                    )}
                    {msg.message_type === 'image' && msg.media_url && (
                      <img
                        src={msg.media_url}
                        alt="Shared image"
                        className="max-w-full rounded-lg"
                      />
                    )}
                    {msg.message_type === 'voice' && msg.media_url && (
                      <audio controls className="max-w-full">
                        <source src={msg.media_url} />
                      </audio>
                    )}
                    <p className="text-xs opacity-70 mt-1">
                      {new Date(msg.created_at).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>
              ))}
              <div ref={scrollRef} />
            </div>
          )}
        </ScrollArea>

        <div className="p-4 border-t bg-background">
          <div className="flex items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageUpload}
            />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="flex-shrink-0"
            >
              {uploading ? (
                <Loader className="w-5 h-5 animate-spin" />
              ) : (
                <ImageIcon className="w-5 h-5" />
              )}
            </Button>
            
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage('text', newMessage);
                }
              }}
              placeholder={t('chat.typeMessage')}
              className="flex-1"
            />
            
            <Button
              onClick={() => sendMessage('text', newMessage)}
              disabled={!newMessage.trim() || loading}
              size="icon"
              className="bg-gradient-tunisia flex-shrink-0"
            >
              <Send className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ShopChatDialog;
