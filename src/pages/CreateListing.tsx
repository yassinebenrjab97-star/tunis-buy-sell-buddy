import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { User } from "@supabase/supabase-js";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Upload, X, MapPin, Phone, Mail, FileText, DollarSign, Home, Settings, Check, Loader, Gavel } from "lucide-react";
import { tunisianGovernorates, tunisianCities, carBrands, propertyFeatures } from "@/data/tunisia";
import TunisiaMap from "@/components/map/TunisiaMap";

interface FormData {
  title: string;
  description: string;
  property_type: "car" | "building" | "land" | "";
  price: string;
  currency: string;
  location: string;
  city: string;
  condition: string;
  year_built: string;
  area: string;
  area_unit: string;
  features: string[];
  contact_phone: string;
  contact_email: string;
  lat: number | null;
  lng: number | null;
  brand?: string;
  bidding_enabled: boolean;
  starting_bid: string;
}

const CreateListing = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('edit');
  const { toast } = useToast();
  const navigate = useNavigate();

  const [formData, setFormData] = useState<FormData>({
    title: "",
    description: "",
    property_type: "",
    price: "",
    currency: "TND",
    location: "",
    city: "",
    condition: "",
    year_built: "",
    area: "",
    area_unit: "m²",
    features: [],
    contact_phone: "",
    contact_email: "",
    lat: null,
    lng: null,
    brand: "",
    bidding_enabled: false,
    starting_bid: ""
  });

  const [images, setImages] = useState<File[]>([]);

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (editId && user) {
      loadListing(editId);
    }
  }, [editId, user]);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      navigate('/');
      return;
    }

    setUser(session.user);
    setFormData(prev => ({ ...prev, contact_email: session.user.email || "" }));
  };

  const loadListing = async (id: string) => {
    try {
      const { data, error } = await supabase
        .from("listings")
        .select("*")
        .eq("id", id)
        .eq("user_id", user?.id)
        .single();

      if (error) throw error;

      setFormData({
        title: data.title,
        description: data.description || "",
        property_type: data.property_type,
        price: data.price.toString(),
        currency: data.currency,
        location: data.location,
        city: data.city,
        condition: data.condition || "",
        year_built: data.year_built?.toString() || "",
        area: data.area?.toString() || "",
        area_unit: data.area_unit || "m²",
        features: data.features ? Object.keys(data.features).filter(key => data.features[key]) : [],
        contact_phone: data.contact_phone || "",
        contact_email: data.contact_email || "",
        lat: data.lat || null,
        lng: data.lng || null,
        brand: (data.features && typeof data.features === 'object' && 'brand' in data.features) ? String(data.features.brand) : "",
        bidding_enabled: data.bidding_enabled || false,
        starting_bid: data.starting_bid?.toString() || ""
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de charger l'annonce",
        variant: "destructive",
      });
      navigate('/dashboard');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);

    try {
      // Validate required fields
      if (!formData.title || !formData.property_type || !formData.price || !formData.city) {
        throw new Error("Veuillez remplir tous les champs obligatoires");
      }

      // Validate that at least one image is provided (only for new listings)
      if (!editId && images.length === 0) {
        throw new Error("Veuillez ajouter au moins une photo de votre bien");
      }

      // Upload images to storage
      const imageUrls: string[] = [];
      for (const image of images) {
        const fileExt = image.name.split('.').pop();
        const fileName = `${user.id}/${Date.now()}-${Math.random()}.${fileExt}`;
        
        const { error: uploadError, data } = await supabase.storage
          .from('property-images')
          .upload(fileName, image);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('property-images')
          .getPublicUrl(fileName);

        imageUrls.push(publicUrl);
      }

      // Prepare features object
      const featuresObj: any = {};
      formData.features.forEach(feature => {
        featuresObj[feature] = true;
      });
      
      if (formData.brand) {
        featuresObj.brand = formData.brand;
      }

      const listingData = {
        title: formData.title,
        description: formData.description,
        property_type: formData.property_type,
        price: parseFloat(formData.price),
        currency: formData.currency,
        location: formData.location,
        city: formData.city,
        condition: formData.condition || null,
        year_built: formData.year_built ? parseInt(formData.year_built) : null,
        area: formData.area ? parseFloat(formData.area) : null,
        area_unit: formData.area_unit,
        features: featuresObj,
        contact_phone: formData.contact_phone,
        contact_email: formData.contact_email,
        lat: formData.lat,
        lng: formData.lng,
        user_id: user.id,
        bidding_enabled: formData.bidding_enabled,
        starting_bid: formData.bidding_enabled && formData.starting_bid ? parseFloat(formData.starting_bid) : null,
        images: imageUrls.length > 0 ? imageUrls : undefined,
      } as any;

      let result;
      if (editId) {
        // For updates, only include images if new ones were uploaded
        if (imageUrls.length === 0) {
          delete listingData.images;
        }
        result = await supabase
          .from("listings")
          .update(listingData)
          .eq("id", editId)
          .eq("user_id", user.id);
      } else {
        result = await supabase
          .from("listings")
          .insert([listingData]);
      }

      if (result.error) throw result.error;

      toast({
        title: "Succès",
        description: editId ? "Annonce modifiée avec succès" : "Annonce créée avec succès",
      });

      navigate('/dashboard');
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFeatureToggle = (feature: string) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features.includes(feature)
        ? prev.features.filter(f => f !== feature)
        : [...prev.features, feature]
    }));
  };

  const handleLocationSelect = (location: { lat: number; lng: number; address: string }) => {
    setFormData(prev => ({
      ...prev,
      lat: location.lat,
      lng: location.lng,
      location: location.address
    }));
    setShowMap(false);
    toast({
      title: "Localisation sélectionnée",
      description: location.address,
    });
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length + images.length > 10) {
      toast({
        title: "Limite atteinte",
        description: "Vous ne pouvez ajouter que 10 photos maximum",
        variant: "destructive",
      });
      return;
    }
    setImages(prev => [...prev, ...files]);
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const availableFeatures = formData.property_type ? propertyFeatures[formData.property_type as keyof typeof propertyFeatures] : [];

  return (
    <div className="min-h-screen bg-gradient-elegant">
      <Header 
        onAuthClick={() => {}} 
        onCreateListingClick={() => navigate('/create')}
        onAIClick={() => {}}
        onSearch={() => {}}
      />

      <div className="container mx-auto px-4 py-12">
        <div className="max-w-5xl mx-auto">
          <div className="mb-10 text-center">
            <div className="inline-flex items-center gap-2 px-5 py-2 bg-gradient-tunisia rounded-full mb-4 shadow-glow-tunisia">
              <FileText className="w-4 h-4 text-white" />
              <span className="text-white font-semibold text-sm">Publication d'Annonce</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-black mb-3 bg-gradient-tunisia bg-clip-text text-transparent">
              {editId ? "Modifier votre annonce" : "Créer une nouvelle annonce"}
            </h1>
            <p className="text-muted-foreground text-lg">
              Partagez votre bien avec des milliers d'acheteurs potentiels
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <Card className="border-border shadow-float hover:shadow-elegant transition-all duration-300">
              <CardHeader className="border-b border-border bg-gradient-warm">
                <CardTitle className="flex items-center gap-3 text-xl">
                  <div className="w-10 h-10 bg-gradient-tunisia rounded-lg flex items-center justify-center shadow-elegant">
                    <FileText className="w-5 h-5 text-white" />
                  </div>
                  Informations principales
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6 pt-6">
                <div>
                  <Label htmlFor="title" className="text-base font-semibold mb-2 flex items-center gap-2">
                    Titre de l'annonce <span className="text-[hsl(var(--tunisia-gold))]">*</span>
                  </Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Ex: Villa moderne avec piscine à Hammamet"
                    required
                    className="h-12 text-base border-border focus:border-[hsl(var(--tunisia-gold))] transition-colors"
                  />
                </div>

                <div>
                  <Label htmlFor="description" className="text-base font-semibold mb-2 block">Description détaillée</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Décrivez votre bien en détail : caractéristiques, équipements, avantages..."
                    rows={5}
                    className="text-base border-border focus:border-[hsl(var(--tunisia-gold))] transition-colors resize-none"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="property_type" className="text-base font-semibold mb-2 flex items-center gap-2">
                      Type de bien <span className="text-[hsl(var(--tunisia-gold))]">*</span>
                    </Label>
                    <Select
                      value={formData.property_type}
                      onValueChange={(value) => setFormData(prev => ({ 
                        ...prev, 
                        property_type: value as any,
                        features: []
                      }))}
                    >
                      <SelectTrigger className="h-12 text-base border-border bg-card">
                        <SelectValue placeholder="Sélectionnez le type" />
                      </SelectTrigger>
                      <SelectContent className="bg-popover border">
                        <SelectItem value="car">Voiture</SelectItem>
                        <SelectItem value="building">Immobilier</SelectItem>
                        <SelectItem value="land">Terrain</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="condition" className="text-base font-semibold mb-2 block">État</Label>
                    <Select
                      value={formData.condition}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, condition: value }))}
                    >
                      <SelectTrigger className="h-12 text-base border-border bg-card">
                        <SelectValue placeholder="Sélectionnez l'état" />
                      </SelectTrigger>
                      <SelectContent className="bg-popover border">
                        <SelectItem value="new">Neuf</SelectItem>
                        <SelectItem value="excellent">Excellent</SelectItem>
                        <SelectItem value="good">Bon</SelectItem>
                        <SelectItem value="fair">Correct</SelectItem>
                        <SelectItem value="needs_work">À rénover</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {formData.property_type === "car" && (
                  <div>
                    <Label htmlFor="brand" className="text-base font-semibold mb-2 block">Marque du véhicule</Label>
                    <Select
                      value={formData.brand}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, brand: value }))}
                    >
                      <SelectTrigger className="h-12 text-base border-border bg-card">
                        <SelectValue placeholder="Sélectionnez la marque" />
                      </SelectTrigger>
                      <SelectContent className="bg-popover border max-h-[300px]">
                        {carBrands.map(brand => (
                          <SelectItem key={brand} value={brand}>{brand}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Price and Details */}
            <Card className="border-border shadow-float hover:shadow-elegant transition-all duration-300">
              <CardHeader className="border-b border-border bg-gradient-warm">
                <CardTitle className="flex items-center gap-3 text-xl">
                  <div className="w-10 h-10 bg-gradient-tunisia rounded-lg flex items-center justify-center shadow-elegant">
                    <DollarSign className="w-5 h-5 text-white" />
                  </div>
                  Prix et caractéristiques
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6 pt-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="md:col-span-2">
                    <Label htmlFor="price" className="text-base font-semibold mb-2 flex items-center gap-2">
                      Prix <span className="text-[hsl(var(--tunisia-gold))]">*</span>
                    </Label>
                    <Input
                      id="price"
                      type="number"
                      value={formData.price}
                      onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                      placeholder="0"
                      required
                      className="h-12 text-base border-border focus:border-[hsl(var(--tunisia-gold))] transition-colors"
                    />
                  </div>

                  <div>
                    <Label htmlFor="currency" className="text-base font-semibold mb-2 block">Devise</Label>
                    <Select
                      value={formData.currency}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, currency: value }))}
                    >
                      <SelectTrigger className="h-12 text-base border-border bg-card">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-popover border">
                        <SelectItem value="TND">TND (Dinar)</SelectItem>
                        <SelectItem value="EUR">EUR (Euro)</SelectItem>
                        <SelectItem value="USD">USD (Dollar)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="year_built" className="text-base font-semibold mb-2 block">Année de construction/fabrication</Label>
                    <Input
                      id="year_built"
                      type="number"
                      value={formData.year_built}
                      onChange={(e) => setFormData(prev => ({ ...prev, year_built: e.target.value }))}
                      placeholder="2024"
                      min="1900"
                      max={new Date().getFullYear()}
                      className="h-12 text-base border-border focus:border-[hsl(var(--tunisia-gold))] transition-colors"
                    />
                  </div>

                  <div className="flex gap-3">
                    <div className="flex-1">
                      <Label htmlFor="area" className="text-base font-semibold mb-2 block">Surface/Kilométrage</Label>
                      <Input
                        id="area"
                        type="number"
                        value={formData.area}
                        onChange={(e) => setFormData(prev => ({ ...prev, area: e.target.value }))}
                        placeholder="100"
                        className="h-12 text-base border-border focus:border-[hsl(var(--tunisia-gold))] transition-colors"
                      />
                    </div>
                    <div>
                      <Label htmlFor="area_unit" className="text-base font-semibold mb-2 block">Unité</Label>
                      <Select
                        value={formData.area_unit}
                        onValueChange={(value) => setFormData(prev => ({ ...prev, area_unit: value }))}
                      >
                        <SelectTrigger className="w-24 h-12 text-base border-border bg-card">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-popover border">
                          <SelectItem value="m²">m²</SelectItem>
                          <SelectItem value="km">km</SelectItem>
                          <SelectItem value="ha">ha</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Bidding Options */}
            <Card className="border-border shadow-float hover:shadow-elegant transition-all duration-300 border-2 border-[hsl(var(--tunisia-gold))]/20">
              <CardHeader className="border-b border-border bg-gradient-tunisia/5">
                <CardTitle className="flex items-center gap-3 text-xl">
                  <div className="w-10 h-10 bg-gradient-tunisia rounded-lg flex items-center justify-center shadow-elegant">
                    <Gavel className="w-5 h-5 text-white" />
                  </div>
                  Options d'Enchères
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6 pt-6">
                <div className="flex items-center justify-between p-4 bg-accent/30 rounded-xl">
                  <div className="flex-1">
                    <Label htmlFor="bidding_enabled" className="text-base font-semibold mb-1 block cursor-pointer">
                      Activer les enchères
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Permettre aux acheteurs de faire des offres sécurisées
                    </p>
                  </div>
                  <Switch
                    id="bidding_enabled"
                    checked={formData.bidding_enabled}
                    onCheckedChange={(checked) => setFormData(prev => ({ 
                      ...prev, 
                      bidding_enabled: checked,
                      starting_bid: checked ? prev.starting_bid : ""
                    }))}
                    className="data-[state=checked]:bg-gradient-tunisia"
                  />
                </div>

                {formData.bidding_enabled && (
                  <div className="p-4 bg-gradient-tunisia/5 rounded-xl border-2 border-[hsl(var(--tunisia-gold))]/30">
                    <Label htmlFor="starting_bid" className="text-base font-semibold mb-2 flex items-center gap-2">
                      Prix de départ des enchères <span className="text-[hsl(var(--tunisia-gold))]">*</span>
                    </Label>
                    <Input
                      id="starting_bid"
                      type="number"
                      value={formData.starting_bid}
                      onChange={(e) => setFormData(prev => ({ ...prev, starting_bid: e.target.value }))}
                      placeholder="Montant minimum pour commencer les enchères"
                      required={formData.bidding_enabled}
                      className="h-12 text-base border-2 border-[hsl(var(--tunisia-gold))]/30 focus:border-[hsl(var(--tunisia-gold))] transition-colors bg-background"
                    />
                    <p className="text-sm text-muted-foreground mt-2">
                      Les acheteurs pourront faire des offres à partir de ce montant. Vous pourrez accepter l'offre qui vous convient.
                    </p>
                  </div>
                )}

                {!formData.bidding_enabled && (
                  <div className="text-center py-6 text-muted-foreground">
                    <Gavel className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p>Activez les enchères pour permettre aux acheteurs de faire des offres compétitives</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Location */}
            <Card className="border-border shadow-float hover:shadow-elegant transition-all duration-300">
              <CardHeader className="border-b border-border bg-gradient-warm">
                <CardTitle className="flex items-center gap-3 text-xl">
                  <div className="w-10 h-10 bg-gradient-tunisia rounded-lg flex items-center justify-center shadow-elegant">
                    <MapPin className="w-5 h-5 text-white" />
                  </div>
                  Localisation
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6 pt-6">
                <div>
                  <Label htmlFor="city" className="text-base font-semibold mb-2 flex items-center gap-2">
                    Gouvernorat <span className="text-[hsl(var(--tunisia-gold))]">*</span>
                  </Label>
                  <Select
                    value={formData.city}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, city: value }))}
                  >
                    <SelectTrigger className="h-12 text-base border-border bg-card">
                      <SelectValue placeholder="Sélectionnez le gouvernorat" />
                    </SelectTrigger>
                    <SelectContent className="bg-popover border max-h-[300px]">
                      {tunisianGovernorates.map(gov => (
                        <SelectItem key={gov.code} value={gov.name}>
                          {gov.name} ({gov.nameAr})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="location" className="text-base font-semibold mb-2 block">Adresse précise</Label>
                  <div className="flex gap-3">
                    <Input
                      id="location"
                      value={formData.location}
                      onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                      placeholder="Adresse, quartier, repères..."
                      className="flex-1 h-12 text-base border-border focus:border-[hsl(var(--tunisia-gold))] transition-colors"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowMap(true)}
                      className="h-12 px-6 border-border hover:bg-gradient-warm hover:border-[hsl(var(--tunisia-gold))]"
                    >
                      <MapPin className="w-4 h-4 mr-2" />
                      Carte
                    </Button>
                  </div>
                  {formData.lat && formData.lng && (
                    <div className="flex items-center gap-2 text-sm text-[hsl(var(--tunisia-gold))] mt-2 bg-gradient-warm px-3 py-2 rounded-lg border border-[hsl(var(--tunisia-gold)/0.3)]">
                      <Check className="w-4 h-4" />
                      <span className="font-medium">Localisation GPS définie</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Features */}
            {availableFeatures.length > 0 && (
              <Card className="border-border shadow-float hover:shadow-elegant transition-all duration-300">
                <CardHeader className="border-b border-border bg-gradient-warm">
                  <CardTitle className="flex items-center gap-3 text-xl">
                    <div className="w-10 h-10 bg-gradient-tunisia rounded-lg flex items-center justify-center shadow-elegant">
                      <Settings className="w-5 h-5 text-white" />
                    </div>
                    Caractéristiques et équipements
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {availableFeatures.map(feature => (
                      <div key={feature} className="flex items-center space-x-3 p-3 rounded-lg border border-border hover:bg-gradient-warm hover:border-[hsl(var(--tunisia-gold)/0.3)] transition-all duration-200">
                        <Checkbox
                          id={feature}
                          checked={formData.features.includes(feature)}
                          onCheckedChange={() => handleFeatureToggle(feature)}
                          className="border-border data-[state=checked]:bg-gradient-tunisia data-[state=checked]:border-transparent"
                        />
                        <Label htmlFor={feature} className="text-sm font-medium cursor-pointer flex-1">
                          {feature}
                        </Label>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Contact Information */}
            <Card className="border-border shadow-float hover:shadow-elegant transition-all duration-300">
              <CardHeader className="border-b border-border bg-gradient-warm">
                <CardTitle className="flex items-center gap-3 text-xl">
                  <div className="w-10 h-10 bg-gradient-tunisia rounded-lg flex items-center justify-center shadow-elegant">
                    <Phone className="w-5 h-5 text-white" />
                  </div>
                  Informations de contact
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6 pt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="contact_phone" className="text-base font-semibold mb-2 block">Téléphone</Label>
                    <div className="relative">
                      <Phone className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5" />
                      <Input
                        id="contact_phone"
                        value={formData.contact_phone}
                        onChange={(e) => setFormData(prev => ({ ...prev, contact_phone: e.target.value }))}
                        placeholder="+216 XX XXX XXX"
                        className="pl-12 h-12 text-base border-border focus:border-[hsl(var(--tunisia-gold))] transition-colors"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="contact_email" className="text-base font-semibold mb-2 block">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5" />
                      <Input
                        id="contact_email"
                        type="email"
                        value={formData.contact_email}
                        onChange={(e) => setFormData(prev => ({ ...prev, contact_email: e.target.value }))}
                        placeholder="votre@email.com"
                        className="pl-12 h-12 text-base border-border focus:border-[hsl(var(--tunisia-gold))] transition-colors"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Images Upload */}
            <Card className="border-border shadow-float hover:shadow-elegant transition-all duration-300 border-2 border-[hsl(var(--tunisia-red))]/20">
              <CardHeader className="border-b border-border bg-gradient-tunisia/5">
                <CardTitle className="flex items-center gap-3 text-xl">
                  <div className="w-10 h-10 bg-gradient-tunisia rounded-lg flex items-center justify-center shadow-elegant">
                    <Upload className="w-5 h-5 text-white" />
                  </div>
                  Photos du bien <span className="text-[hsl(var(--tunisia-red))]">*</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6 pt-6">
                <div className="text-center p-8 border-2 border-dashed border-[hsl(var(--tunisia-red))]/30 rounded-xl bg-gradient-tunisia/5 hover:bg-gradient-tunisia/10 transition-all duration-200">
                  <Upload className="w-12 h-12 mx-auto mb-4 text-[hsl(var(--tunisia-red))]" />
                  <Label htmlFor="images" className="cursor-pointer">
                    <span className="text-base font-semibold text-[hsl(var(--tunisia-red))]">
                      Cliquez pour ajouter des photos
                    </span>
                    <p className="text-sm text-muted-foreground mt-2">
                      JPG, PNG ou WEBP (max. 10 photos)
                    </p>
                  </Label>
                  <Input
                    id="images"
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </div>

                {images.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {images.map((image, index) => (
                      <div key={index} className="relative group aspect-square rounded-lg overflow-hidden border-2 border-border hover:border-[hsl(var(--tunisia-red))] transition-all duration-200">
                        <img
                          src={URL.createObjectURL(image)}
                          alt={`Preview ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          onClick={() => removeImage(index)}
                          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 p-0 shadow-lg"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                        {index === 0 && (
                          <div className="absolute bottom-2 left-2 bg-[hsl(var(--tunisia-gold))] text-white text-xs px-2 py-1 rounded font-semibold">
                            Photo principale
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {images.length === 0 && !editId && (
                  <div className="text-center py-4 text-[hsl(var(--tunisia-red))]">
                    <p className="font-medium">Au moins une photo est obligatoire</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Submit Button */}
            <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/dashboard')}
                disabled={loading}
                className="h-12 sm:h-14 px-6 sm:px-8 text-sm sm:text-base border-border hover:bg-muted order-2 sm:order-1"
              >
                Annuler
              </Button>
              <Button
                type="submit"
                disabled={loading}
                variant="tunisia"
                className="flex-1 h-12 sm:h-14 text-base sm:text-lg font-bold shadow-glow-tunisia order-1 sm:order-2"
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <Loader className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                    <span className="text-sm sm:text-base">Enregistrement...</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 sm:w-5 sm:h-5" />
                    <span className="text-sm sm:text-base">{editId ? "Modifier l'annonce" : "Publier l'annonce"}</span>
                  </div>
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>

      {/* Map Modal */}
      {showMap && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl w-full max-w-5xl h-[700px] flex flex-col shadow-2xl">
            <div className="flex justify-between items-center p-6 border-b border-border bg-gradient-warm">
              <h3 className="font-bold text-xl">Sélectionnez votre localisation</h3>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setShowMap(false)}
                className="hover:bg-muted"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
            <div className="flex-1">
              <TunisiaMap onLocationSelect={handleLocationSelect} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreateListing;