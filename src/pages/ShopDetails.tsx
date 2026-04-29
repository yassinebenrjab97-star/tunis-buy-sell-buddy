import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useTranslation } from "react-i18next";
import Header from "@/components/layout/Header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft, Store, Phone, Mail, MapPin, Globe,
  ShieldCheck, Package, Loader
} from "lucide-react";

interface Shop {
  id: string;
  shop_name: string;
  shop_description: string;
  logo_url: string;
  cover_image_url: string;
  contact_email: string;
  contact_phone: string;
  address: string;
  city: string;
  website_url: string;
  created_at: string;
}

interface Product {
  id: string;
  product_name: string;
  description: string;
  price: number;
  currency: string;
  images: string[];
  category: string;
  in_stock: boolean;
}

const ShopDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useTranslation();
  const [shop, setShop] = useState<Shop | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      loadShopData();
    }
  }, [id]);

  const loadShopData = async () => {
    try {
      const [shopRes, productsRes] = await Promise.all([
        supabase
          .from('trusted_shops')
          .select('*')
          .eq('id', id)
          .eq('status', 'approved')
          .single(),
        supabase
          .from('shop_products')
          .select('*')
          .eq('shop_id', id)
          .eq('in_stock', true)
          .order('created_at', { ascending: false })
      ]);

      if (shopRes.error) throw shopRes.error;
      if (!shopRes.data) {
        toast({
          title: "Shop Not Found",
          description: "This shop doesn't exist or hasn't been approved yet",
          variant: "destructive",
        });
        navigate('/trusted-shops');
        return;
      }

      setShop(shopRes.data);
      setProducts(productsRes.data || []);
    } catch (error) {
      console.error('Error loading shop:', error);
      toast({
        title: "Error",
        description: "Failed to load shop details",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
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
          <p className="text-muted-foreground mt-4">Loading shop...</p>
        </div>
      </div>
    );
  }

  if (!shop) {
    return (
      <div className="min-h-screen bg-background">
        <Header 
          onAuthClick={() => {}}
          onCreateListingClick={() => navigate('/create')}
          onAIClick={() => {}}
          onSearch={() => {}}
        />
        <div className="container mx-auto px-4 py-20 text-center">
          <Store className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-2xl font-bold mb-2">Shop Not Found</h2>
          <Button onClick={() => navigate('/trusted-shops')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Shops
          </Button>
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

      {/* Cover Image */}
      <div className="relative h-48 sm:h-64 md:h-80 bg-gradient-warm overflow-hidden">
        {shop.cover_image_url ? (
          <img
            src={shop.cover_image_url}
            alt={shop.shop_name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Store className="w-20 h-20 sm:w-32 sm:h-32 text-white/30" />
          </div>
        )}
      </div>

      <div className="container mx-auto px-4">
        {/* Shop Header */}
        <div className="relative -mt-16 sm:-mt-20 mb-8 sm:mb-12">
          <Card className="shadow-elegant">
            <CardContent className="p-4 sm:p-6 md:p-8">
              <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
                <div className="w-24 h-24 sm:w-32 sm:h-32 bg-white rounded-2xl shadow-elegant flex-shrink-0 flex items-center justify-center overflow-hidden mx-auto sm:mx-0">
                  {shop.logo_url ? (
                    <img
                      src={shop.logo_url}
                      alt={shop.shop_name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Store className="w-12 h-12 sm:w-16 sm:h-16 text-[hsl(var(--tunisia-gold))]" />
                  )}
                </div>

                  <div className="flex-1 text-center sm:text-left">
                  <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-3 mb-3">
                    <div>
                      <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2">{shop.shop_name}</h1>
                      <Badge className="bg-gradient-tunisia">
                        <ShieldCheck className="w-3 h-3 mr-1" />
                        {t('trustedShops.verified')}
                      </Badge>
                    </div>
                    <Button
                      variant="ghost"
                      onClick={() => navigate('/trusted-shops')}
                      className="w-full sm:w-auto"
                    >
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      {t('trustedShops.allShops')}
                    </Button>
                  </div>
                  

                  {shop.shop_description && (
                    <p className="text-base sm:text-lg text-muted-foreground mb-4">
                      {shop.shop_description}
                    </p>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
                    {shop.city && (
                      <div className="flex items-center justify-center sm:justify-start gap-2">
                        <MapPin className="w-4 h-4 text-[hsl(var(--tunisia-gold))]" />
                        <span>{shop.city}</span>
                      </div>
                    )}
                    {shop.contact_phone && (
                      <a
                        href={`tel:${shop.contact_phone}`}
                        className="flex items-center justify-center sm:justify-start gap-2 hover:text-[hsl(var(--tunisia-red))] transition-colors"
                      >
                        <Phone className="w-4 h-4 text-[hsl(var(--tunisia-gold))]" />
                        <span>{shop.contact_phone}</span>
                      </a>
                    )}
                    {shop.contact_email && (
                      <a
                        href={`mailto:${shop.contact_email}`}
                        className="flex items-center justify-center sm:justify-start gap-2 hover:text-[hsl(var(--tunisia-red))] transition-colors"
                      >
                        <Mail className="w-4 h-4 text-[hsl(var(--tunisia-gold))]" />
                        <span className="truncate">{shop.contact_email}</span>
                      </a>
                    )}
                    {shop.website_url && (
                      <a
                        href={shop.website_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center sm:justify-start gap-2 hover:text-[hsl(var(--tunisia-red))] transition-colors"
                      >
                        <Globe className="w-4 h-4 text-[hsl(var(--tunisia-gold))]" />
                        <span>Visit Website</span>
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Products Section */}
        <div className="pb-12 sm:pb-20">
          <div className="mb-6 sm:mb-8">
            <h2 className="text-2xl sm:text-3xl font-bold mb-2">{t('trustedShops.products')}</h2>
            <p className="text-muted-foreground">Browse all available products from this shop</p>
          </div>

          {products.length === 0 ? (
            <Card>
              <CardContent className="p-8 sm:p-12 text-center">
                <Package className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-xl sm:text-2xl font-bold mb-2">{t('trustedShops.noProducts')}</h3>
                <p className="text-muted-foreground">
                  {t('trustedShops.noProductsDesc')}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
              {products.map((product) => (
                <Card key={product.id} className="group hover:shadow-elegant transition-all overflow-hidden">
                  <div className="relative h-40 sm:h-48 bg-accent overflow-hidden">
                    {product.images && product.images.length > 0 ? (
                      <img
                        src={product.images[0]}
                        alt={product.product_name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="w-16 h-16 text-muted-foreground" />
                      </div>
                    )}
                    {product.category && (
                      <Badge className="absolute top-3 right-3 bg-white/90 backdrop-blur text-[hsl(var(--tunisia-gold))]">
                        {product.category}
                      </Badge>
                    )}
                  </div>
                  
                  <CardContent className="p-4 sm:p-5">
                    <h3 className="text-base sm:text-lg font-bold mb-2 line-clamp-1">
                      {product.product_name}
                    </h3>
                    
                    {product.description && (
                      <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                        {product.description}
                      </p>
                    )}
                    
                    <div className="flex items-center justify-between">
                      <div className="text-xl sm:text-2xl font-bold text-[hsl(var(--tunisia-gold))]">
                        {product.price.toLocaleString()} {product.currency}
                      </div>
                      <Badge variant="outline" className="border-green-600 text-green-600">
                        {t('trustedShops.inStock')}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ShopDetails;
