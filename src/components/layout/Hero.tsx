import React from "react";
import { Button } from "@/components/ui/button";
import { Car, Building, MapPin, Star, Sparkles, Users, Zap, Flag, TrendingUp } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

interface HeroProps {
  onCategoryClick: (category: string) => void;
}

const Hero = ({ onCategoryClick }: HeroProps) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  
  return (
    <section className="relative py-16 sm:py-24 md:py-32 px-4 overflow-hidden bg-gradient-hero">
      {/* Background Pattern */}
      <div className="absolute inset-0 pattern-tunisia opacity-20" />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background/30" />
      
      {/* Enhanced Decorative Elements */}
      <div className="absolute top-10 left-10 w-64 h-64 bg-[hsl(var(--tunisia-gold))] rounded-full blur-3xl opacity-20 animate-pulse" />
      <div className="absolute bottom-10 right-10 w-80 h-80 bg-[hsl(var(--tunisia-gold-bright))] rounded-full blur-3xl opacity-20 animate-pulse" style={{animationDelay: '1s'}} />
      
      <div className="container mx-auto text-center relative z-10 max-w-6xl">
        <div className="mb-8">
          <span className="inline-flex items-center gap-2 px-6 py-3 bg-white/10 backdrop-blur-sm text-white rounded-full text-sm font-semibold shadow-xl border border-white/20 mb-6">
            <Flag className="w-4 h-4 text-[hsl(var(--tunisia-gold))]" />
            <span>Plateforme 100% Tunisienne</span>
          </span>
        </div>
        
        <h1 className="text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-black mb-8 md:mb-12 leading-[1.1] tracking-tight px-4">
          <span className="block text-white drop-shadow-2xl">
            Achetez et Vendez
          </span>
          <span className="block mt-2">
            <span className="text-[hsl(var(--tunisia-gold))] drop-shadow-2xl inline-block">
              en OneClick
            </span>
          </span>
        </h1>
        
        <div className="flex flex-wrap justify-center gap-6 mb-10 text-white/90 text-sm font-medium">
          <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full border border-white/20">
            <Sparkles className="w-4 h-4 text-[hsl(var(--tunisia-gold))]" />
            Assistant IA Multilingue
          </div>
          <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full border border-white/20">
            <TrendingUp className="w-4 h-4 text-[hsl(var(--tunisia-gold))]" />
            Recherche Intelligente
          </div>
          <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full border border-white/20">
            <Star className="w-4 h-4 text-[hsl(var(--tunisia-gold))]" />
            Sécurisé & Rapide
          </div>
          <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full border border-white/20">
            <Users className="w-4 h-4 text-[hsl(var(--tunisia-gold))]" />
            Support 24/7
          </div>
        </div>

        {/* Quick Category Actions */}
        <div className="flex flex-col sm:flex-row flex-wrap justify-center gap-4 sm:gap-5 mb-8 sm:mb-12 px-4">
          <Button
            onClick={() => onCategoryClick("car")}
            size="lg"
            className="group bg-white/15 backdrop-blur-sm hover:bg-white/25 text-white border-2 border-white/30 hover:border-white/50 transition-all duration-300 h-14 sm:h-16 px-6 sm:px-8 shadow-2xl w-full sm:w-auto"
          >
            <Car className="w-6 sm:w-7 h-6 sm:h-7 mr-3 group-hover:scale-110 transition-transform text-[hsl(var(--tunisia-gold))]" />
            <div className="text-left">
              <div className="font-bold text-sm sm:text-base">{t('hero.cars')}</div>
              <div className="text-xs opacity-80">{t('hero.subtitle')}</div>
            </div>
          </Button>
          
          <Button
            onClick={() => onCategoryClick("building")}
            size="lg"
            className="group bg-white/15 backdrop-blur-sm hover:bg-white/25 text-white border-2 border-white/30 hover:border-white/50 transition-all duration-300 h-14 sm:h-16 px-6 sm:px-8 shadow-2xl w-full sm:w-auto"
          >
            <Building className="w-6 sm:w-7 h-6 sm:h-7 mr-3 group-hover:scale-110 transition-transform text-[hsl(var(--tunisia-gold))]" />
            <div className="text-left">
              <div className="font-bold text-sm sm:text-base">{t('hero.buildings')}</div>
              <div className="text-xs opacity-80">{t('hero.subtitle')}</div>
            </div>
          </Button>
          
          <Button
            onClick={() => onCategoryClick("land")}
            size="lg"
            className="group bg-white/15 backdrop-blur-sm hover:bg-white/25 text-white border-2 border-white/30 hover:border-white/50 transition-all duration-300 h-14 sm:h-16 px-6 sm:px-8 shadow-2xl w-full sm:w-auto"
          >
            <MapPin className="w-6 sm:w-7 h-6 sm:h-7 mr-3 group-hover:scale-110 transition-transform text-[hsl(var(--tunisia-gold))]" />
            <div className="text-left">
              <div className="font-bold text-sm sm:text-base">{t('hero.land')}</div>
              <div className="text-xs opacity-80">{t('hero.subtitle')}</div>
            </div>
          </Button>
        </div>

        {/* Main CTAs */}
        <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center items-center px-4 w-full max-w-2xl mx-auto">
          <Button
            size="lg"
            onClick={() => {
              const listingsSection = document.querySelector('#listings-section');
              if (listingsSection) {
                listingsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }
            }}
            className="bg-white text-[hsl(var(--tunisia-dark))] hover:bg-white/90 px-8 sm:px-12 py-5 sm:py-6 text-base sm:text-xl font-bold shadow-2xl hover:scale-105 transition-all duration-300 group w-full sm:w-auto"
          >
            <Zap className="w-5 sm:w-6 h-5 sm:h-6 mr-2 sm:mr-3 group-hover:rotate-12 group-hover:text-[hsl(var(--tunisia-gold))] transition-all" />
            Explorer les Annonces
          </Button>
          
          <Button
            size="lg"
            onClick={() => navigate('/create')}
            className="bg-[hsl(var(--tunisia-gold))] hover:bg-[hsl(var(--tunisia-gold-bright))] text-[hsl(var(--tunisia-dark))] border-2 border-white/30 px-8 sm:px-12 py-5 sm:py-6 text-base sm:text-xl font-bold shadow-2xl hover:scale-105 transition-all duration-300 group w-full sm:w-auto"
          >
            <TrendingUp className="w-5 sm:w-6 h-5 sm:h-6 mr-2 sm:mr-3 group-hover:scale-110 transition-transform" />
            Publier une Annonce
          </Button>
        </div>
        
      </div>
    </section>
  );
};

export default Hero;