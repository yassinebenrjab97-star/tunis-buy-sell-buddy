import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useTranslation } from "react-i18next";
import Header from "@/components/layout/Header";
import ListingCard from "@/components/listings/ListingCard";
import AuthDialog from "@/components/auth/AuthDialog";
import AIAssistant from "@/components/ai/AIAssistant";
import { useNavigate } from "react-router-dom";
import { Gavel } from "lucide-react";

interface Listing {
  id: string;
  title: string;
  description: string;
  property_type: "car" | "building" | "land";
  price: number;
  currency: string;
  location: string;
  city: string;
  condition?: string;
  year_built?: number;
  area?: number;
  area_unit?: string;
  images: string[];
  views_count: number;
  created_at: string;
  user_id: string;
  bidding_enabled: boolean;
  starting_bid?: number;
  current_highest_bid?: number;
  bid_count?: number;
}

const BidArea = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [authDialogOpen, setAuthDialogOpen] = useState(false);
  const [aiAssistantOpen, setAiAssistantOpen] = useState(false);

  useEffect(() => {
    fetchBiddingListings();
  }, []);

  const fetchBiddingListings = async () => {
    try {
      const { data, error } = await supabase
        .from("listings")
        .select("*")
        .eq("is_active", true)
        .eq("bidding_enabled", true)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setListings((data || []) as Listing[]);
    } catch (error) {
      console.error("Error fetching bidding listings:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (query: string) => {
    if (!query.trim()) {
      fetchBiddingListings();
      return;
    }

    const searchResults = listings.filter(
      (listing) =>
        listing.title.toLowerCase().includes(query.toLowerCase()) ||
        listing.description.toLowerCase().includes(query.toLowerCase()) ||
        listing.location.toLowerCase().includes(query.toLowerCase()) ||
        listing.city.toLowerCase().includes(query.toLowerCase())
    );

    setListings(searchResults);
  };

  const handleViewDetails = (id: string) => {
    navigate(`/bidding/${id}`);
  };

  const handleCreateListing = () => {
    navigate('/create');
  };

  return (
    <div className="min-h-screen bg-background">
      <Header
        onAuthClick={() => setAuthDialogOpen(true)}
        onCreateListingClick={handleCreateListing}
        onAIClick={() => setAiAssistantOpen(true)}
        onSearch={handleSearch}
      />

      {/* Hero Section */}
      <section className="py-16 sm:py-20 md:py-24 bg-gradient-to-br from-[hsl(var(--tunisia-red))] via-[hsl(var(--tunisia-dark))] to-[hsl(var(--tunisia-red))] text-white relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 pattern-tunisia opacity-10" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-[hsl(var(--tunisia-gold))] rounded-full blur-3xl opacity-20" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-[hsl(var(--tunisia-gold-bright))] rounded-full blur-3xl opacity-20" />
        
        <div className="container mx-auto px-4 text-center relative z-10">
          <div className="flex justify-center mb-6 sm:mb-8">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white/15 backdrop-blur-sm rounded-3xl flex items-center justify-center shadow-2xl border border-white/20">
              <Gavel className="w-8 h-8 sm:w-10 sm:h-10 text-[hsl(var(--tunisia-gold))]" />
            </div>
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black mb-4 sm:mb-6 px-4 drop-shadow-2xl">
            {t('bidArea.title')}
          </h1>
          <p className="text-lg sm:text-xl md:text-2xl text-white/95 max-w-3xl mx-auto px-4 leading-relaxed font-medium">
            {t('bidArea.subtitle')}
          </p>
          <div className="flex flex-wrap justify-center gap-4 mt-8">
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full border border-white/20">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              <span className="text-sm font-medium">{t('bidArea.liveAuctions')}</span>
            </div>
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full border border-white/20">
              <span className="text-sm font-medium">{t('bidArea.verified')}</span>
            </div>
          </div>
        </div>
      </section>

      {/* Listings Section */}
      <section className="py-8 sm:py-12 lg:py-16">
        <div className="container mx-auto px-4">
          <div className="mb-6 sm:mb-10">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black mb-3">
              {t('bidArea.activeAuctions')}
            </h2>
            <p className="text-base sm:text-lg text-muted-foreground font-medium">
              {listings.length} {t('bidArea.auctionsAvailable')}
            </p>
          </div>

          {loading ? (
            <div className="text-center py-16 sm:py-20">
              <div className="inline-block animate-spin rounded-full h-12 w-12 sm:h-16 sm:w-16 border-4 border-[hsl(var(--tunisia-gold))] border-t-transparent"></div>
              <p className="mt-6 text-base sm:text-lg text-muted-foreground font-medium">{t('bidArea.loadingAuctions')}</p>
            </div>
          ) : listings.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 sm:gap-6">
              {listings.map((listing) => (
                <ListingCard
                  key={listing.id}
                  listing={listing}
                  onViewDetails={handleViewDetails}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-16 sm:py-20 bg-accent/20 rounded-2xl border-2 border-dashed border-accent">
              <div className="w-20 h-20 sm:w-24 sm:h-24 bg-accent/30 rounded-full flex items-center justify-center mx-auto mb-6">
                <Gavel className="w-10 h-10 sm:w-12 sm:h-12 text-muted-foreground" />
              </div>
              <h3 className="text-xl sm:text-2xl font-bold mb-3">{t('bidArea.noAuctions')}</h3>
              <p className="text-base sm:text-lg text-muted-foreground">
                {t('bidArea.noAuctionsDesc')}
              </p>
            </div>
          )}
        </div>
      </section>

      <AuthDialog open={authDialogOpen} onOpenChange={setAuthDialogOpen} />
      <AIAssistant open={aiAssistantOpen} onOpenChange={setAiAssistantOpen} />
    </div>
  );
};

export default BidArea;
