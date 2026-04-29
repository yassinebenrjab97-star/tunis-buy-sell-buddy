import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { Send, Palmtree, User, Loader, ThumbsUp, Home, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  images?: string[];
}

const TunisiaTourism = () => {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content: "Welcome to Come to Tunisia! مرحبا بك في تونس!\n\nI'm your personal AI guide to discovering the beauty of Tunisia - from pristine Mediterranean beaches to ancient Roman ruins, from the Sahara desert to charming coastal towns.\n\n**Tourism & Culture**\n- Discover UNESCO World Heritage sites\n- Experience authentic Tunisian culture\n- Find the best restaurants and hotels\n- Plan your perfect itinerary\n\n**Real Estate & Investment**\n- Explore investment opportunities\n- Find your dream vacation home\n- Get expert advice on buying property\n- Learn about residency options\n\n**Multilingual Support**\nI speak English, French, and Arabic fluently!\n\nHow can I help you discover Tunisia today?",
      timestamp: new Date(),
    },
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [hasVoted, setHasVoted] = useState(false);
  const [voteCount, setVoteCount] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Load vote count
    const loadVotes = async () => {
      const { count } = await supabase
        .from('tunisia_app_votes')
        .select('*', { count: 'exact', head: true });
      setVoteCount(count || 0);
    };
    loadVotes();

    // Check if user has voted
    const voted = localStorage.getItem('tunisia_app_voted');
    setHasVoted(voted === 'true');
  }, []);

  const handleVote = async () => {
    if (hasVoted) {
      toast({
        title: "Already Voted",
        description: "You've already voted for this feature!",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('tunisia_app_votes')
        .insert([{ voted_at: new Date().toISOString() }]);

      if (error) throw error;

      setHasVoted(true);
      setVoteCount(prev => prev + 1);
      localStorage.setItem('tunisia_app_voted', 'true');

      toast({
        title: "Vote Recorded!",
        description: "Thank you for supporting a dedicated Tunisia tourism app!",
      });
    } catch (error) {
      console.error('Vote error:', error);
      toast({
        title: "Error",
        description: "Failed to record vote. Please try again.",
        variant: "destructive",
      });
    }
  };

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
      const { data, error } = await supabase.functions.invoke('tunisia-tourism-ai', {
        body: {
          messages: messages
            .filter(m => m.id !== 'welcome')
            .map(m => ({ role: m.role, content: m.content }))
            .concat([{ role: 'user', content: inputMessage }])
        }
      });

      if (error) throw error;

      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.message,
        timestamp: new Date(),
        images: data.images,
      };

      setMessages((prev) => [...prev, aiResponse]);
    } catch (error) {
      console.error('Tunisia AI error:', error);
      toast({
        title: "Error",
        description: "Unable to contact the AI assistant. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation Bar */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b border-border shadow-elegant">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate(-1)}
                className="hover:bg-accent"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/')}
                className="hover:bg-accent"
              >
                <Home className="w-4 h-4 mr-2" />
                Home
              </Button>
            </div>
            
            <div className="flex items-center gap-3">
              <Palmtree className="w-8 h-8 text-[hsl(var(--tunisia-gold))]" />
              <div>
                <h1 className="text-xl font-bold text-gradient-tunisia">Come to Tunisia</h1>
                <p className="text-xs text-muted-foreground">Your AI Tourism & Investment Guide</p>
              </div>
            </div>

            <div className="w-24" />
          </div>
        </div>
      </header>

      {/* Vote Banner */}
      <div className="bg-gradient-tunisia text-white py-4 shadow-glow-tunisia">
        <div className="container mx-auto px-4">
          <Card className="bg-white/10 backdrop-blur border-white/20 p-4">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex-1">
                <h3 className="font-bold text-lg mb-1">Want a Dedicated Tunisia Tourism App?</h3>
                <p className="text-sm text-white/90">
                  Vote if you'd love a complete app focused on Tunisia tourism, culture, and real estate!
                </p>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-center">
                  <div className="text-3xl font-bold">{voteCount}</div>
                  <div className="text-xs text-white/80">votes</div>
                </div>
                <Button
                  onClick={handleVote}
                  disabled={hasVoted}
                  className={`${hasVoted ? 'bg-white/20' : 'bg-white hover:bg-white/90'} text-[hsl(var(--tunisia-gold))] font-bold`}
                >
                  <ThumbsUp className="w-4 h-4 mr-2" />
                  {hasVoted ? 'Voted!' : 'Vote Now'}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Chat Interface */}
      <div className="container mx-auto px-4 py-6">
        <Card className="h-[calc(100vh-280px)] flex flex-col shadow-elegant">
          <ScrollArea className="flex-1 p-6">
            <div className="space-y-6">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-3 ${
                    message.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  {message.role === "assistant" && (
                    <div className="w-10 h-10 bg-gradient-tunisia rounded-xl flex items-center justify-center flex-shrink-0 shadow-elegant">
                      <Palmtree className="w-5 h-5 text-white" />
                    </div>
                  )}

                  <div
                    className={`max-w-[80%] rounded-xl px-5 py-4 shadow-warm ${
                      message.role === "user"
                        ? "bg-gradient-tunisia text-white ml-auto"
                        : "bg-card border border-border"
                    }`}
                  >
                    <div className="whitespace-pre-wrap text-sm leading-relaxed">{message.content}</div>
                    
                    {message.images && message.images.length > 0 && (
                      <div className="grid grid-cols-2 gap-2 mt-3">
                        {message.images.map((img, idx) => (
                          <img
                            key={idx}
                            src={img}
                            alt={`Tunisia image ${idx + 1}`}
                            className="rounded-lg w-full h-32 object-cover shadow-warm"
                          />
                        ))}
                      </div>
                    )}
                    
                    <div
                      className={`text-xs mt-2 ${
                        message.role === "user"
                          ? "text-white/70"
                          : "text-muted-foreground"
                      }`}
                    >
                      {formatTime(message.timestamp)}
                    </div>
                  </div>

                  {message.role === "user" && (
                    <div className="w-10 h-10 bg-accent rounded-xl flex items-center justify-center flex-shrink-0 shadow-warm">
                      <User className="w-5 h-5 text-accent-foreground" />
                    </div>
                  )}
                </div>
              ))}

              {isLoading && (
                <div className="flex gap-3 justify-start">
                  <div className="w-10 h-10 bg-gradient-tunisia rounded-xl flex items-center justify-center shadow-elegant">
                    <Palmtree className="w-5 h-5 text-white animate-pulse" />
                  </div>
                  <div className="bg-card border border-border rounded-xl px-5 py-4 shadow-warm">
                    <div className="flex items-center gap-2">
                      <Loader className="w-4 h-4 animate-spin text-[hsl(var(--tunisia-gold))]" />
                      <span className="text-sm">Discovering Tunisia...</span>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          <div className="p-6 border-t border-border bg-accent/5">
            <form onSubmit={handleSendMessage} className="flex gap-3">
              <Input
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Ask me anything about Tunisia..."
                disabled={isLoading}
                className="flex-1 bg-background border-border h-12 text-base"
              />
              <Button
                type="submit"
                disabled={isLoading || !inputMessage.trim()}
                variant="tunisia"
                className="px-8 h-12"
              >
                <Send className="w-5 h-5" />
              </Button>
            </form>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default TunisiaTourism;
