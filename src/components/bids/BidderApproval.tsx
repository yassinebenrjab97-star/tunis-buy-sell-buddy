import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Users, CheckCircle, XCircle, Phone, MapPin, User } from "lucide-react";

interface PendingBidder {
  id: string;
  user_id: string;
  full_name: string;
  phone_number: string;
  address: string;
  city: string;
  verification_status: string;
  created_at: string;
}

interface BidderApprovalProps {
  listingId: string;
}

const BidderApproval = ({ listingId }: BidderApprovalProps) => {
  const [pendingBidders, setPendingBidders] = useState<PendingBidder[]>([]);
  const [loading, setLoading] = useState(true);
  const [rejectionNotes, setRejectionNotes] = useState<{ [key: string]: string }>({});
  const { toast } = useToast();

  useEffect(() => {
    loadPendingBidders();

    // Subscribe to real-time updates
    const channel = supabase
      .channel('verification-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_verifications',
        },
        () => {
          loadPendingBidders();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [listingId]);

  const loadPendingBidders = async () => {
    try {
      const { data, error } = await supabase
        .from('user_verifications')
        .select('*')
        .eq('verification_status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPendingBidders(data || []);
    } catch (error) {
      console.error('Error loading pending bidders:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (bidderId: string) => {
    try {
      const { error } = await supabase
        .from('user_verifications')
        .update({ 
          verification_status: 'verified',
          verified_at: new Date().toISOString()
        })
        .eq('id', bidderId);

      if (error) throw error;

      toast({
        title: "Demande Approuvée",
        description: "L'enchérisseur peut maintenant participer",
      });

      loadPendingBidders();
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleReject = async (bidderId: string) => {
    try {
      const { error } = await supabase
        .from('user_verifications')
        .update({ 
          verification_status: 'rejected',
          verification_notes: rejectionNotes[bidderId] || 'Demande refusée par le vendeur'
        })
        .eq('id', bidderId);

      if (error) throw error;

      toast({
        title: "Demande Refusée",
        description: "L'enchérisseur a été informé",
      });

      loadPendingBidders();
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <Card className="border-2 border-yellow-500/20">
        <CardContent className="p-6 text-center">
          <p className="text-muted-foreground">Chargement des demandes...</p>
        </CardContent>
      </Card>
    );
  }

  if (pendingBidders.length === 0) {
    return (
      <Card className="border-2 border-muted">
        <CardContent className="p-6 text-center">
          <Users className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
          <p className="text-muted-foreground">Aucune demande en attente</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-2 border-[hsl(var(--tunisia-gold))]/20">
      <CardHeader className="border-b bg-[hsl(var(--tunisia-gold))]/5">
        <CardTitle className="flex items-center gap-3">
          <Users className="w-6 h-6 text-[hsl(var(--tunisia-gold))]" />
          Demandes de Participation ({pendingBidders.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 space-y-4">
        {pendingBidders.map((bidder) => (
          <div
            key={bidder.id}
            className="p-4 border rounded-xl bg-accent/20 space-y-3"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-muted-foreground" />
                  <span className="font-bold text-lg">{bidder.full_name}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Phone className="w-4 h-4" />
                  <span>{bidder.phone_number}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="w-4 h-4" />
                  <span>{bidder.address}, {bidder.city}</span>
                </div>
              </div>
              <Badge variant="outline" className="text-yellow-600 border-yellow-500">
                En Attente
              </Badge>
            </div>

            <div className="text-xs text-muted-foreground">
              Demande reçue le {new Date(bidder.created_at).toLocaleDateString('fr-FR')}
            </div>

            <Input
              placeholder="Raison du refus (optionnel)"
              value={rejectionNotes[bidder.id] || ''}
              onChange={(e) => setRejectionNotes(prev => ({
                ...prev,
                [bidder.id]: e.target.value
              }))}
              className="text-sm"
            />

            <div className="flex gap-2">
              <Button
                onClick={() => handleApprove(bidder.id)}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Approuver
              </Button>
              <Button
                onClick={() => handleReject(bidder.id)}
                variant="destructive"
                className="flex-1"
              >
                <XCircle className="w-4 h-4 mr-2" />
                Refuser
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default BidderApproval;
