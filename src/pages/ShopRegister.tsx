import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Store, Upload, Loader } from "lucide-react";

const ShopRegister = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [existingShop, setExistingShop] = useState<any>(null);
  const [formData, setFormData] = useState({
    shop_name: "",
    shop_description: "",
    contact_email: "",
    contact_phone: "",
    address: "",
    city: "",
    website_url: "",
  });

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate('/');
      toast({
        title: "Authentication Required",
        description: "Please sign in to register your shop",
        variant: "destructive",
      });
      return;
    }
    setCurrentUser(session.user);
    checkExistingShop(session.user.id);
  };

  const checkExistingShop = async (userId: string) => {
    const { data } = await supabase
      .from('trusted_shops')
      .select('*')
      .eq('owner_id', userId)
      .single();

    if (data) {
      setExistingShop(data);
      setFormData({
        shop_name: data.shop_name || "",
        shop_description: data.shop_description || "",
        contact_email: data.contact_email || "",
        contact_phone: data.contact_phone || "",
        address: data.address || "",
        city: data.city || "",
        website_url: data.website_url || "",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    setLoading(true);
    try {
      if (existingShop && existingShop.status !== 'pending') {
        toast({
          title: "Shop Already Approved",
          description: "Your shop is already approved. Visit your dashboard to manage it.",
        });
        navigate('/shop/dashboard');
        return;
      }

      const shopData = {
        owner_id: currentUser.id,
        ...formData,
        status: 'pending' as const,
      };

      let newShopId = existingShop?.id;

      if (existingShop) {
        const { error } = await supabase
          .from('trusted_shops')
          .update(shopData)
          .eq('id', existingShop.id);

        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from('trusted_shops')
          .insert([shopData])
          .select()
          .single();

        if (error) throw error;
        newShopId = data?.id;
      }

      // Send admin notification
      if (newShopId) {
        await supabase.functions.invoke('notify-admin-shop', {
          body: {
            shop_name: formData.shop_name,
            shop_description: formData.shop_description,
            contact_email: formData.contact_email,
            contact_phone: formData.contact_phone,
            city: formData.city,
            address: formData.address,
            website_url: formData.website_url,
            owner_email: currentUser.email,
            shop_id: newShopId,
          },
        });
      }

      toast({
        title: "Success!",
        description: "Your shop registration has been submitted for approval. You'll be notified once reviewed.",
      });
      navigate('/');
    } catch (error: any) {
      console.error('Error registering shop:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to register shop",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header 
        onAuthClick={() => {}}
        onCreateListingClick={() => navigate('/create')}
        onAIClick={() => {}}
        onSearch={() => {}}
      />

      <div className="container mx-auto px-4 py-6 sm:py-8 md:py-12">
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-4 sm:mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        <Card className="max-w-3xl mx-auto shadow-elegant">
          <CardHeader className="p-4 sm:p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-tunisia rounded-xl flex items-center justify-center">
                <Store className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <CardTitle className="text-xl sm:text-2xl md:text-3xl">
                {existingShop ? 'Update Shop Registration' : 'Register Your Shop'}
              </CardTitle>
            </div>
            <p className="text-sm sm:text-base text-muted-foreground">
              Fill in the details below to register your shop. Your shop will be reviewed by our admin team before going live.
            </p>
          </CardHeader>

          <CardContent className="p-4 sm:p-6">
            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
              <div className="space-y-2">
                <Label htmlFor="shop_name">Shop Name *</Label>
                <Input
                  id="shop_name"
                  required
                  placeholder="Enter your shop name"
                  value={formData.shop_name}
                  onChange={(e) => setFormData({ ...formData, shop_name: e.target.value })}
                  className="h-11 sm:h-12"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="shop_description">Description</Label>
                <Textarea
                  id="shop_description"
                  placeholder="Tell us about your shop and what you offer"
                  value={formData.shop_description}
                  onChange={(e) => setFormData({ ...formData, shop_description: e.target.value })}
                  rows={4}
                  className="resize-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <div className="space-y-2">
                  <Label htmlFor="contact_email">Contact Email *</Label>
                  <Input
                    id="contact_email"
                    type="email"
                    required
                    placeholder="shop@example.com"
                    value={formData.contact_email}
                    onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                    className="h-11 sm:h-12"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contact_phone">Contact Phone</Label>
                  <Input
                    id="contact_phone"
                    type="tel"
                    placeholder="+216 XX XXX XXX"
                    value={formData.contact_phone}
                    onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                    className="h-11 sm:h-12"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <div className="space-y-2">
                  <Label htmlFor="city">City *</Label>
                  <Input
                    id="city"
                    required
                    placeholder="Tunis, Sfax, Sousse..."
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="h-11 sm:h-12"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <Input
                    id="address"
                    placeholder="Street address"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="h-11 sm:h-12"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="website_url">Website URL (optional)</Label>
                <Input
                  id="website_url"
                  type="url"
                  placeholder="https://yourshop.com"
                  value={formData.website_url}
                  onChange={(e) => setFormData({ ...formData, website_url: e.target.value })}
                  className="h-11 sm:h-12"
                />
              </div>

              <div className="pt-4 flex flex-col sm:flex-row gap-3">
                <Button
                  type="submit"
                  disabled={loading}
                  className="bg-gradient-tunisia hover:shadow-glow-tunisia w-full sm:flex-1 h-11 sm:h-12 text-base"
                >
                  {loading ? (
                    <>
                      <Loader className="w-5 h-5 mr-2 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Store className="w-5 h-5 mr-2" />
                      {existingShop ? 'Update Registration' : 'Submit for Approval'}
                    </>
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate(-1)}
                  className="w-full sm:w-auto h-11 sm:h-12"
                >
                  Cancel
                </Button>
              </div>

              <div className="bg-accent/50 rounded-xl p-3 sm:p-4 text-xs sm:text-sm text-muted-foreground">
                <p className="font-semibold mb-1">Important Notes:</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Your shop will be reviewed by admin (yessinebenrjabb@gmail.com)</li>
                  <li>You'll be notified via email once your shop is approved</li>
                  <li>You can only post products after approval</li>
                </ul>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ShopRegister;
