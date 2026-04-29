import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/layout/Header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { 
  MapPin, Phone, Mail, Calendar, Ruler, 
  Home, Car, TreePine, ArrowLeft, Edit, Trash2,
  Eye, Star, Loader, Gavel, ShieldCheck
} from "lucide-react";
import AuthDialog from "@/components/auth/AuthDialog";
import AIAssistant from "@/components/ai/AIAssistant";

interface Listing {
  id: string;
  title: string;
  description: string;
  property_type: string;
  price: number;
  currency: string;
  location: string;
  city: string;
  condition: string;
  year_built: number | null;
  area: number | null;
  area_unit: string;
  features: any;
  images: string[];
  contact_phone: string;
  contact_email: string;
  user_id: string | null;
  created_at: string;
  is_featured: boolean;
  views_count: number;
  bidding_enabled: boolean;
  starting_bid: number | null;
  current_highest_bid: number | null;
  bid_count: number;
}

const ListingDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  const [showAI, setShowAI] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    if (id) {
      loadListing();
      incrementViews();
    }
    checkAuth();
  }, [id]);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    setCurrentUser(session?.user || null);
  };

  const loadListing = async () => {
    try {
      const { data, error } = await supabase
        .from('listings')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      setListing(data);
    } catch (error) {
      console.error('Error loading listing:', error);
      toast({
        title: "Error",
        description: "Failed to load listing details",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const incrementViews = async () => {
    try {
      await supabase.rpc('increment_views', { listing_id: id });
    } catch (error) {
      console.error('Error incrementing views:', error);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this listing?')) return;

    try {
      const { error } = await supabase
        .from('listings')
        .delete()
        .eq('id', id)
        .eq('user_id', currentUser?.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Listing deleted successfully",
      });
      navigate('/');
    } catch (error: any) {
      console.error('Error deleting listing:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete listing",
        variant: "destructive",
      });
    }
  };

  const getPropertyIcon = (type: string) => {
    switch (type) {
      case 'car': return <Car className="w-5 h-5" />;
      case 'building': return <Home className="w-5 h-5" />;
      case 'land': return <TreePine className="w-5 h-5" />;
      default: return <Home className="w-5 h-5" />;
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
          <Loader className="w-12 h-12 animate-spin mx-auto text-[hsl(var(--tunisia-gold))]" />
          <p className="text-muted-foreground mt-4">Loading listing...</p>
        </div>
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="min-h-screen bg-background">
        <Header 
          onAuthClick={() => setShowAuthDialog(true)}
          onCreateListingClick={() => navigate('/create')}
          onAIClick={() => setShowAI(true)}
          onSearch={(query) => navigate(`/?search=${query}`)}
        />
        <div className="container mx-auto px-4 py-20 text-center">
          <h1 className="text-2xl font-bold mb-4">Listing Not Found</h1>
          <Button onClick={() => navigate('/')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Button>
        </div>
      </div>
    );
  }

  const isOwner = currentUser?.id === listing.user_id;

  return (
    <div className="min-h-screen bg-background">
      <Header 
        onAuthClick={() => setShowAuthDialog(true)}
        onCreateListingClick={() => navigate('/create')}
        onAIClick={() => setShowAI(true)}
        onSearch={(query) => navigate(`/?search=${query}`)}
      />

      <div className="container mx-auto px-4 py-8">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-4 sm:space-y-6">
            {/* Image Gallery */}
            <Card className="overflow-hidden shadow-elegant">
              <div className="relative aspect-video bg-accent">
                {listing.images && listing.images.length > 0 ? (
                  <>
                    <img
                      src={listing.images[currentImageIndex]}
                      alt={listing.title}
                      className="w-full h-full object-cover"
                    />
                    {listing.images.length > 1 && (
                      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                        {listing.images.map((_, index) => (
                          <button
                            key={index}
                            onClick={() => setCurrentImageIndex(index)}
                            className={`w-3 h-3 rounded-full transition-all ${
                              index === currentImageIndex
                                ? 'bg-white w-8'
                                : 'bg-white/50 hover:bg-white/75'
                            }`}
                          />
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="flex items-center justify-center h-full">
                    {getPropertyIcon(listing.property_type)}
                    <span className="ml-2 text-muted-foreground">No images</span>
                  </div>
                )}
              </div>
            </Card>

            {/* Details */}
            <Card className="shadow-elegant">
              <CardContent className="p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row items-start justify-between gap-3 mb-4">
                  <div className="flex-1 w-full">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <Badge variant="default" className="bg-gradient-tunisia text-xs">
                        {listing.property_type}
                      </Badge>
                      {listing.is_featured && (
                        <Badge variant="outline" className="border-[hsl(var(--tunisia-gold))] text-xs">
                          <Star className="w-3 h-3 mr-1 fill-[hsl(var(--tunisia-gold))]" />
                          Featured
                        </Badge>
                      )}
                      <div className="flex items-center text-xs sm:text-sm text-muted-foreground">
                        <Eye className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                        {listing.views_count} views
                      </div>
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-bold mb-2 break-words">{listing.title}</h1>
                    <div className="flex items-center text-sm text-muted-foreground mb-4">
                      <MapPin className="w-4 h-4 mr-1 flex-shrink-0" />
                      <span className="truncate">{listing.city}, {listing.location}</span>
                    </div>
                  </div>

                  {isOwner && (
                    <div className="flex gap-2 w-full sm:w-auto">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/create?edit=${listing.id}`)}
                        className="flex-1 sm:flex-none"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={handleDelete}
                        className="flex-1 sm:flex-none"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </div>

                <Separator className="my-4 sm:my-6" />

                <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-4 sm:mb-6">
                  {listing.area && (
                    <div className="text-center p-3 sm:p-4 bg-accent/50 rounded-xl">
                      <Ruler className="w-4 h-4 sm:w-5 sm:h-5 mx-auto mb-2 text-[hsl(var(--tunisia-gold))]" />
                      <div className="text-xs sm:text-sm text-muted-foreground">Area</div>
                      <div className="font-bold text-sm sm:text-base">{listing.area} {listing.area_unit}</div>
                    </div>
                  )}
                  {listing.year_built && (
                    <div className="text-center p-3 sm:p-4 bg-accent/50 rounded-xl">
                      <Calendar className="w-4 h-4 sm:w-5 sm:h-5 mx-auto mb-2 text-[hsl(var(--tunisia-gold))]" />
                      <div className="text-xs sm:text-sm text-muted-foreground">Year</div>
                      <div className="font-bold text-sm sm:text-base">{listing.year_built}</div>
                    </div>
                  )}
                  {listing.condition && (
                    <div className="text-center p-3 sm:p-4 bg-accent/50 rounded-xl">
                      <Home className="w-4 h-4 sm:w-5 sm:h-5 mx-auto mb-2 text-[hsl(var(--tunisia-gold))]" />
                      <div className="text-xs sm:text-sm text-muted-foreground">Condition</div>
                      <div className="font-bold text-sm sm:text-base capitalize">{listing.condition}</div>
                    </div>
                  )}
                  <div className="text-center p-3 sm:p-4 bg-accent/50 rounded-xl">
                    <Calendar className="w-4 h-4 sm:w-5 sm:h-5 mx-auto mb-2 text-[hsl(var(--tunisia-gold))]" />
                    <div className="text-xs sm:text-sm text-muted-foreground">Listed</div>
                    <div className="font-bold text-sm sm:text-base">
                      {new Date(listing.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>

                <Separator className="my-4 sm:my-6" />

                <div>
                  <h2 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4">Description</h2>
                  <p className="text-sm sm:text-base text-muted-foreground whitespace-pre-wrap leading-relaxed">
                    {listing.description}
                  </p>
                </div>

                {listing.features && Object.keys(listing.features).length > 0 && (
                  <>
                    <Separator className="my-6" />
                    <div>
                      <h2 className="text-xl font-bold mb-4">Features</h2>
                      <div className="flex flex-wrap gap-2">
                        {Object.entries(listing.features).map(([key, value]) => (
                          value && (
                            <Badge key={key} variant="outline">
                              {key.replace(/_/g, ' ')}
                            </Badge>
                          )
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Bidding Section */}
            {listing.bidding_enabled && (
              <Card className="shadow-elegant border-2 border-[hsl(var(--tunisia-gold))]/30 bg-gradient-tunisia/5">
                <CardContent className="p-8 text-center">
                  <div className="w-16 h-16 bg-gradient-tunisia rounded-full flex items-center justify-center mx-auto mb-4 shadow-glow-tunisia">
                    <Gavel className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold mb-2">Enchères Disponibles</h3>
                  <p className="text-muted-foreground mb-6">
                    Ce produit accepte les enchères dans une salle sécurisée
                  </p>
                  <Button
                    onClick={() => navigate(`/bidding/${listing.id}`)}
                    variant="tunisia"
                    size="lg"
                    className="w-full h-14 text-lg font-bold touch-manipulation active:scale-95 transition-transform"
                  >
                    <Gavel className="w-5 h-5 mr-2" />
                    Accéder à la Salle d'Enchères
                  </Button>
                  <div className="mt-4 flex items-center justify-center gap-2 text-sm text-muted-foreground">
                    <ShieldCheck className="w-4 h-4" />
                    <span>Vérification CIN requise</span>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Price Card */}
            <Card className="shadow-elegant border-2 border-[hsl(var(--tunisia-gold))]/20">
              <CardContent className="p-6">
                <div className="text-center mb-6">
                  <div className="text-sm text-muted-foreground mb-2">
                    {listing.bidding_enabled ? 'Starting Price' : 'Price'}
                  </div>
                  <div className="text-4xl font-bold text-[hsl(var(--tunisia-gold))]">
                    {listing.price.toLocaleString()} {listing.currency}
                  </div>
                  {listing.bidding_enabled && listing.current_highest_bid && (
                    <div className="mt-3 pt-3 border-t">
                      <div className="text-sm text-muted-foreground">Current High Bid</div>
                      <div className="text-2xl font-bold text-green-600">
                        {listing.current_highest_bid.toLocaleString()} {listing.currency}
                      </div>
                    </div>
                  )}
                </div>

                <Separator className="my-6" />

                <div className="space-y-4">
                  <h3 className="font-semibold text-lg">Contact Seller</h3>
                  
                  {listing.contact_phone && (
                    <a
                      href={`tel:${listing.contact_phone}`}
                      className="flex items-center gap-3 p-3 rounded-xl bg-accent/50 hover:bg-accent transition-colors"
                    >
                      <Phone className="w-5 h-5 text-[hsl(var(--tunisia-gold))]" />
                      <span className="font-medium">{listing.contact_phone}</span>
                    </a>
                  )}

                  {listing.contact_email && (
                    <a
                      href={`mailto:${listing.contact_email}`}
                      className="flex items-center gap-3 p-3 rounded-xl bg-accent/50 hover:bg-accent transition-colors"
                    >
                      <Mail className="w-5 h-5 text-[hsl(var(--tunisia-gold))]" />
                      <span className="font-medium break-all">{listing.contact_email}</span>
                    </a>
                  )}
                </div>
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

export default ListingDetails;
