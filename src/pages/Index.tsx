import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/layout/Header";
import Hero from "@/components/layout/Hero";
import ListingCard from "@/components/listings/ListingCard";
import AuthDialog from "@/components/auth/AuthDialog";
import AIAssistant from "@/components/ai/AIAssistant";
import TunisiaMap from "@/components/map/TunisiaMap";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Filter, Grid, List, Map } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { tunisianGovernorates } from "@/data/tunisia";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

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
  profiles?: {
    full_name?: string;
    phone?: string;
  } | null;
}

const Index = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [listings, setListings] = useState<Listing[]>([]);
  const [filteredListings, setFilteredListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [authDialogOpen, setAuthDialogOpen] = useState(false);
  const [aiAssistantOpen, setAiAssistantOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedCity, setSelectedCity] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"grid" | "list" | "map">("grid");
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    fetchListings();
    checkAdminStatus();
  }, []);

  useEffect(() => {
    filterListings();
  }, [listings, selectedCategory, selectedCity]);

  const fetchListings = async () => {
    try {
      const { data, error } = await supabase
        .from("listings")
        .select(`
          *,
          profiles!listings_user_id_fkey (
            full_name,
            phone
          )
        `)
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setListings((data || []) as Listing[]);
    } catch (error) {
      console.error("Error fetching listings:", error);
    } finally {
      setLoading(false);
    }
  };

  const checkAdminStatus = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', session.user.id)
      .eq('role', 'admin')
      .maybeSingle();

    setIsAdmin(!!roleData);
  };

  const filterListings = () => {
    let filtered = listings;

    if (selectedCategory !== "all") {
      filtered = filtered.filter((listing) => listing.property_type === selectedCategory);
    }

    if (selectedCity !== "all") {
      filtered = filtered.filter((listing) => listing.city === selectedCity);
    }

    setFilteredListings(filtered);
  };

  const handleSearch = (query: string) => {
    if (!query.trim()) {
      setFilteredListings(listings);
      return;
    }

    const searchResults = listings.filter(
      (listing) =>
        listing.title.toLowerCase().includes(query.toLowerCase()) ||
        listing.description.toLowerCase().includes(query.toLowerCase()) ||
        listing.location.toLowerCase().includes(query.toLowerCase()) ||
        listing.city.toLowerCase().includes(query.toLowerCase())
    );

    setFilteredListings(searchResults);
  };

  const handleCategoryClick = (category: string) => {
    setSelectedCategory(category);
  };

  const handleViewDetails = (id: string) => {
    navigate(`/listing/${id}`);
  };

  const handleCreateListing = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      setAuthDialogOpen(true);
      return;
    }
    
    navigate('/create');
  };

  const allTunisianCities = tunisianGovernorates.map(gov => gov.name).sort();

  return (
    <div className="min-h-screen bg-background">
      <Header
        onAuthClick={() => setAuthDialogOpen(true)}
        onCreateListingClick={handleCreateListing}
        onAIClick={() => setAiAssistantOpen(true)}
        onSearch={handleSearch}
      />

      <Hero onCategoryClick={handleCategoryClick} />

      {/* Filters Section */}
      <section id="listings-section" className="py-6 sm:py-8 bg-muted/30 scroll-mt-20">
        <div className="container mx-auto px-4">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-3 sm:gap-4">
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-full sm:w-48 h-11">
                  <SelectValue placeholder={t('filters.allCategories')} />
                </SelectTrigger>
                <SelectContent className="z-50">
                  <SelectItem value="all">{t('filters.allCategories')}</SelectItem>
                  <SelectItem value="car">{t('filters.cars')}</SelectItem>
                  <SelectItem value="building">{t('filters.buildings')}</SelectItem>
                  <SelectItem value="land">{t('filters.land')}</SelectItem>
                </SelectContent>
              </Select>

              <Select value={selectedCity} onValueChange={setSelectedCity}>
                <SelectTrigger className="w-full sm:w-48 h-11">
                  <SelectValue placeholder={t('filters.allCities')} />
                </SelectTrigger>
                <SelectContent className="z-50 max-h-[300px]">
                  <SelectItem value="all">{t('filters.allCities')}</SelectItem>
                  {allTunisianCities.map((city) => (
                    <SelectItem key={city} value={city}>
                      {city}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button 
                variant="outline" 
                size="sm" 
                className="w-full sm:w-auto h-11 touch-manipulation active:scale-95 transition-transform"
                onClick={() => {
                  toast({
                    title: t('filters.moreFilters'),
                    description: "Advanced filters coming soon!",
                  });
                }}
              >
                <Filter className="w-4 h-4 mr-2" />
                {t('filters.moreFilters')}
              </Button>
            </div>

            <div className="flex items-center justify-between gap-2 flex-wrap">
              <span className="text-sm text-muted-foreground">
                {filteredListings.length} {filteredListings.length !== 1 ? t('filters.results_plural') : t('filters.results')}
              </span>
              
              <div className="flex items-center border rounded-lg">
                <Button
                  variant={viewMode === "grid" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("grid")}
                  className="rounded-r-none h-9"
                >
                  <Grid className="w-4 h-4" />
                </Button>
                <Button
                  variant={viewMode === "list" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("list")}
                  className="rounded-none h-9"
                >
                  <List className="w-4 h-4" />
                </Button>
                <Button
                  variant={viewMode === "map" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("map")}
                  className="rounded-l-none h-9"
                >
                  <Map className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Listings Section */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[hsl(var(--tunisia-red))]"></div>
              <p className="mt-4 text-muted-foreground">{t('listings.loading')}</p>
            </div>
          ) : viewMode === "map" ? (
            <div className="h-[600px] rounded-lg overflow-hidden border">
              <TunisiaMap 
                listings={filteredListings}
                onLocationSelect={(location) => {
                  console.log("Location selected:", location);
                }}
              />
            </div>
          ) : filteredListings.length > 0 ? (
            <div className={viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6" : "space-y-4"}>
              {filteredListings.map((listing) => (
                <ListingCard
                  key={listing.id}
                  listing={listing}
                  onViewDetails={handleViewDetails}
                  isAdmin={isAdmin}
                  onDelete={fetchListings}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-lg text-muted-foreground mb-4">
                {t('listings.noResults')}
              </p>
              <Button
                onClick={() => {
                  setSelectedCategory("all");
                  setSelectedCity("all");
                }}
                variant="outline"
              >
                {t('listings.resetFilters')}
              </Button>
            </div>
          )}
        </div>
      </section>

      <AuthDialog open={authDialogOpen} onOpenChange={setAuthDialogOpen} />
      <AIAssistant open={aiAssistantOpen} onOpenChange={setAiAssistantOpen} />
    </div>
  );
};

export default Index;
