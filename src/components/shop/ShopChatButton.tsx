import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { MessageCircle } from "lucide-react";
import ShopChatDialog from "./ShopChatDialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useTranslation } from "react-i18next";

interface ShopChatButtonProps {
  shopId: string;
  shopName: string;
}

const ShopChatButton: React.FC<ShopChatButtonProps> = ({ shopId, shopName }) => {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const { t } = useTranslation();

  const handleClick = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to contact this shop",
        variant: "destructive",
      });
      return;
    }

    setOpen(true);
  };

  return (
    <>
      <Button
        onClick={handleClick}
        className="bg-gradient-tunisia w-full touch-manipulation active:scale-95 transition-transform"
        size="lg"
        type="button"
      >
        <MessageCircle className="w-5 h-5 mr-2" />
        {t('trustedShops.contactShop')}
      </Button>
      
      <ShopChatDialog
        open={open}
        onOpenChange={setOpen}
        shopId={shopId}
        shopName={shopName}
      />
    </>
  );
};

export default ShopChatButton;
