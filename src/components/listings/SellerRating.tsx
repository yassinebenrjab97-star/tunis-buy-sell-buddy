import React, { useState, useEffect } from "react";
import { Star } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface SellerRatingProps {
  sellerId: string;
  compact?: boolean;
}

const SellerRating = ({ sellerId, compact = false }: SellerRatingProps) => {
  const [averageRating, setAverageRating] = useState<number | null>(null);
  const [ratingCount, setRatingCount] = useState(0);

  useEffect(() => {
    loadRatings();
  }, [sellerId]);

  const loadRatings = async () => {
    try {
      const { data, error } = await supabase
        .from('seller_ratings')
        .select('rating')
        .eq('seller_id', sellerId);

      if (error) throw error;

      if (data && data.length > 0) {
        const avg = data.reduce((sum, r) => sum + r.rating, 0) / data.length;
        setAverageRating(Math.round(avg * 10) / 10);
        setRatingCount(data.length);
      }
    } catch (error) {
      console.error('Error loading ratings:', error);
    }
  };

  if (averageRating === null) return null;

  if (compact) {
    return (
      <div className="flex items-center gap-1 text-xs">
        <Star className="w-3 h-3 text-[hsl(var(--tunisia-gold))] fill-current" />
        <span className="font-medium">{averageRating}</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1.5">
      <Star className="w-4 h-4 text-[hsl(var(--tunisia-gold))] fill-current" />
      <span className="font-semibold">{averageRating}/10</span>
      <span className="text-muted-foreground text-sm">({ratingCount})</span>
    </div>
  );
};

export default SellerRating;
