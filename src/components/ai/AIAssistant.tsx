import React, { useState, useRef, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Sparkles, User, Loader } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface AIAssistantProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const AIAssistant = ({ open, onOpenChange }: AIAssistantProps) => {
  const { t, i18n } = useTranslation();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Set welcome message based on current language
  useEffect(() => {
    setMessages([{
      id: "welcome",
      role: "assistant",
      content: t('aiAssistant.welcomeMessage'),
      timestamp: new Date(),
    }]);
  }, [i18n.language, t]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: inputMessage,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputMessage("");
    setIsLoading(true);

    try {
      const response = await fetch(
        `https://gsafnaodslrpicfilbet.supabase.co/functions/v1/chat-assistant`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdzYWZuYW9kc2xycGljZmlsYmV0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkwNjIyMTMsImV4cCI6MjA3NDYzODIxM30.U2SqLAeEYvoWRD88mH2QzP8Zx2EZbZt_AwMiDD3RLYU`,
          },
          body: JSON.stringify({
            messages: messages
              .filter(m => m.id !== 'welcome')
              .map(m => ({ role: m.role, content: m.content }))
              .concat([{ role: 'user', content: inputMessage }]),
            language: i18n.language
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.message,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, aiResponse]);
    } catch (error) {
      console.error('AI Assistant error:', error);
      toast({
        title: t('common.error'),
        description: t('aiAssistant.error'),
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString(i18n.language === 'ar' ? 'ar-TN' : i18n.language === 'fr' ? 'fr-FR' : 'en-US', {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl h-[600px] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-tunisia rounded-xl flex items-center justify-center shadow-glow-tunisia">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="font-bold">{t('aiAssistant.title')}</div>
              <div className="text-xs text-muted-foreground font-normal">{t('aiAssistant.subtitle')}</div>
            </div>
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="flex-1 pr-4">
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 ${
                  message.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                {message.role === "assistant" && (
                  <div className="w-9 h-9 bg-gradient-tunisia rounded-xl flex items-center justify-center flex-shrink-0 shadow-elegant">
                    <Sparkles className="w-5 h-5 text-white" />
                  </div>
                )}

                <div
                  className={`max-w-[80%] rounded-xl px-4 py-3 shadow-warm ${
                    message.role === "user"
                      ? "bg-gradient-tunisia text-white ml-auto"
                      : "bg-card border border-border"
                  }`}
                >
                  <div className="whitespace-pre-wrap text-sm">{message.content}</div>
                  <div
                    className={`text-xs mt-1 ${
                      message.role === "user"
                        ? "text-white/70"
                        : "text-muted-foreground"
                    }`}
                  >
                    {formatTime(message.timestamp)}
                  </div>
                </div>

                {message.role === "user" && (
                  <div className="w-9 h-9 bg-accent rounded-xl flex items-center justify-center flex-shrink-0 shadow-warm">
                    <User className="w-5 h-5 text-accent-foreground" />
                  </div>
                )}
              </div>
            ))}

            {isLoading && (
              <div className="flex gap-3 justify-start">
                <div className="w-9 h-9 bg-gradient-tunisia rounded-xl flex items-center justify-center shadow-elegant">
                  <Sparkles className="w-5 h-5 text-white animate-pulse" />
                </div>
                <div className="bg-card border border-border rounded-xl px-4 py-3 shadow-warm">
                  <div className="flex items-center gap-2">
                    <Loader className="w-4 h-4 animate-spin text-[hsl(var(--tunisia-gold))]" />
                    <span className="text-sm">{t('aiAssistant.thinkingMessage')}</span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        <form onSubmit={handleSendMessage} className="flex gap-2 mt-4">
          <Input
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder={t('aiAssistant.placeholder')}
            disabled={isLoading}
            className="flex-1 bg-card border-border"
          />
          <Button
            type="submit"
            disabled={isLoading || !inputMessage.trim()}
            variant="tunisia"
            className="px-6"
          >
            <Send className="w-4 h-4" />
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AIAssistant;
