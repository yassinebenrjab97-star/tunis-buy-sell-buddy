import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Eye, EyeOff, Mail, Lock, User } from "lucide-react";

interface AuthDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const AuthDialog = ({ open, onOpenChange }: AuthDialogProps) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [userRole, setUserRole] = useState<'buyer' | 'seller'>('buyer');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { toast } = useToast();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isForgotPassword) {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/`,
        });

        if (error) throw error;

        toast({
          title: "Email envoyé!",
          description: "Vérifiez votre boîte mail pour réinitialiser votre mot de passe.",
        });
        setIsForgotPassword(false);
        resetForm();
      } else if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
            data: {
              full_name: fullName,
              role: userRole,
            },
          },
        });

        if (error) throw error;

        toast({
          title: "Inscription réussie!",
          description: `Compte ${userRole === 'buyer' ? 'Acheteur' : 'Vendeur'} créé! Vous pouvez maintenant vous connecter.`,
        });
        
        setIsSignUp(false);
        setPassword("");
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;

        toast({
          title: "Connexion réussie!",
          description: "Bienvenue sur OneClick!",
        });
        onOpenChange(false);
        resetForm();
      }
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Une erreur s'est produite",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setEmail("");
    setPassword("");
    setFullName("");
    setUserRole('buyer');
    setShowPassword(false);
  };

  const toggleMode = () => {
    setIsSignUp(!isSignUp);
    setIsForgotPassword(false);
    resetForm();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center text-2xl font-bold bg-gradient-tunisia bg-clip-text text-transparent">
            {isForgotPassword ? "Mot de passe oublié" : (isSignUp ? "Créer un compte OneClick" : "Se connecter à OneClick")}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleAuth} className="space-y-6">
          {isSignUp && (
            <>
              <div className="space-y-2">
                <Label htmlFor="fullName">Nom complet</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    id="fullName"
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Votre nom complet"
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Type de compte</Label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setUserRole('buyer')}
                    className={`p-4 border-2 rounded-lg transition-all ${
                      userRole === 'buyer' 
                        ? 'border-[hsl(var(--tunisia-red))] bg-[hsl(var(--tunisia-red)/0.1)]' 
                        : 'border-border hover:border-[hsl(var(--tunisia-red)/0.5)]'
                    }`}
                  >
                    <div className="text-center">
                      <div className="text-2xl mb-2">🛒</div>
                      <div className="font-semibold">Acheteur</div>
                      <div className="text-xs text-muted-foreground mt-1">Rechercher et réserver</div>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setUserRole('seller')}
                    className={`p-4 border-2 rounded-lg transition-all ${
                      userRole === 'seller' 
                        ? 'border-[hsl(var(--tunisia-green))] bg-[hsl(var(--tunisia-green)/0.1)]' 
                        : 'border-border hover:border-[hsl(var(--tunisia-green)/0.5)]'
                    }`}
                  >
                    <div className="text-center">
                      <div className="text-2xl mb-2">💼</div>
                      <div className="font-semibold">Vendeur</div>
                      <div className="text-xs text-muted-foreground mt-1">Publier des annonces</div>
                    </div>
                  </button>
                </div>
                <p className="text-xs text-muted-foreground text-center">
                  💡 Vous pourrez changer de rôle à tout moment dans votre profil
                </p>
              </div>
            </>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="votre@email.com"
                className="pl-10"
                required
              />
            </div>
          </div>

          {!isForgotPassword && (
            <div className="space-y-2">
              <Label htmlFor="password">Mot de passe</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="pl-10 pr-10"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
          )}

          <Button
            type="submit"
            variant="tunisia"
            className="w-full"
            disabled={loading}
          >
            {loading ? "Chargement..." : (
              isForgotPassword ? "Envoyer le lien" : 
              isSignUp ? "Créer mon compte" : 
              "Se connecter"
            )}
          </Button>

          <div className="space-y-2 text-center">
            {!isForgotPassword && !isSignUp && (
              <button
                type="button"
                onClick={() => setIsForgotPassword(true)}
                className="text-sm text-muted-foreground hover:text-[hsl(var(--tunisia-red))] transition-colors block w-full"
              >
                Mot de passe oublié?
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                if (isForgotPassword) {
                  setIsForgotPassword(false);
                } else {
                  toggleMode();
                }
              }}
              className="text-sm text-[hsl(var(--tunisia-red))] hover:underline font-medium"
            >
              {isForgotPassword ? "← Retour à la connexion" :
               isSignUp ? "Déjà un compte ? Se connecter" : 
               "Pas de compte ? Créer un compte"}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AuthDialog;