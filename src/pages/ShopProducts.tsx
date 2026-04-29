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
import { Package, Plus, ArrowLeft, Loader, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Product {
  id: string;
  product_name: string;
  description: string;
  price: number;
  currency: string;
  in_stock: boolean;
  category: string;
}

const ShopProducts = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [shopId, setShopId] = useState<string | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    product_name: "",
    description: "",
    price: "",
    category: "",
  });

  useEffect(() => {
    checkShopAndLoadProducts();
  }, []);

  const checkShopAndLoadProducts = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to manage your shop",
        variant: "destructive",
      });
      navigate('/');
      return;
    }

    const { data: shop } = await supabase
      .from('trusted_shops')
      .select('id, status')
      .eq('owner_id', session.user.id)
      .single();

    if (!shop) {
      toast({
        title: "No Shop Found",
        description: "Please register your shop first",
        variant: "destructive",
      });
      navigate('/shop/register');
      return;
    }

    if (shop.status !== 'approved') {
      toast({
        title: "Shop Not Approved",
        description: "Your shop is pending approval. You'll be able to add products once approved.",
        variant: "destructive",
      });
      navigate('/');
      return;
    }

    setShopId(shop.id);
    loadProducts(shop.id);
  };

  const loadProducts = async (shopId: string) => {
    try {
      const { data, error } = await supabase
        .from('shop_products')
        .select('*')
        .eq('shop_id', shopId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error loading products:', error);
      toast({
        title: "Error",
        description: "Failed to load products",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shopId) return;

    try {
      const { error } = await supabase
        .from('shop_products')
        .insert([{
          shop_id: shopId,
          product_name: formData.product_name,
          description: formData.description,
          price: parseFloat(formData.price),
          category: formData.category,
          currency: 'TND',
          in_stock: true,
        }]);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Product added successfully",
      });

      setFormData({ product_name: "", description: "", price: "", category: "" });
      setShowForm(false);
      loadProducts(shopId);
    } catch (error: any) {
      console.error('Error adding product:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to add product",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (productId: string) => {
    try {
      const { error } = await supabase
        .from('shop_products')
        .delete()
        .eq('id', productId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Product deleted successfully",
      });

      if (shopId) loadProducts(shopId);
    } catch (error) {
      console.error('Error deleting product:', error);
      toast({
        title: "Error",
        description: "Failed to delete product",
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

      <div className="container mx-auto px-4 py-12">
        <Button variant="ghost" onClick={() => navigate('/')} className="mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2">My Products</h1>
            <p className="text-muted-foreground">Manage your shop's product catalog</p>
          </div>
          <Button onClick={() => setShowForm(!showForm)} className="bg-gradient-tunisia">
            <Plus className="w-4 h-4 mr-2" />
            Add Product
          </Button>
        </div>

        {showForm && (
          <Card className="mb-8 shadow-elegant">
            <CardHeader>
              <CardTitle>Add New Product</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="product_name">Product Name *</Label>
                  <Input
                    id="product_name"
                    required
                    value={formData.product_name}
                    onChange={(e) => setFormData({ ...formData, product_name: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    rows={3}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="price">Price (TND) *</Label>
                    <Input
                      id="price"
                      type="number"
                      step="0.01"
                      required
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="category">Category</Label>
                    <Input
                      id="category"
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    />
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button type="submit" className="bg-gradient-tunisia">
                    <Package className="w-4 h-4 mr-2" />
                    Add Product
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {products.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Package className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-2xl font-bold mb-2">No Products Yet</h3>
              <p className="text-muted-foreground mb-6">Start by adding your first product</p>
              <Button onClick={() => setShowForm(true)} className="bg-gradient-tunisia">
                <Plus className="w-4 h-4 mr-2" />
                Add Product
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((product) => (
              <Card key={product.id} className="hover:shadow-elegant transition-all">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="text-xl font-bold line-clamp-1">{product.product_name}</h3>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleDelete(product.id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                  
                  {product.description && (
                    <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                      {product.description}
                    </p>
                  )}

                  <div className="flex items-center justify-between">
                    <div className="text-2xl font-bold text-[hsl(var(--tunisia-gold))]">
                      {product.price.toLocaleString()} {product.currency}
                    </div>
                    {product.in_stock && (
                      <Badge variant="outline" className="border-green-600 text-green-600">
                        In Stock
                      </Badge>
                    )}
                  </div>

                  {product.category && (
                    <Badge className="mt-3">{product.category}</Badge>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ShopProducts;
