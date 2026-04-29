import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Header from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { User, Mail, Star, Camera, ArrowLeft, Store } from "lucide-react";
import AuthDialog from "@/components/auth/AuthDialog";

const Profile = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [ratings, setRatings] = useState<any[]>([]);
  const [averageRating, setAverageRating] = useState(0);
  const [userRating, setUserRating] = useState<number | null>(null);
  const [newRating, setNewRating] = useState<number[]>([5]);
  const [loading, setLoading] = useState(true);
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    checkAuth();
    if (userId) {
      loadProfile(userId);
      loadRatings(userId);
    }
  }, [userId]);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    setCurrentUser(session?.user || null);
  };

  const loadProfile = async (id: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', id)
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadRatings = async (sellerId: string) => {
    try {
      const { data, error } = await supabase
        .from('seller_ratings')
        .select('*')
        .eq('seller_id', sellerId);

      if (error) throw error;
      
      setRatings(data || []);
      
      if (data && data.length > 0) {
        const avg = data.reduce((sum, r) => sum + r.rating, 0) / data.length;
        setAverageRating(Math.round(avg * 10) / 10);
      }

      // Check if current user already rated
      if (currentUser) {
        const userRatingData = data?.find(r => r.rater_id === currentUser.id);
        if (userRatingData) {
          setUserRating(userRatingData.rating);
          setNewRating([userRatingData.rating]);
        }
      }
    } catch (error) {
      console.error('Error loading ratings:', error);
    }
  };

  const handleRating = async () => {
    if (!currentUser) {
      setShowAuthDialog(true);
      return;
    }

    if (currentUser.id === userId) {
      toast({
        title: "Erreur",
        description: "Vous ne pouvez pas vous noter vous-même",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('seller_ratings')
        .upsert({
          seller_id: userId,
          rater_id: currentUser.id,
          rating: newRating[0],
        });

      if (error) throw error;

      toast({
        title: "Note enregistrée!",
        description: `Vous avez donné ${newRating[0]}/10`,
      });

      setUserRating(newRating[0]);
      loadRatings(userId!);
    } catch (error: any) {
      console.error('Rating error:', error);
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentUser || currentUser.id !== userId) return;

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${currentUser.id}/avatar.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('property-images')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('property-images')
        .getPublicUrl(fileName);

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('user_id', currentUser.id);

      if (updateError) throw updateError;

      setProfile((prev: any) => ({ ...prev, avatar_url: publicUrl }));
      toast({
        title: "Photo mise à jour!",
        description: "Votre photo de profil a été changée",
      });
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header 
          onAuthClick={() => setShowAuthDialog(true)}
          onCreateListingClick={() => navigate('/create')}
          onAIClick={() => {}}
          onSearch={() => {}}
        />
        <div className="container mx-auto px-4 py-20 text-center">
          <p className="text-muted-foreground">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-background">
        <Header 
          onAuthClick={() => setShowAuthDialog(true)}
          onCreateListingClick={() => navigate('/create')}
          onAIClick={() => {}}
          onSearch={() => {}}
        />
        <div className="container mx-auto px-4 py-20 text-center">
          <p className="text-muted-foreground">Profil non trouvé</p>
        </div>
      </div>
    );
  }

  const isOwnProfile = currentUser?.id === userId;
  const isSeller = profile.role === 'seller';

  return (
    <div className="min-h-screen bg-background">
      <Header 
        onAuthClick={() => setShowAuthDialog(true)}
        onCreateListingClick={() => navigate('/create')}
        onAIClick={() => {}}
        onSearch={() => {}}
      />

      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Retour
        </Button>

        <Card className="shadow-elegant border-2">
          <CardHeader className="text-center pb-0">
            <div className="relative inline-block mx-auto">
              <Avatar className="w-32 h-32 border-4 border-[hsl(var(--tunisia-gold))]">
                <AvatarImage src={profile.avatar_url} />
                <AvatarFallback className="text-4xl bg-gradient-tunisia text-white">
                  {profile.full_name?.charAt(0) || 'U'}
                </AvatarFallback>
              </Avatar>
              {isOwnProfile && (
                <label className="absolute bottom-0 right-0 p-2 bg-[hsl(var(--tunisia-gold))] rounded-full cursor-pointer hover:opacity-80 transition-opacity">
                  <Camera className="w-5 h-5 text-white" />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarUpload}
                    className="hidden"
                    disabled={uploading}
                  />
                </label>
              )}
            </div>
            <CardTitle className="text-2xl mt-4">{profile.full_name || 'Utilisateur'}</CardTitle>
            <Badge variant={isSeller ? "default" : "secondary"} className="mt-2">
              {isSeller ? (
                <>
                  <Store className="w-3 h-3 mr-1" />
                  Vendeur
                </>
              ) : (
                <>
                  <User className="w-3 h-3 mr-1" />
                  Acheteur
                </>
              )}
            </Badge>
          </CardHeader>

          <CardContent className="pt-6 space-y-6">
            {/* Email - only for sellers */}
            {isSeller && (
              <div className="flex items-center gap-3 p-4 bg-accent/30 rounded-lg">
                <Mail className="w-5 h-5 text-muted-foreground" />
                <span className="text-foreground">{currentUser?.email || 'Email non disponible'}</span>
              </div>
            )}

            {/* Rating section - only for sellers */}
            {isSeller && (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-[hsl(var(--tunisia-gold))]/10 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Star className="w-6 h-6 text-[hsl(var(--tunisia-gold))] fill-current" />
                    <span className="text-2xl font-bold">{averageRating}/10</span>
                  </div>
                  <span className="text-muted-foreground">{ratings.length} votes</span>
                </div>

                {/* Rating input */}
                {currentUser && currentUser.id !== userId && (
                  <div className="space-y-3 p-4 border rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold">Votre note:</span>
                      <span className="text-xl font-bold text-[hsl(var(--tunisia-gold))]">{newRating[0]}/10</span>
                    </div>
                    <Slider
                      value={newRating}
                      onValueChange={setNewRating}
                      min={1}
                      max={10}
                      step={1}
                      className="my-4"
                    />
                    <Button onClick={handleRating} variant="tunisia" className="w-full">
                      {userRating ? 'Modifier ma note' : 'Noter ce vendeur'}
                    </Button>
                  </div>
                )}

                {!currentUser && (
                  <Button 
                    onClick={() => setShowAuthDialog(true)} 
                    variant="outline" 
                    className="w-full"
                  >
                    Connectez-vous pour noter
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <AuthDialog
        open={showAuthDialog}
        onOpenChange={setShowAuthDialog}
      />
    </div>
  );
};

export default Profile;
