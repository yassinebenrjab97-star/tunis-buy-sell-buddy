import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/layout/Header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Store, Search, ShieldCheck, Star, Plus, MapPin } from "lucide-react";
import AuthDialog from "@/components/auth/AuthDialog";
import AIAssistant from "@/components/ai/AIAssistant";
import { useTranslation } from "react-i18next";

interface Shop {
  id: string;
  shop_name: string;
  shop_description: string;
  logo_url: string;
  city: string;
  created_at: string;
}

const TrustedShops = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [shops, setShops] = useState<Shop[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  const [showAI, setShowAI] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    checkAuth();
    loadShops();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    setCurrentUser(session?.user || null);
  };

  const loadShops = async () => {
    try {
      const { data, error } = await supabase
        .from('trusted_shops')
        .select('*')
        .eq('status', 'approved')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setShops(data || []);
    } catch (error) {
      console.error('Error loading shops:', error);
      toast({
        title: "Error",
        description: "Failed to load shops",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredShops = shops.filter(shop =>
    shop.shop_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    shop.shop_description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    shop.city?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background">
      <Header 
        onAuthClick={() => setShowAuthDialog(true)}
        onCreateListingClick={() => navigate('/create')}
        onAIClick={() => setShowAI(true)}
        onSearch={() => {}}
      />

      {/* Hero Section */}
      <div className="bg-gradient-tunisia text-white py-12 sm:py-16 md:py-20 shadow-glow-tunisia">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 bg-white/20 backdrop-blur rounded-2xl mb-6 shadow-elegant">
              <Store className="w-8 h-8 sm:w-10 sm:h-10" />
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4">
              {t('trustedShops.title')}
            </h1>
            <p className="text-base sm:text-lg md:text-xl text-white/90 mb-6 sm:mb-8">
              {t('trustedShops.subtitle')}
            </p>
            
            {currentUser && (
              <Button
                onClick={() => navigate('/shop/register')}
                size="lg"
                className="bg-white text-[hsl(var(--tunisia-red))] hover:bg-white/90 shadow-elegant h-12 sm:h-14 px-6 sm:px-8 text-base sm:text-lg"
              >
                <Plus className="w-5 h-5 mr-2" />
                {t('trustedShops.registerShop')}
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="container mx-auto px-4 -mt-6 sm:-mt-8 mb-8 sm:mb-12">
        <Card className="shadow-elegant">
          <CardContent className="p-4 sm:p-6">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
              <Input
                placeholder={t('trustedShops.searchPlaceholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 h-12 sm:h-14 text-base"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Shops Grid */}
      <div className="container mx-auto px-4 pb-12 sm:pb-20">
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[hsl(var(--tunisia-red))]"></div>
            <p className="mt-4 text-muted-foreground">{t('common.loading')}</p>
          </div>
        ) : filteredShops.length === 0 ? (
          <Card>
            <CardContent className="p-8 sm:p-12 text-center">
              <Store className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-xl sm:text-2xl font-bold mb-2">{t('trustedShops.noShops')}</h3>
              <p className="text-muted-foreground mb-6">
                {searchQuery ? t('trustedShops.tryDifferent') : t('trustedShops.beFirst')}
              </p>
              {currentUser && !searchQuery && (
                <Button onClick={() => navigate('/shop/register')} className="bg-gradient-tunisia">
                  <Plus className="w-4 h-4 mr-2" />
                  {t('trustedShops.registerShop')}
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {filteredShops.map((shop) => (
              <Card
                key={shop.id}
                className="group hover:shadow-elegant transition-all cursor-pointer overflow-hidden"
                onClick={() => navigate(`/shop/${shop.id}`)}
              >
                <div className="relative h-36 sm:h-48 bg-gradient-warm overflow-hidden">
                  {shop.logo_url ? (
                    <img
                      src={shop.logo_url}
                      alt={shop.shop_name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Store className="w-16 h-16 sm:w-20 sm:h-20 text-white/50" />
                    </div>
                  )}
                  <div className="absolute top-3 right-3">
                    <Badge className="bg-white/90 backdrop-blur text-[hsl(var(--tunisia-gold))]">
                      <ShieldCheck className="w-3 h-3 mr-1" />
                      {t('trustedShops.verified')}
                    </Badge>
                  </div>
                </div>
                
                <CardContent className="p-4 sm:p-6">
                  <h3 className="text-lg sm:text-xl font-bold mb-2 line-clamp-1 group-hover:text-[hsl(var(--tunisia-red))] transition-colors">
                    {shop.shop_name}
                  </h3>
                  
                  {shop.shop_description && (
                    <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                      {shop.shop_description}
                    </p>
                  )}
                  
                  {shop.city && (
                    <div className="flex items-center text-sm text-muted-foreground">
                      <MapPin className="w-4 h-4 mr-1" />
                      {shop.city}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <AuthDialog open={showAuthDialog} onOpenChange={setShowAuthDialog} />
      <AIAssistant open={showAI} onOpenChange={setShowAI} />
    </div>
  );
};

export default TrustedShops;
