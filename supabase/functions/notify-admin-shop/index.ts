import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ShopNotification {
  shop_name: string;
  shop_description: string;
  contact_email: string;
  contact_phone: string;
  city: string;
  address: string;
  website_url: string;
  owner_email: string;
  shop_id: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { shop_name, shop_description, contact_email, contact_phone, city, address, website_url, owner_email, shop_id }: ShopNotification = await req.json();

    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #C1272D;">New Shop Registration - Requires Approval</h2>
        
        <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3>Shop Details:</h3>
          <p><strong>Shop Name:</strong> ${shop_name}</p>
          <p><strong>Description:</strong> ${shop_description || 'Not provided'}</p>
          <p><strong>City:</strong> ${city}</p>
          <p><strong>Address:</strong> ${address || 'Not provided'}</p>
          <p><strong>Contact Email:</strong> ${contact_email}</p>
          <p><strong>Contact Phone:</strong> ${contact_phone || 'Not provided'}</p>
          <p><strong>Website:</strong> ${website_url || 'Not provided'}</p>
          <p><strong>Owner Email:</strong> ${owner_email}</p>
        </div>

        <div style="margin: 30px 0;">
          <p>Please review this shop registration and take action:</p>
          <a href="https://gsafnaodslrpicfilbet.supabase.co/dashboard/project/gsafnaodslrpicfilbet" 
             style="background: #C1272D; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 10px 5px;">
            Review in Dashboard
          </a>
        </div>

        <p style="color: #666; font-size: 12px; margin-top: 30px;">
          This is an automated notification from your Tunisia Property Platform.
        </p>
      </div>
    `;

    if (!RESEND_API_KEY) {
      console.log("RESEND_API_KEY not set - Email notification skipped");
      return new Response(
        JSON.stringify({ success: true, message: "Notification skipped (no API key)" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Tunisia Platform <onboarding@resend.dev>",
        to: ["yessinebenrjabb@gmail.com"],
        subject: `New Shop Registration: ${shop_name}`,
        html: emailHtml,
      }),
    });

    if (!res.ok) {
      const error = await res.text();
      throw new Error(`Resend API error: ${error}`);
    }

    const data = await res.json();
    console.log("Email sent successfully:", data);

    return new Response(
      JSON.stringify({ success: true, message: "Admin notified successfully" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error sending notification:", error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
