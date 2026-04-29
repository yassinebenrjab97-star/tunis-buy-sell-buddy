import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";
import { Gavel, TrendingUp, Users, Clock, CheckCircle, XCircle, Loader, Trash2 } from "lucide-react";
import { User } from "@supabase/supabase-js";

interface Bid {
  id: string;
  bidder_name: string;
  bid_amount: number;
  currency: string;
  message: string | null;
  status: string;
  created_at: string;
  bidder_id: string;
}

interface BiddingSectionProps {
  listingId: string;
  listingOwnerId: string | null;
  currentHighestBid: number | null;
  startingBid: number | null;
  currency: string;
  biddingEnabled: boolean;
  isAdmin?: boolean;
}

const BiddingSection = ({
  listingId,
  listingOwnerId,
  currentHighestBid,
  startingBid,
  currency,
  biddingEnabled,
  isAdmin = false
}: BiddingSectionProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [bids, setBids] = useState<Bid[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [bidAmount, setBidAmount] = useState("");
  const [bidMessage, setBidMessage] = useState("");
  const { toast } = useToast();
  const { t } = useTranslation();

  const isOwner = user?.id === listingOwnerId;
  const minBidAmount = currentHighestBid 
    ? currentHighestBid + 100 
    : startingBid || 0;

  useEffect(() => {
    checkAuth();
    loadBids();

    // Subscribe to real-time bid updates
    const channel = supabase
      .channel('bids-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'bids',
          filter: `listing_id=eq.${listingId}`
        },
        () => {
          loadBids();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [listingId]);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    setUser(session?.user || null);
  };

  const loadBids = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('bids')
        .select('*')
        .eq('listing_id', listingId)
        .order('bid_amount', { ascending: false });

      if (error) throw error;
      setBids(data || []);
    } catch (error) {
      console.error('Error loading bids:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePlaceBid = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: t('biddingRoom.loginRequired'),
        description: t('biddingRoom.loginRequiredDesc'),
        variant: "destructive",
      });
      return;
    }

    const amount = parseFloat(bidAmount);
    if (isNaN(amount) || amount < minBidAmount) {
      toast({
        title: t('common.error'),
        description: `${t('biddingRoom.minimumBid')}: ${minBidAmount} ${currency}`,
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    try {
      // Get user profile for name and email
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, phone')
        .eq('user_id', user.id)
        .single();

      const { error } = await supabase
        .from('bids')
        .insert([{
          listing_id: listingId,
          bidder_id: user.id,
          bidder_name: profile?.full_name || 'Anonymous',
          bidder_email: user.email || '',
          bidder_phone: profile?.phone || '',
          bid_amount: amount,
          currency: currency,
          message: bidMessage.trim() || null,
        }]);

      if (error) throw error;

      // Update listing's highest bid
      await supabase
        .from('listings')
        .update({
          current_highest_bid: amount,
          bid_count: bids.length + 1
        })
        .eq('id', listingId);

      toast({
        title: t('common.success'),
        description: `${t('biddingRoom.placeBidNow')}: ${amount} ${currency}`,
      });

      setBidAmount("");
      setBidMessage("");
      loadBids();
    } catch (error: any) {
      console.error('Error placing bid:', error);
      toast({
        title: t('common.error'),
        description: error.message || t('common.error'),
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateBidStatus = async (bidId: string, status: 'accepted' | 'rejected') => {
    if (!isOwner) return;

    try {
      const { error } = await supabase
        .from('bids')
        .update({ status })
        .eq('id', bidId);

      if (error) throw error;

      if (status === 'accepted') {
        // Mark other bids as outbid
        await supabase
          .from('bids')
          .update({ status: 'outbid' })
          .eq('listing_id', listingId)
          .neq('id', bidId)
          .eq('status', 'pending');
      }

      toast({
        title: status === 'accepted' ? t('biddingRoom.bidAccepted') : t('biddingRoom.bidRejected'),
        description: status === 'accepted' 
          ? t('biddingRoom.bidAcceptedDesc')
          : t('biddingRoom.bidRejectedDesc'),
      });

      loadBids();
    } catch (error: any) {
      console.error('Error updating bid:', error);
      toast({
        title: t('common.error'),
        description: error.message || t('common.error'),
        variant: "destructive",
      });
    }
  };

  const handleDeleteBid = async (bidId: string) => {
    if (!isAdmin) return;

    try {
      const { error } = await supabase
        .from('bids')
        .delete()
        .eq('id', bidId);

      if (error) throw error;

      toast({
        title: t('biddingRoom.bidDeleted'),
        description: t('biddingRoom.bidDeletedDesc'),
      });

      loadBids();
    } catch (error: any) {
      console.error('Error deleting bid:', error);
      toast({
        title: t('common.error'),
        description: error.message || t('common.error'),
        variant: "destructive",
      });
    }
  };

  if (!biddingEnabled) {
    return null;
  }

  return (
    <Card className="shadow-2xl border-2 border-[hsl(var(--tunisia-gold))]/30 bg-gradient-to-br from-card to-card/50">
      <CardHeader className="bg-gradient-to-r from-[hsl(var(--tunisia-gold))]/10 via-transparent to-[hsl(var(--tunisia-gold))]/10 p-5 sm:p-7 border-b border-[hsl(var(--tunisia-gold))]/20">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-[hsl(var(--tunisia-gold))] to-[hsl(var(--tunisia-gold-bright))] rounded-2xl flex items-center justify-center shadow-glow-tunisia">
              <Gavel className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
            </div>
            <div>
              <CardTitle className="text-2xl sm:text-3xl font-black">{t('biddingRoom.placeBid')}</CardTitle>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1 font-medium">
                {t('biddingRoom.openAuction')}
              </p>
            </div>
          </div>
          {bids.length > 0 && (
            <div className="text-left sm:text-right w-full sm:w-auto bg-accent/50 rounded-xl p-3 sm:p-4 border border-[hsl(var(--tunisia-gold))]/20">
              <div className="text-xs sm:text-sm text-muted-foreground font-semibold mb-1">{t('biddingRoom.currentBid')}</div>
              <div className="text-2xl sm:text-3xl font-black text-[hsl(var(--tunisia-gold))]">
                {currentHighestBid?.toLocaleString()} {currency}
              </div>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-5 sm:p-7 space-y-6 sm:space-y-8">
        {/* Bidding Stats */}
        <div className="grid grid-cols-3 gap-3 sm:gap-5">
          <div className="text-center p-3 sm:p-5 bg-gradient-to-br from-accent/60 to-accent/40 rounded-2xl border border-border shadow-lg hover:shadow-xl transition-shadow">
            <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 mx-auto mb-2 sm:mb-3 text-[hsl(var(--tunisia-gold))]" />
            <div className="text-[10px] sm:text-xs text-muted-foreground font-semibold uppercase tracking-wide">{t('biddingRoom.startingBid')}</div>
            <div className="text-base sm:text-xl font-black mt-1">{startingBid?.toLocaleString()} {currency}</div>
          </div>
          <div className="text-center p-3 sm:p-5 bg-gradient-to-br from-accent/60 to-accent/40 rounded-2xl border border-border shadow-lg hover:shadow-xl transition-shadow">
            <Users className="w-5 h-5 sm:w-6 sm:h-6 mx-auto mb-2 sm:mb-3 text-[hsl(var(--tunisia-gold))]" />
            <div className="text-[10px] sm:text-xs text-muted-foreground font-semibold uppercase tracking-wide">{t('biddingRoom.totalBids')}</div>
            <div className="text-base sm:text-xl font-black mt-1">{bids.length}</div>
          </div>
          <div className="text-center p-3 sm:p-5 bg-gradient-to-br from-accent/60 to-accent/40 rounded-2xl border border-border shadow-lg hover:shadow-xl transition-shadow">
            <Clock className="w-5 h-5 sm:w-6 sm:h-6 mx-auto mb-2 sm:mb-3 text-[hsl(var(--tunisia-gold))]" />
            <div className="text-[10px] sm:text-xs text-muted-foreground font-semibold uppercase tracking-wide">{t('biddingRoom.status')}</div>
            <Badge variant="default" className="mt-1 sm:mt-2 text-xs font-bold">🟢 {t('biddingRoom.active')}</Badge>
          </div>
        </div>

        {/* Place Bid Form (for non-owners) */}
        {!isOwner && user && (
          <form onSubmit={handlePlaceBid} className="space-y-5 sm:space-y-6 bg-gradient-to-br from-accent/30 to-accent/10 p-5 sm:p-7 rounded-2xl border border-[hsl(var(--tunisia-gold))]/20">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-[hsl(var(--tunisia-gold))]/10 rounded-lg flex items-center justify-center">
                <Gavel className="w-5 h-5 text-[hsl(var(--tunisia-gold))]" />
              </div>
              <h3 className="text-xl font-bold">{t('biddingRoom.placeBid')}</h3>
            </div>
            
            <div>
              <Label htmlFor="bidAmount" className="text-base font-bold mb-3 block">{t('biddingRoom.bidAmount')}</Label>
              <div className="relative">
                <Input
                  id="bidAmount"
                  type="number"
                  step="0.01"
                  min={minBidAmount}
                  value={bidAmount}
                  onChange={(e) => setBidAmount(e.target.value)}
                  placeholder={`${t('biddingRoom.minimumBid')}: ${minBidAmount} ${currency}`}
                  className="h-14 sm:h-16 text-lg sm:text-xl pr-20 bg-background border-2 border-border focus:border-[hsl(var(--tunisia-gold))] font-bold shadow-sm"
                  required
                />
                <span className="absolute right-5 top-1/2 -translate-y-1/2 text-muted-foreground font-bold text-base sm:text-lg">
                  {currency}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground mt-3 font-medium bg-muted/50 px-3 py-2 rounded-lg">
                💡 {t('biddingRoom.minimumBid')}: <strong>{minBidAmount.toLocaleString()} {currency}</strong>
              </p>
            </div>

            <div>
              <Label htmlFor="bidMessage" className="text-base font-bold mb-3 block">{t('biddingRoom.messageOptional')}</Label>
              <Textarea
                id="bidMessage"
                value={bidMessage}
                onChange={(e) => setBidMessage(e.target.value)}
                placeholder={t('biddingRoom.messagePlaceholder')}
                className="min-h-24 sm:min-h-28 bg-background border-2 border-border focus:border-[hsl(var(--tunisia-gold))] shadow-sm"
                maxLength={500}
              />
              <p className="text-xs text-muted-foreground mt-2">
                {bidMessage.length}/500 {t('biddingRoom.characters')}
              </p>
            </div>

            <Button
              type="submit"
              disabled={submitting}
              className="w-full h-14 sm:h-16 text-lg sm:text-xl font-black bg-gradient-to-r from-[hsl(var(--tunisia-gold))] to-[hsl(var(--tunisia-gold-bright))] hover:from-[hsl(var(--tunisia-gold-bright))] hover:to-[hsl(var(--tunisia-gold))] text-[hsl(var(--tunisia-dark))] shadow-glow-tunisia"
            >
              {submitting ? (
                <>
                  <Loader className="w-5 h-5 sm:w-6 sm:h-6 mr-3 animate-spin" />
                  {t('biddingRoom.submittingBid')}
                </>
              ) : (
                <>
                  <Gavel className="w-5 h-5 sm:w-6 sm:h-6 mr-3" />
                  {t('biddingRoom.placeBidNow')}
                </>
              )}
            </Button>
          </form>
        )}

        {!user && (
          <div className="text-center py-12 bg-gradient-to-br from-accent/30 to-accent/10 rounded-2xl border-2 border-dashed border-[hsl(var(--tunisia-gold))]/30">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-[hsl(var(--tunisia-gold))]/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Gavel className="w-8 h-8 sm:w-10 sm:h-10 text-[hsl(var(--tunisia-gold))]" />
            </div>
            <h3 className="text-xl font-bold mb-2">{t('biddingRoom.signInToBid')}</h3>
            <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
              {t('biddingRoom.signInToBidDesc')}
            </p>
            <Button variant="tunisia" size="lg" className="font-bold">
              {t('biddingRoom.signIn')}
            </Button>
          </div>
        )}

        {/* Bids List */}
        {bids.length > 0 && (
          <>
            <Separator className="my-6" />
            <div>
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-xl sm:text-2xl font-black">
                  {isOwner ? t('biddingRoom.allBids') : t('biddingRoom.recentBids')}
                </h3>
                <Badge variant="outline" className="font-bold">
                  {bids.length} {t('biddingRoom.total')}
                </Badge>
              </div>
              <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                {bids.map((bid, index) => (
                  <div
                    key={bid.id}
                    className={`p-4 sm:p-5 rounded-2xl border-2 transition-all hover:shadow-lg ${
                      index === 0
                        ? 'border-[hsl(var(--tunisia-gold))] bg-gradient-to-br from-[hsl(var(--tunisia-gold))]/10 to-[hsl(var(--tunisia-gold))]/5 shadow-glow-tunisia'
                        : 'border-border bg-gradient-to-br from-card to-accent/20'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3 gap-3">
                      <div className="flex items-center gap-3 flex-wrap">
                        {index === 0 && (
                          <Badge className="bg-[hsl(var(--tunisia-gold))] text-white text-xs font-bold px-3 py-1">
                            🏆 {t('biddingRoom.highestBid')}
                          </Badge>
                        )}
                        <span className="font-bold text-base sm:text-lg">
                          {isOwner || bid.bidder_id === user?.id ? bid.bidder_name : t('biddingRoom.anonymousBidder')}
                        </span>
                      </div>
                      <div className="text-left sm:text-right">
                        <div className="text-xl sm:text-2xl font-black text-[hsl(var(--tunisia-gold))]">
                          {bid.bid_amount.toLocaleString()} {bid.currency}
                        </div>
                      </div>
                    </div>

                    {bid.message && (isOwner || bid.bidder_id === user?.id) && (
                      <div className="mb-3 p-3 bg-accent/30 rounded-lg">
                        <p className="text-xs sm:text-sm text-foreground italic line-clamp-3">
                          💬 "{bid.message}"
                        </p>
                      </div>
                    )}

                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mt-4 gap-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant={
                          bid.status === 'accepted' ? 'default' :
                          bid.status === 'rejected' ? 'destructive' :
                          bid.status === 'outbid' ? 'secondary' : 'outline'
                        } className="text-xs font-bold px-3 py-1">
                          {bid.status === 'accepted' ? `✅ ${t('biddingRoom.accepted')}` :
                           bid.status === 'rejected' ? `❌ ${t('biddingRoom.rejected')}` :
                           bid.status === 'outbid' ? `📉 ${t('biddingRoom.outbid')}` : `⏳ ${t('biddingRoom.pending')}`}
                        </Badge>
                        <span className="text-xs text-muted-foreground font-medium">
                          {new Date(bid.created_at).toLocaleString('en-US', {
                            day: '2-digit',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>

                      <div className="flex gap-2 w-full sm:w-auto">
                        {isOwner && bid.status === 'pending' && (
                          <>
                            <Button
                              size="sm"
                              onClick={() => handleUpdateBidStatus(bid.id, 'accepted')}
                              className="bg-green-600 hover:bg-green-700 flex-1 sm:flex-none h-10 font-bold"
                            >
                              <CheckCircle className="w-4 h-4 mr-1.5" />
                              <span className="text-xs sm:text-sm">{t('biddingRoom.accept')}</span>
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleUpdateBidStatus(bid.id, 'rejected')}
                              className="flex-1 sm:flex-none h-10 font-bold"
                            >
                              <XCircle className="w-4 h-4 mr-1.5" />
                              <span className="text-xs sm:text-sm">{t('biddingRoom.reject')}</span>
                            </Button>
                          </>
                        )}
                        
                        {isAdmin && (
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDeleteBid(bid.id)}
                            className="h-10 font-bold"
                          >
                            <Trash2 className="w-4 h-4 mr-1.5" />
                            <span className="text-xs sm:text-sm">{t('common.delete')}</span>
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default BiddingSection;
