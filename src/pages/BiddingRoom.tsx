import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useTranslation } from "react-i18next";
import Header from "@/components/layout/Header";
import BiddingSection from "@/components/bids/BiddingSection";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { 
  ShieldCheck, Lock, Users, ArrowLeft,
  CheckCircle, Gavel
} from "lucide-react";
import AuthDialog from "@/components/auth/AuthDialog";
import AIAssistant from "@/components/ai/AIAssistant";

const BiddingRoom = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useTranslation();
  const [listing, setListing] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  const [showAI, setShowAI] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    checkAuth();
    if (id) {
      loadListing();
    }
  }, [id]);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      setUser(null);
      setLoading(false);
      return;
    }

    setUser(session.user);
    
    // Check if admin
    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', session.user.id)
      .eq('role', 'admin')
      .maybeSingle();
    
    setIsAdmin(!!roleData);
    setLoading(false);
  };

  const loadListing = async () => {
    try {
      const { data, error } = await supabase
        .from('listings')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;

      if (!data.bidding_enabled) {
        toast({
          title: t('common.error'),
          description: t('biddingRoom.notAvailable'),
          variant: "destructive",
        });
        navigate(`/listing/${id}`);
        return;
      }

      setListing(data);
    } catch (error) {
      console.error('Error loading listing:', error);
      toast({
        title: t('common.error'),
        description: t('common.error'),
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header 
          onAuthClick={() => setShowAuthDialog(true)}
          onCreateListingClick={() => navigate('/create')}
          onAIClick={() => setShowAI(true)}
          onSearch={(query) => navigate(`/?search=${query}`)}
        />
        <div className="container mx-auto px-4 py-20 text-center">
          <Gavel className="w-16 h-16 animate-bounce mx-auto mb-4 text-[hsl(var(--tunisia-gold))]" />
          <p className="text-muted-foreground">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  const isOwner = user?.id === listing?.user_id;

  return (
    <div className="min-h-screen bg-background">
      <Header 
        onAuthClick={() => setShowAuthDialog(true)}
        onCreateListingClick={() => navigate('/create')}
        onAIClick={() => setShowAI(true)}
        onSearch={(query) => navigate(`/?search=${query}`)}
      />

      <div className="container mx-auto px-4 py-6 sm:py-8 lg:py-10">
        {/* Header */}
        <div className="mb-6 sm:mb-10">
          <Button
            variant="ghost"
            onClick={() => navigate(`/listing/${id}`)}
            className="mb-4 sm:mb-6 h-10 px-4 hover:bg-accent"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            <span className="text-sm sm:text-base font-medium">{t('biddingRoom.backToListing')}</span>
          </Button>

          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 bg-gradient-to-r from-accent/30 to-accent/10 p-5 sm:p-7 rounded-2xl border border-[hsl(var(--tunisia-gold))]/20">
            <div className="w-full lg:w-auto">
              <div className="flex items-center gap-4 mb-3">
                <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-[hsl(var(--tunisia-gold))] to-[hsl(var(--tunisia-gold-bright))] rounded-2xl flex items-center justify-center shadow-glow-tunisia">
                  <Gavel className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black">{t('biddingRoom.title')}</h1>
                  <p className="text-sm sm:text-base text-muted-foreground font-medium">{t('biddingRoom.subtitle')}</p>
                </div>
              </div>
              {listing && (
                <p className="text-base sm:text-lg font-bold text-foreground sm:ml-16">{listing.title}</p>
              )}
            </div>

            <div className="flex flex-wrap gap-2 w-full lg:w-auto">
              <Badge className="flex items-center gap-2 text-xs sm:text-sm px-4 py-2.5 bg-green-600 hover:bg-green-700">
                <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                <span>{t('biddingRoom.liveNow')}</span>
              </Badge>
              <Badge variant="outline" className="flex items-center gap-2 text-xs sm:text-sm px-4 py-2.5 border-2">
                <ShieldCheck className="w-4 h-4" />
                <span>{t('biddingRoom.openAuction')}</span>
              </Badge>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-5 sm:space-y-7 order-2 lg:order-1">
            {/* Security Notice */}
            <Alert className="border-2 border-[hsl(var(--tunisia-gold))]/40 bg-gradient-to-r from-[hsl(var(--tunisia-gold))]/10 to-transparent shadow-lg">
              <ShieldCheck className="w-5 h-5 sm:w-6 sm:h-6 text-[hsl(var(--tunisia-gold))]" />
              <AlertDescription className="ml-2 text-sm sm:text-base">
                <strong className="font-bold">🔒 {t('biddingRoom.securityNotice')}</strong>
              </AlertDescription>
            </Alert>

            {/* Authentication Check */}
            {!user && (
              <Card className="shadow-elegant border-2 border-yellow-500/20">
                <CardContent className="p-8 text-center">
                  <div className="w-20 h-20 bg-yellow-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Lock className="w-10 h-10 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold mb-2">{t('biddingRoom.loginRequired')}</h3>
                  <p className="text-muted-foreground mb-6">
                    {t('biddingRoom.loginRequiredDesc')}
                  </p>
                  <Button 
                    onClick={() => setShowAuthDialog(true)}
                    variant="tunisia"
                    size="lg"
                  >
                    {t('biddingRoom.signIn')}
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Owner View */}
            {user && isOwner && (
              <Card className="shadow-elegant border-2 border-blue-500/20">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <Users className="w-6 h-6 text-blue-600" />
                    <h3 className="text-xl font-bold">{t('biddingRoom.sellerView')}</h3>
                  </div>
                  <p className="text-muted-foreground mb-4">
                    {t('biddingRoom.sellerViewDesc')}
                  </p>
                  <BiddingSection
                    listingId={listing.id}
                    listingOwnerId={listing.user_id}
                    currentHighestBid={listing.current_highest_bid}
                    startingBid={listing.starting_bid}
                    currency={listing.currency}
                    biddingEnabled={listing.bidding_enabled}
                    isAdmin={isAdmin}
                  />
                </CardContent>
              </Card>
            )}

            {/* Bidder View - No verification required */}
            {user && !isOwner && (
              <div className="space-y-6">
                <Alert className="border-2 border-green-500/30 bg-green-50 dark:bg-green-950/20">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <AlertDescription className="ml-2">
                    <strong>{t('biddingRoom.openAuction')}!</strong> {t('biddingRoom.signInToBidDesc')}
                  </AlertDescription>
                </Alert>

                <BiddingSection
                  listingId={listing.id}
                  listingOwnerId={listing.user_id}
                  currentHighestBid={listing.current_highest_bid}
                  startingBid={listing.starting_bid}
                  currency={listing.currency}
                  biddingEnabled={listing.bidding_enabled}
                  isAdmin={isAdmin}
                />
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-4 sm:space-y-6 order-1 lg:order-2">
            {/* Listing Preview */}
            {listing && (
              <Card className="shadow-2xl border-2 border-[hsl(var(--tunisia-gold))]/20">
                <CardContent className="p-5 sm:p-6">
                  {listing.images && listing.images.length > 0 && (
                    <div className="relative mb-5 rounded-xl overflow-hidden">
                      <img
                        src={listing.images[0]}
                        alt={listing.title}
                        className="w-full h-52 sm:h-60 object-cover"
                      />
                      <div className="absolute top-3 right-3">
                        <Badge className="bg-[hsl(var(--tunisia-gold))] text-white font-bold">
                          {t('biddingRoom.liveNow')}
                        </Badge>
                      </div>
                    </div>
                  )}
                  <h3 className="font-black text-lg sm:text-xl mb-4 line-clamp-2">{listing.title}</h3>
                  <div className="space-y-3 text-sm sm:text-base">
                    <div className="flex justify-between p-3 bg-accent/30 rounded-lg">
                      <span className="text-muted-foreground font-semibold">{t('biddingRoom.startingBid')}:</span>
                      <span className="font-black text-[hsl(var(--tunisia-gold))]">
                        {listing.starting_bid?.toLocaleString()} {listing.currency}
                      </span>
                    </div>
                    {listing.current_highest_bid && (
                      <div className="flex justify-between p-3 bg-green-600/10 rounded-lg border border-green-600/20">
                        <span className="text-muted-foreground font-semibold">{t('biddingRoom.currentBid')}:</span>
                        <span className="font-black text-green-600">
                          {listing.current_highest_bid.toLocaleString()} {listing.currency}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between p-3 bg-accent/30 rounded-lg">
                      <span className="text-muted-foreground font-semibold">{t('biddingRoom.totalBids')}:</span>
                      <span className="font-black">{listing.bid_count || 0}</span>
                    </div>
                  </div>
                  <Button
                    onClick={() => navigate(`/listing/${id}`)}
                    variant="outline"
                    className="w-full mt-5 h-11 font-bold border-2"
                  >
                    {t('biddingRoom.viewFullListing')}
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Security Features */}
            <Card className="shadow-2xl border-2 border-[hsl(var(--tunisia-gold))]/20">
              <CardContent className="p-5 sm:p-6">
                <h3 className="font-black text-lg sm:text-xl mb-5 flex items-center gap-3">
                  <div className="w-10 h-10 bg-[hsl(var(--tunisia-gold))]/10 rounded-lg flex items-center justify-center">
                    <ShieldCheck className="w-5 h-5 text-[hsl(var(--tunisia-gold))]" />
                  </div>
                  <span>{t('biddingRoom.securityGuarantee')}</span>
                </h3>
                <ul className="space-y-3.5 text-sm sm:text-base">
                  <li className="flex items-start gap-3 p-3 bg-accent/30 rounded-lg">
                    <CheckCircle className="w-5 h-5 mt-0.5 text-green-600 flex-shrink-0" />
                    <span className="font-medium">{t('biddingRoom.verifiedBidders')}</span>
                  </li>
                  <li className="flex items-start gap-3 p-3 bg-accent/30 rounded-lg">
                    <CheckCircle className="w-5 h-5 mt-0.5 text-green-600 flex-shrink-0" />
                    <span className="font-medium">{t('biddingRoom.realTimeUpdates')}</span>
                  </li>
                  <li className="flex items-start gap-3 p-3 bg-accent/30 rounded-lg">
                    <CheckCircle className="w-5 h-5 mt-0.5 text-green-600 flex-shrink-0" />
                    <span className="font-medium">{t('biddingRoom.securePayments')}</span>
                  </li>
                  <li className="flex items-start gap-3 p-3 bg-accent/30 rounded-lg">
                    <CheckCircle className="w-5 h-5 mt-0.5 text-green-600 flex-shrink-0" />
                    <span className="font-medium">{t('biddingRoom.disputeResolution')}</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <AuthDialog open={showAuthDialog} onOpenChange={setShowAuthDialog} />
      <AIAssistant open={showAI} onOpenChange={setShowAI} />
    </div>
  );
};

export default BiddingRoom;
