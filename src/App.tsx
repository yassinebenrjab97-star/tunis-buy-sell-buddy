import React, { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import CreateListing from "./pages/CreateListing";
import ListingDetails from "./pages/ListingDetails";
import Profile from "./pages/Profile";
import TunisiaTourism from "./pages/TunisiaTourism";
import BiddingRoom from "./pages/BiddingRoom";
import BidArea from "./pages/BidArea";
import TrustedShops from "./pages/TrustedShops";
import ShopRegister from "./pages/ShopRegister";
import ShopDetails from "./pages/ShopDetails";
import AdminShops from "./pages/AdminShops";
import ShopProducts from "./pages/ShopProducts";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const AppContent = ({ children }: { children: React.ReactNode }) => {
  const { i18n } = useTranslation();
  
  useEffect(() => {
    document.documentElement.dir = i18n.language === 'ar' ? 'rtl' : 'ltr';
  }, [i18n.language]);
  
  return <>{children}</>;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <TooltipProvider>
        <AppContent>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/create" element={<CreateListing />} />
              <Route path="/listing/:id" element={<ListingDetails />} />
              <Route path="/bidding/:id" element={<BiddingRoom />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/profile/:userId" element={<Profile />} />
              <Route path="/tunisia-tourism" element={<TunisiaTourism />} />
              <Route path="/bid-area" element={<BidArea />} />
              <Route path="/trusted-shops" element={<TrustedShops />} />
              <Route path="/shop/register" element={<ShopRegister />} />
              <Route path="/shop/:id" element={<ShopDetails />} />
              <Route path="/admin/shops" element={<AdminShops />} />
              <Route path="/shop/products" element={<ShopProducts />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </AppContent>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
