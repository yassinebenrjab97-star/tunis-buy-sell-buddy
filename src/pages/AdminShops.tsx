import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Store, CheckCircle, XCircle, Clock, Loader, Trash2 } from "lucide-react";
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

interface Shop {
  id: string;
  shop_name: string;
  shop_description: string;
  contact_email: string;
  contact_phone: string;
  city: string;
  address: string;
  website_url: string;
  status: string;
  created_at: string;
  owner_id: string;
}

const AdminShops = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [shops, setShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [selectedShop, setSelectedShop] = useState<Shop | null>(null);
  const [actionType, setActionType] = useState<'approve' | 'reject' | 'delete' | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [shopToDelete, setShopToDelete] = useState<Shop | null>(null);

  useEffect(() => {
    checkAdminAndLoadShops();
  }, []);

  const checkAdminAndLoadShops = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      navigate('/');
      return;
    }

    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', session.user.id)
      .eq('role', 'admin')
      .single();

    if (!roleData) {
      toast({
        title: "Access Denied",
        description: "You don't have admin privileges",
        variant: "destructive",
      });
      navigate('/');
      return;
    }

    setIsAdmin(true);
    loadShops();
  };

  const loadShops = async () => {
    try {
      const { data, error } = await supabase
        .from('trusted_shops')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setShops(data || []);
    } catch (error) {
      console.error('Error loading shops:', error);
      toast({
        title: "Error",
        description: "Failed to load shops",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!selectedShop) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const { error } = await supabase
        .from('trusted_shops')
        .update({
          status: 'approved',
          approved_by: session?.user.id,
          approved_at: new Date().toISOString(),
        })
        .eq('id', selectedShop.id);

      if (error) throw error;

      toast({
        title: "Shop Approved",
        description: `${selectedShop.shop_name} has been approved successfully`,
      });

      loadShops();
      setSelectedShop(null);
      setActionType(null);
    } catch (error) {
      console.error('Error approving shop:', error);
      toast({
        title: "Error",
        description: "Failed to approve shop",
        variant: "destructive",
      });
    }
  };

  const handleReject = async () => {
    if (!selectedShop || !rejectionReason.trim()) {
      toast({
        title: "Rejection Reason Required",
        description: "Please provide a reason for rejection",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('trusted_shops')
        .update({
          status: 'rejected',
          rejection_reason: rejectionReason,
        })
        .eq('id', selectedShop.id);

      if (error) throw error;

      toast({
        title: "Shop Rejected",
        description: `${selectedShop.shop_name} has been rejected`,
      });

      loadShops();
      setSelectedShop(null);
      setActionType(null);
      setRejectionReason("");
    } catch (error) {
      console.error('Error rejecting shop:', error);
      toast({
        title: "Error",
        description: "Failed to reject shop",
        variant: "destructive",
      });
    }
  };

  const handleDeleteShop = async () => {
    if (!shopToDelete) return;

    try {
      const { error } = await supabase
        .from('trusted_shops')
        .delete()
        .eq('id', shopToDelete.id);

      if (error) throw error;

      toast({
        title: "Shop Deleted",
        description: `${shopToDelete.shop_name} has been permanently deleted`,
      });

      loadShops();
      setShopToDelete(null);
      setActionType(null);
    } catch (error) {
      console.error('Error deleting shop:', error);
      toast({
        title: "Error",
        description: "Failed to delete shop",
        variant: "destructive",
      });
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
        <div className="container mx-auto px-4 py-20 text-center">
          <Loader className="w-12 h-12 animate-spin mx-auto text-[hsl(var(--tunisia-gold))]" />
          <p className="text-muted-foreground mt-4">Loading shops...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) return null;

  const pendingShops = shops.filter(s => s.status === 'pending');
  const approvedShops = shops.filter(s => s.status === 'approved');
  const rejectedShops = shops.filter(s => s.status === 'rejected');

  return (
    <div className="min-h-screen bg-background">
      <Header 
        onAuthClick={() => {}}
        onCreateListingClick={() => navigate('/create')}
        onAIClick={() => {}}
        onSearch={() => {}}
      />

      <div className="container mx-auto px-4 py-12">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Shop Management</h1>
          <p className="text-muted-foreground">Review and manage shop registrations</p>
        </div>

        {/* Pending Shops */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <Clock className="w-6 h-6 text-yellow-600" />
            Pending Approval ({pendingShops.length})
          </h2>
          {pendingShops.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                No pending shops
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {pendingShops.map((shop) => (
                <Card key={shop.id} className="shadow-elegant">
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row justify-between gap-4">
                      <div className="flex-1">
                        <h3 className="text-xl font-bold mb-2">{shop.shop_name}</h3>
                        <p className="text-muted-foreground mb-3">{shop.shop_description}</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                          <p><strong>Email:</strong> {shop.contact_email}</p>
                          <p><strong>Phone:</strong> {shop.contact_phone || 'N/A'}</p>
                          <p><strong>City:</strong> {shop.city}</p>
                          <p><strong>Address:</strong> {shop.address || 'N/A'}</p>
                          {shop.website_url && <p><strong>Website:</strong> {shop.website_url}</p>}
                        </div>
                      </div>
                      <div className="flex md:flex-col gap-2">
                        <Button
                          onClick={() => {
                            setSelectedShop(shop);
                            setActionType('approve');
                          }}
                          className="bg-green-600 hover:bg-green-700 flex-1 touch-manipulation active:scale-95 transition-transform"
                          type="button"
                        >
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Approve
                        </Button>
                        <Button
                          onClick={() => {
                            setSelectedShop(shop);
                            setActionType('reject');
                          }}
                          variant="destructive"
                          className="flex-1 touch-manipulation active:scale-95 transition-transform"
                          type="button"
                        >
                          <XCircle className="w-4 h-4 mr-2" />
                          Reject
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Approved Shops */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <CheckCircle className="w-6 h-6 text-green-600" />
            Approved Shops ({approvedShops.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {approvedShops.map((shop) => (
              <Card key={shop.id} className="hover:shadow-elegant transition-all">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="line-clamp-1">{shop.shop_name}</span>
                    <Badge className="bg-green-600">Approved</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-2">{shop.city}</p>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => navigate(`/shop/${shop.id}`)}
                      variant="outline"
                      className="flex-1"
                    >
                      View Shop
                    </Button>
                    <Button
                      onClick={() => {
                        setShopToDelete(shop);
                        setActionType('delete');
                      }}
                      variant="destructive"
                      size="icon"
                      className="touch-manipulation active:scale-95 transition-transform"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Rejected Shops */}
        {rejectedShops.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <XCircle className="w-6 h-6 text-red-600" />
              Rejected Shops ({rejectedShops.length})
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {rejectedShops.map((shop) => (
                <Card key={shop.id}>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span className="line-clamp-1">{shop.shop_name}</span>
                      <Badge variant="destructive">Rejected</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-2">{shop.city}</p>
                    <Button
                      onClick={() => {
                        setShopToDelete(shop);
                        setActionType('delete');
                      }}
                      variant="destructive"
                      size="sm"
                      className="w-full touch-manipulation active:scale-95 transition-transform"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Approve Dialog */}
      <AlertDialog open={actionType === 'approve'} onOpenChange={() => setActionType(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Approve Shop</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to approve "{selectedShop?.shop_name}"? The shop will become visible on the platform and the owner will be able to add products.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSelectedShop(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleApprove} className="bg-green-600 hover:bg-green-700">
              Approve
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reject Dialog */}
      <AlertDialog open={actionType === 'reject'} onOpenChange={() => setActionType(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reject Shop</AlertDialogTitle>
            <AlertDialogDescription>
              Please provide a reason for rejecting "{selectedShop?.shop_name}". This will be visible to the shop owner.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="my-4">
            <Textarea
              placeholder="Enter rejection reason..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              rows={4}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setSelectedShop(null);
              setRejectionReason("");
            }}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleReject} className="bg-red-600 hover:bg-red-700">
              Reject
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Dialog */}
      <AlertDialog open={actionType === 'delete'} onOpenChange={() => setActionType(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Shop Permanently</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to permanently delete "{shopToDelete?.shop_name}"? This action cannot be undone and will remove all shop data including products.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShopToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteShop} className="bg-red-600 hover:bg-red-700">
              Delete Permanently
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminShops;
