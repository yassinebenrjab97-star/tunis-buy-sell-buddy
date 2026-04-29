import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { User } from "@supabase/supabase-js";
import { 
  Plus, 
  Eye, 
  Edit, 
  Trash2, 
  Car, 
  Building, 
  TreePine, 
  TrendingUp,
  MapPin,
  Calendar,
  DollarSign
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import TunisiaMap from "@/components/map/TunisiaMap";

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
  is_active: boolean;
  lat?: number;
  lng?: number;
}

const Dashboard = () => {
  const [user, setUser] = useState<User | null>(null);
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    views: 0,
    thisMonth: 0
  });
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      navigate('/');
      return;
    }

    setUser(session.user);
    fetchUserListings(session.user.id);
  };

  const fetchUserListings = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("listings")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      setListings(data || []);
      
      // Calculate stats
      const total = data?.length || 0;
      const active = data?.filter(l => l.is_active).length || 0;
      const views = data?.reduce((sum, l) => sum + l.views_count, 0) || 0;
      const thisMonth = data?.filter(l => 
        new Date(l.created_at).getMonth() === new Date().getMonth()
      ).length || 0;

      setStats({ total, active, views, thisMonth });
    } catch (error) {
      console.error("Error fetching listings:", error);
      toast({
        title: "Erreur",
        description: "Impossible de charger vos annonces",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteListing = async (id: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cette annonce ?")) return;

    try {
      const { error } = await supabase
        .from("listings")
        .delete()
        .eq("id", id);

      if (error) throw error;

      setListings(listings.filter(l => l.id !== id));
      toast({
        title: "Succès",
        description: "Annonce supprimée avec succès",
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de supprimer l'annonce",
        variant: "destructive",
      });
    }
  };

  const toggleListingStatus = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from("listings")
        .update({ is_active: !currentStatus })
        .eq("id", id);

      if (error) throw error;

      setListings(listings.map(l => 
        l.id === id ? { ...l, is_active: !currentStatus } : l
      ));

      toast({
        title: "Succès",
        description: `Annonce ${!currentStatus ? 'activée' : 'désactivée'}`,
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de modifier le statut",
        variant: "destructive",
      });
    }
  };

  const getPropertyIcon = (type: string) => {
    switch (type) {
      case "car": return <Car className="w-4 h-4" />;
      case "building": return <Building className="w-4 h-4" />;
      case "land": return <TreePine className="w-4 h-4" />;
      default: return null;
    }
  };

  const getPropertyTypeLabel = (type: string) => {
    switch (type) {
      case "car": return "Voiture";
      case "building": return "Immobilier";
      case "land": return "Terrain";
      default: return type;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header 
          onAuthClick={() => {}} 
          onCreateListingClick={() => navigate('/create')}
          onAIClick={() => {}}
          onSearch={() => {}}
        />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[hsl(var(--tunisia-red))]"></div>
            <p className="mt-4">Chargement de votre tableau de bord...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header 
        onAuthClick={() => {}} 
        onCreateListingClick={() => navigate('/create')}
        onAIClick={() => {}}
        onSearch={() => {}}
      />

      <div className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">
            Tableau de bord
          </h1>
          <p className="text-muted-foreground">
            Gérez vos annonces sur Tunisia Market
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-6 sm:mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-6">
              <CardTitle className="text-xs sm:text-sm font-medium">Total Annonces</CardTitle>
              <Building className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="p-3 sm:p-6 pt-0">
              <div className="text-xl sm:text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-6">
              <CardTitle className="text-xs sm:text-sm font-medium">Actives</CardTitle>
              <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-green-600" />
            </CardHeader>
            <CardContent className="p-3 sm:p-6 pt-0">
              <div className="text-xl sm:text-2xl font-bold text-green-600">{stats.active}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-6">
              <CardTitle className="text-xs sm:text-sm font-medium">Vues Totales</CardTitle>
              <Eye className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="p-3 sm:p-6 pt-0">
              <div className="text-xl sm:text-2xl font-bold">{stats.views}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-6">
              <CardTitle className="text-xs sm:text-sm font-medium">Ce Mois</CardTitle>
              <Calendar className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="p-3 sm:p-6 pt-0">
              <div className="text-xl sm:text-2xl font-bold">{stats.thisMonth}</div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="listings" className="space-y-6">
          <TabsList>
            <TabsTrigger value="listings">Mes Annonces</TabsTrigger>
            <TabsTrigger value="map">Carte</TabsTrigger>
            <TabsTrigger value="analytics">Statistiques</TabsTrigger>
          </TabsList>

          <TabsContent value="listings" className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
              <h2 className="text-lg sm:text-xl font-semibold">Vos Annonces</h2>
              <Button 
                onClick={() => navigate('/create')}
                className="bg-[hsl(var(--tunisia-red))] hover:bg-[hsl(var(--tunisia-red)/0.9)] w-full sm:w-auto"
              >
                <Plus className="w-4 h-4 mr-2" />
                Nouvelle Annonce
              </Button>
            </div>

            {listings.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center">
                  <Building className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Aucune annonce</h3>
                  <p className="text-muted-foreground mb-4">
                    Vous n'avez pas encore créé d'annonce
                  </p>
                  <Button 
                    onClick={() => navigate('/create')}
                    className="bg-[hsl(var(--tunisia-red))] hover:bg-[hsl(var(--tunisia-red)/0.9)]"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Créer votre première annonce
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {listings.map((listing) => (
                  <Card key={listing.id}>
                    <CardContent className="p-4 sm:p-6">
                      <div className="flex flex-col gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 sm:gap-3 mb-2 flex-wrap">
                            {getPropertyIcon(listing.property_type)}
                            <h3 className="font-semibold text-base sm:text-lg line-clamp-1 flex-1">{listing.title}</h3>
                            <Badge variant={listing.is_active ? "default" : "secondary"} className="text-xs">
                              {listing.is_active ? "Active" : "Inactive"}
                            </Badge>
                          </div>
                          
                          <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                            {listing.description}
                          </p>
                          
                          <div className="flex flex-wrap gap-3 sm:gap-4 text-xs sm:text-sm text-muted-foreground mb-4">
                            <div className="flex items-center gap-1">
                              <DollarSign className="w-3 h-3 sm:w-4 sm:h-4" />
                              <span className="truncate">{listing.price.toLocaleString()} {listing.currency}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <MapPin className="w-3 h-3 sm:w-4 sm:h-4" />
                              <span className="truncate">{listing.location}, {listing.city}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Eye className="w-3 h-3 sm:w-4 sm:h-4" />
                              {listing.views_count} vues
                            </div>
                            <div className="flex items-center gap-1">
                              <Calendar className="w-3 h-3 sm:w-4 sm:h-4" />
                              {new Date(listing.created_at).toLocaleDateString()}
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigate(`/listing/${listing.id}`)}
                            className="flex-1 sm:flex-none"
                          >
                            <Eye className="w-4 h-4 sm:mr-2" />
                            <span className="hidden sm:inline">View</span>
                          </Button>
                          
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigate(`/create?edit=${listing.id}`)}
                            className="flex-1 sm:flex-none"
                          >
                            <Edit className="w-4 h-4 sm:mr-2" />
                            <span className="hidden sm:inline">Edit</span>
                          </Button>
                          
                          <Button
                            variant={listing.is_active ? "secondary" : "default"}
                            size="sm"
                            onClick={() => toggleListingStatus(listing.id, listing.is_active)}
                            className="flex-1 sm:flex-none text-xs"
                          >
                            {listing.is_active ? "Désactiver" : "Activer"}
                          </Button>
                          
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDeleteListing(listing.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="map" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Localisation de vos annonces</CardTitle>
              </CardHeader>
              <CardContent className="p-0 sm:p-6">
                <div className="h-[400px] sm:h-[600px]">
                  <TunisiaMap 
                    listings={listings.filter(l => l.lat && l.lng)}
                    interactive={false}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Répartition par type</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {["car", "building", "land"].map(type => {
                      const count = listings.filter(l => l.property_type === type).length;
                      const percentage = listings.length > 0 ? (count / listings.length * 100).toFixed(1) : 0;
                      
                      return (
                        <div key={type} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {getPropertyIcon(type)}
                            <span>{getPropertyTypeLabel(type)}</span>
                          </div>
                          <div className="text-right">
                            <span className="font-semibold">{count}</span>
                            <span className="text-muted-foreground ml-2">({percentage}%)</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Vues par annonce</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {listings
                      .sort((a, b) => b.views_count - a.views_count)
                      .slice(0, 5)
                      .map(listing => (
                        <div key={listing.id} className="flex justify-between items-center">
                          <span className="text-sm truncate flex-1">{listing.title}</span>
                          <span className="font-semibold ml-2">{listing.views_count}</span>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Dashboard;