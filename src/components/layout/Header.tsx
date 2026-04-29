import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Menu, User, Plus, MessageSquare, Palmtree, Home, ArrowLeft, Flag, Gavel, Store, Shield, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { User as SupabaseUser } from "@supabase/supabase-js";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { LanguageToggle } from "@/components/ui/language-toggle";
import { useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

interface HeaderProps {
  onAuthClick: () => void;
  onCreateListingClick: () => void;
  onAIClick: () => void;
  onSearch: (query: string) => void;
}

const Header = ({ onAuthClick, onCreateListingClick, onAIClick, onSearch }: HeaderProps) => {
  const { t } = useTranslation();
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const isHomePage = location.pathname === '/';

  useEffect(() => {
    const checkAdminStatus = async (userId: string) => {
      const { data } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .eq('role', 'admin')
        .single();
      
      setIsAdmin(!!data);
    };

    // Get current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        checkAdminStatus(session.user.id);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null);
        if (session?.user) {
          checkAdminStatus(session.user.id);
        } else {
          setIsAdmin(false);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast({
        title: "Error",
        description: "Failed to sign out",
        variant: "destructive",
      });
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(searchQuery);
  };

  return (
    <header className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-tunisia shadow-warm">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-tunisia rounded-xl flex items-center justify-center shadow-float hover-glow">
              <Flag className="text-white w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-gradient-tunisia tracking-tight">
                OneClick
              </h1>
              <p className="text-xs text-muted-foreground -mt-0.5">
                Your Tunisian Marketplace
              </p>
            </div>
          </div>

          {/* Search Bar */}
          <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-lg mx-8">
            <div className="relative w-full">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                type="text"
                placeholder={t('header.searchPlaceholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 pr-4 h-11 border-tunisia focus:shadow-glow-tunisia bg-background/50 backdrop-blur"
              />
            </div>
          </form>

          {/* Action Buttons */}
          <div className="flex items-center gap-1 sm:gap-2">
            {!isHomePage && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate(-1)}
                  className="hidden sm:flex h-9"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  {t('header.back')}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate('/')}
                  className="hidden sm:flex h-9"
                >
                  <Home className="w-4 h-4 mr-2" />
                  {t('header.home')}
                </Button>
              </>
            )}
            
            <LanguageToggle />
            <ThemeToggle />
            <NotificationBell />
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/tunisia-tourism')}
              className="hidden lg:flex border-[hsl(var(--tunisia-gold))] hover:bg-gradient-tunisia hover:text-white h-9"
            >
              <Palmtree className="w-4 h-4 mr-2" />
              {t('header.tourism')}
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/bid-area')}
              className="hidden lg:flex border-[hsl(var(--tunisia-red))] hover:bg-gradient-tunisia hover:text-white h-9"
            >
              <Gavel className="w-4 h-4 mr-2" />
              {t('header.bidArea')}
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/trusted-shops')}
              className="hidden lg:flex border-[hsl(var(--tunisia-gold))] hover:bg-gradient-tunisia hover:text-white h-9"
            >
              <Store className="w-4 h-4 mr-2" />
              {t('header.trustedShops')}
            </Button>

            {isAdmin && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/admin/shops')}
                className="hidden lg:flex border-[hsl(var(--tunisia-red))] hover:bg-gradient-tunisia hover:text-white h-9"
              >
                <Shield className="w-4 h-4 mr-2" />
                Admin
              </Button>
            )}
            
            <Button
              variant="tunisia"
              size="sm"
              onClick={onAIClick}
              className="hidden md:flex h-9"
            >
              <MessageSquare className="w-4 h-4 mr-1 sm:mr-2" />
              <span className="hidden lg:inline">{t('header.aiAssistant')}</span>
            </Button>

            {user ? (
              <>
                <Button
                  onClick={onCreateListingClick}
                  size="sm"
                  className="bg-gradient-tunisia hover:shadow-glow-tunisia text-white font-medium shadow-float hover-glow h-9 px-2 sm:px-4"
                >
                  <Plus className="w-4 h-4 sm:mr-2" />
                  <span className="hidden sm:inline">{t('header.createListing')}</span>
                </Button>
                
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={handleSignOut}
                  className="hover:bg-gradient-warm h-9 px-2 sm:px-4 whitespace-nowrap"
                >
                  <User className="w-4 h-4 sm:mr-2" />
                  <span className="hidden sm:inline truncate max-w-[100px]">{t('header.signOut')}</span>
                </Button>
              </>
            ) : (
              <Button
                onClick={onAuthClick}
                variant="outline"
                size="sm"
                className="border-tunisia hover:bg-gradient-warm hover:shadow-warm h-9 px-2 sm:px-4"
              >
                <User className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">{t('header.signIn')}</span>
                <span className="sm:hidden">{t('header.signIn')}</span>
              </Button>
            )}

            {/* Mobile Menu */}
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="sm" className="md:hidden h-9 px-2 touch-manipulation">
                  <Menu className="w-4 h-4" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-72 bg-card">
                <SheetHeader>
                  <SheetTitle className="text-left flex items-center gap-2">
                    <Flag className="w-5 h-5 text-[hsl(var(--tunisia-gold))]" />
                    OneClick Menu
                  </SheetTitle>
                </SheetHeader>
                <div className="flex flex-col gap-2 mt-6">
                  {!isHomePage && (
                    <>
                      <Button
                        variant="ghost"
                        className="justify-start h-12 touch-manipulation"
                        onClick={() => {
                          navigate(-1);
                          setMobileMenuOpen(false);
                        }}
                      >
                        <ArrowLeft className="w-5 h-5 mr-3" />
                        {t('header.back')}
                      </Button>
                      <Button
                        variant="ghost"
                        className="justify-start h-12 touch-manipulation"
                        onClick={() => {
                          navigate('/');
                          setMobileMenuOpen(false);
                        }}
                      >
                        <Home className="w-5 h-5 mr-3" />
                        {t('header.home')}
                      </Button>
                    </>
                  )}
                  
                  <Button
                    variant="ghost"
                    className="justify-start h-12 touch-manipulation"
                    onClick={() => {
                      onAIClick();
                      setMobileMenuOpen(false);
                    }}
                  >
                    <MessageSquare className="w-5 h-5 mr-3" />
                    {t('header.aiAssistant')}
                  </Button>

                  <Button
                    variant="ghost"
                    className="justify-start h-12 touch-manipulation"
                    onClick={() => {
                      navigate('/tunisia-tourism');
                      setMobileMenuOpen(false);
                    }}
                  >
                    <Palmtree className="w-5 h-5 mr-3" />
                    {t('header.tourism')}
                  </Button>

                  <Button
                    variant="ghost"
                    className="justify-start h-12 touch-manipulation"
                    onClick={() => {
                      navigate('/bid-area');
                      setMobileMenuOpen(false);
                    }}
                  >
                    <Gavel className="w-5 h-5 mr-3" />
                    {t('header.bidArea')}
                  </Button>

                  <Button
                    variant="ghost"
                    className="justify-start h-12 touch-manipulation"
                    onClick={() => {
                      navigate('/trusted-shops');
                      setMobileMenuOpen(false);
                    }}
                  >
                    <Store className="w-5 h-5 mr-3" />
                    {t('header.trustedShops')}
                  </Button>

                  {isAdmin && (
                    <Button
                      variant="ghost"
                      className="justify-start h-12 touch-manipulation border-t border-border mt-2"
                      onClick={() => {
                        navigate('/admin/shops');
                        setMobileMenuOpen(false);
                      }}
                    >
                      <Shield className="w-5 h-5 mr-3" />
                      Admin Panel
                    </Button>
                  )}

                  {user && (
                    <Button
                      variant="ghost"
                      className="justify-start h-12 touch-manipulation border-t border-border mt-2"
                      onClick={() => {
                        onCreateListingClick();
                        setMobileMenuOpen(false);
                      }}
                    >
                      <Plus className="w-5 h-5 mr-3" />
                      {t('header.createListing')}
                    </Button>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>

        {/* Mobile Search */}
        <form onSubmit={handleSearch} className="md:hidden pb-4 pt-2">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              type="text"
              placeholder={t('header.searchPlaceholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 pr-4 h-11 border-tunisia focus:shadow-glow-tunisia bg-gradient-warm"
            />
          </div>
        </form>
      </div>
    </header>
  );
};

export default Header;