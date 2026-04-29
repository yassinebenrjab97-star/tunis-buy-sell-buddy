import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { 
  ShieldCheck, CheckCircle, 
  AlertCircle, User, MapPin, Phone
} from "lucide-react";
import { tunisianGovernorates } from "@/data/tunisia";

interface VerificationFormProps {
  onVerificationComplete?: () => void;
}

const VerificationForm = ({ onVerificationComplete }: VerificationFormProps) => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState<any>(null);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    full_name: "",
    address: "",
    city: "",
    phone_number: "",
  });

  useEffect(() => {
    checkExistingVerification();
  }, []);

  const checkExistingVerification = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('user_verifications')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (data) {
        setVerificationStatus(data);
        if (data.verification_status === 'verified') {
          toast({
            title: "Déjà vérifié",
            description: "Votre demande a été approuvée!",
          });
          if (onVerificationComplete) {
            onVerificationComplete();
          }
        }
      }
    } catch (error) {
      console.log('No existing verification found');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (step === 1) {
      if (!formData.full_name || !formData.phone_number) {
        toast({
          title: "Champs requis",
          description: "Veuillez remplir tous les champs obligatoires",
          variant: "destructive",
        });
        return;
      }
      setStep(2);
      return;
    }

    if (step === 2) {
      if (!formData.address || !formData.city) {
        toast({
          title: "Champs requis",
          description: "Veuillez remplir tous les champs obligatoires",
          variant: "destructive",
        });
        return;
      }
      await submitVerification();
    }
  };

  const submitVerification = async () => {
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const verificationData = {
        user_id: user.id,
        full_name: formData.full_name,
        cin_number: "00000000", // Placeholder since we're removing CIN check
        cin_photo_url: "", // No longer required
        address: formData.address,
        city: formData.city,
        postal_code: null,
        phone_number: formData.phone_number,
        date_of_birth: null,
        verification_status: 'pending',
        verification_notes: null,
      };

      const { error: dbError } = await supabase
        .from('user_verifications')
        .upsert(verificationData);

      if (dbError) throw dbError;

      setVerificationStatus(verificationData);

      toast({
        title: "Demande envoyée!",
        description: "Le propriétaire va examiner votre demande",
      });

    } catch (error: any) {
      console.error('Verification error:', error);
      toast({
        title: "Erreur",
        description: error.message || "Une erreur est survenue",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (verificationStatus && verificationStatus.verification_status === 'verified') {
    return (
      <Card className="shadow-elegant border-2 border-green-500/20">
        <CardContent className="p-8 text-center">
          <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-12 h-12 text-white" />
          </div>
          <h3 className="text-2xl font-bold mb-2">Demande Approuvée!</h3>
          <p className="text-muted-foreground">
            Vous êtes autorisé à participer aux enchères
          </p>
        </CardContent>
      </Card>
    );
  }

  if (verificationStatus && verificationStatus.verification_status === 'pending') {
    return (
      <Card className="shadow-elegant border-2 border-yellow-500/20">
        <CardContent className="p-8 text-center">
          <div className="w-20 h-20 bg-yellow-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-12 h-12 text-white" />
          </div>
          <h3 className="text-2xl font-bold mb-2">En Attente d'Approbation</h3>
          <p className="text-muted-foreground mb-4">
            Le propriétaire de l'annonce va examiner votre demande
          </p>
          <Alert>
            <AlertDescription>
              Vos informations: {verificationStatus.full_name} - {verificationStatus.phone_number}
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  if (verificationStatus && verificationStatus.verification_status === 'rejected') {
    return (
      <Card className="shadow-elegant border-2 border-red-500/20">
        <CardContent className="p-8 text-center">
          <div className="w-20 h-20 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-12 h-12 text-white" />
          </div>
          <h3 className="text-2xl font-bold mb-2">Demande Refusée</h3>
          <p className="text-muted-foreground mb-4">
            Le propriétaire a refusé votre demande de participation
          </p>
          {verificationStatus.verification_notes && (
            <Alert>
              <AlertDescription>
                Raison: {verificationStatus.verification_notes}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-elegant border-2 border-[hsl(var(--tunisia-gold))]/20">
      <CardHeader className="border-b bg-gradient-tunisia/5">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-2xl flex items-center gap-3">
              <ShieldCheck className="w-8 h-8 text-[hsl(var(--tunisia-gold))]" />
              Demande de Participation
            </CardTitle>
            <CardDescription className="mt-2">
              Étape {step}/2 - Vos informations seront vérifiées par le vendeur
            </CardDescription>
          </div>
          <Badge variant="outline" className="text-lg px-4 py-2">
            {Math.round((step / 2) * 100)}%
          </Badge>
        </div>
        <Progress value={(step / 2) * 100} className="mt-4" />
      </CardHeader>

      <CardContent className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {step === 1 && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 p-4 bg-blue-50 dark:bg-blue-950/20 rounded-xl border border-blue-200 dark:border-blue-900">
                <User className="w-6 h-6 text-blue-600" />
                <div>
                  <h4 className="font-semibold">Informations Personnelles</h4>
                  <p className="text-sm text-muted-foreground">Le vendeur vérifiera vos informations</p>
                </div>
              </div>

              <div>
                <Label htmlFor="full_name" className="text-base font-semibold flex items-center gap-2">
                  Nom Complet <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="full_name"
                  value={formData.full_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
                  placeholder="Votre nom complet"
                  className="h-12 mt-2"
                  required
                />
              </div>

              <div>
                <Label htmlFor="phone_number" className="text-base font-semibold flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  Numéro de Téléphone <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="phone_number"
                  type="tel"
                  value={formData.phone_number}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone_number: e.target.value }))}
                  placeholder="+216 XX XXX XXX"
                  className="h-12 mt-2"
                  required
                />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-950/20 rounded-xl border border-green-200 dark:border-green-900">
                <MapPin className="w-6 h-6 text-green-600" />
                <div>
                  <h4 className="font-semibold">Adresse de Résidence</h4>
                  <p className="text-sm text-muted-foreground">Informations de contact</p>
                </div>
              </div>

              <div>
                <Label htmlFor="address" className="text-base font-semibold flex items-center gap-2">
                  Adresse <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                  placeholder="Votre adresse..."
                  className="mt-2 min-h-24"
                  required
                />
              </div>

              <div>
                <Label htmlFor="city" className="text-base font-semibold flex items-center gap-2">
                  Gouvernorat <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.city}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, city: value }))}
                >
                  <SelectTrigger className="h-12 mt-2">
                    <SelectValue placeholder="Sélectionnez" />
                  </SelectTrigger>
                  <SelectContent className="z-50 max-h-[300px] bg-popover">
                    {tunisianGovernorates.map(gov => (
                      <SelectItem key={gov.code} value={gov.name}>{gov.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          <div className="flex gap-4 pt-4">
            {step > 1 && (
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep(step - 1)}
                className="flex-1 h-12"
              >
                Retour
              </Button>
            )}
            <Button
              type="submit"
              variant="tunisia"
              className="flex-1 h-12"
              disabled={loading}
            >
              {loading ? "Envoi..." : step === 2 ? "Envoyer la Demande" : "Suivant"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default VerificationForm;
