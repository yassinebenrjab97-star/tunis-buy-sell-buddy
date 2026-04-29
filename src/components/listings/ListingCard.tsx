import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Eye, Phone, Calendar, Trash2, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import SellerRating from "./SellerRating";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

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
  };
}

interface ListingCardProps {
  listing: Listing;
  onViewDetails: (id: string) => void;
  isAdmin?: boolean;
  onDelete?: () => void;
}

const ListingCard = ({ listing, onViewDetails, isAdmin, onDelete }: ListingCardProps) => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const { error } = await supabase
        .from('listings')
        .delete()
        .eq('id', listing.id);

      if (error) throw error;

      toast({
        title: "Listing Deleted",
        description: "The listing has been permanently deleted",
      });

      setDeleteDialogOpen(false);
      onDelete?.();
    } catch (error) {
      console.error('Error deleting listing:', error);
      toast({
        title: "Error",
        description: "Failed to delete listing",
        variant: "destructive",
      });
    } finally {
      setDeleting(false);
    }
  };

  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat("fr-TN", {
      style: "currency",
      currency: currency === "TND" ? "TND" : "USD",
      minimumFractionDigits: 0,
    }).format(price);
  };

  const getPropertyTypeLabel = (type: string) => {
    switch (type) {
      case "car": return "Voiture";
      case "building": return "Immobilier";
      case "land": return "Terrain";
      default: return type;
    }
  };

  const getPropertyTypeColor = (type: string) => {
    switch (type) {
      case "car": return "bg-[hsl(var(--tunisia-red)/0.1)] text-[hsl(var(--tunisia-red))] border-[hsl(var(--tunisia-red)/0.2)]";
      case "building": return "bg-[hsl(var(--tunisia-gold)/0.1)] text-[hsl(var(--tunisia-gold))] border-[hsl(var(--tunisia-gold)/0.2)]";
      case "land": return "bg-[hsl(var(--tunisia-green)/0.1)] text-[hsl(var(--tunisia-green))] border-[hsl(var(--tunisia-green)/0.2)]";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <Card className="group hover:shadow-[var(--shadow-elegant)] transition-all duration-300 hover:-translate-y-1 overflow-hidden">
      {/* Image */}
      <div className="relative aspect-[4/3] overflow-hidden">
        {listing.images && listing.images.length > 0 ? (
          <img
            src={listing.images[0]}
            alt={listing.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full bg-muted flex items-center justify-center">
            <span className="text-muted-foreground">Pas d'image</span>
          </div>
        )}
        
        {/* Property Type Badge */}
        <div className="absolute top-3 left-3">
          <Badge className={getPropertyTypeColor(listing.property_type)}>
            {getPropertyTypeLabel(listing.property_type)}
          </Badge>
        </div>

        {/* Condition Badge */}
        {listing.condition && (
          <div className="absolute top-3 right-3">
            <Badge variant="secondary" className="bg-background/80 backdrop-blur-sm">
              {listing.condition}
            </Badge>
          </div>
        )}
      </div>

      <CardContent className="p-4 sm:p-6">
        {/* Title and Price */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-3 gap-2">
          <h3 className="font-semibold text-base sm:text-lg line-clamp-2 flex-1">
            {listing.title}
          </h3>
          <span className="font-bold text-lg sm:text-xl text-[hsl(var(--tunisia-red))] whitespace-nowrap">
            {formatPrice(listing.price, listing.currency)}
          </span>
        </div>

        {/* Location */}
        <div className="flex items-center text-muted-foreground mb-3">
          <MapPin className="w-4 h-4 mr-1" />
          <span className="text-sm">{listing.location}, {listing.city}</span>
        </div>

        {/* Description */}
        <p className="text-muted-foreground text-sm line-clamp-2 mb-4">
          {listing.description}
        </p>

        {/* Details */}
        <div className="flex flex-wrap gap-2 mb-4 text-sm text-muted-foreground">
          {listing.year_built && (
            <div className="flex items-center">
              <Calendar className="w-3 h-3 mr-1" />
              {listing.year_built}
            </div>
          )}
          {listing.area && (
            <div>
              {listing.area} {listing.area_unit}
            </div>
          )}
          <div className="flex items-center">
            <Eye className="w-3 h-3 mr-1" />
            {listing.views_count} vues
          </div>
        </div>

        {/* Seller Info */}
        {listing.profiles?.full_name && (
          <div 
            className="flex items-center justify-between text-sm mb-4 p-2 bg-accent/30 rounded-lg cursor-pointer hover:bg-accent/50 transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/profile/${listing.user_id}`);
            }}
          >
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-muted-foreground" />
              <span className="font-medium">{listing.profiles.full_name}</span>
            </div>
            <SellerRating sellerId={listing.user_id} compact />
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-2">
          <Button
            onClick={() => onViewDetails(listing.id)}
            className="flex-1 bg-[hsl(var(--tunisia-red))] hover:bg-[hsl(var(--tunisia-red)/0.9)] text-white h-10"
          >
            Voir détails
          </Button>
          
          {listing.profiles?.phone && (
            <Button variant="outline" size="sm" className="h-10 sm:w-auto">
              <Phone className="w-4 h-4" />
            </Button>
          )}

          {isAdmin && (
            <Button 
              variant="destructive" 
              size="sm" 
              className="h-10 sm:w-auto touch-manipulation active:scale-95 transition-transform"
              onClick={() => setDeleteDialogOpen(true)}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
        </div>

        {/* Date */}
        <div className="text-xs text-muted-foreground mt-3 text-right">
          {formatDate(listing.created_at)}
        </div>
      </CardContent>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Listing</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to permanently delete "{listing.title}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete} 
              className="bg-red-600 hover:bg-red-700"
              disabled={deleting}
            >
              {deleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
};

export default ListingCard;