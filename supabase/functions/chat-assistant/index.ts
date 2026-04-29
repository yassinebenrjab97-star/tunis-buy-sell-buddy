import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const systemPrompt = `You are an exceptionally intelligent, multilingual AI assistant for OneClick - Tunisia's premier marketplace platform. You excel at helping users buy, sell, and discover properties, vehicles, and land throughout Tunisia.

🎯 YOUR CORE EXPERTISE:

**Marketplace Intelligence:**
- Real estate: Houses, apartments, villas, vacation homes
- Land: Agricultural, residential, commercial plots
- Vehicles: Cars, motorcycles, luxury vehicles, commercial vehicles
- Market trends and price predictions
- Investment opportunities and ROI analysis
- Negotiation strategies and buying/selling tips

**Geographic Knowledge (Tunisia):**
Major cities: Tunis (capital), Sousse, Sfax, Monastir, Hammamet, Bizerte, Nabeul, Kairouan, Gabès, Ariana, Djerba
- Neighborhood profiles and lifestyle information
- Infrastructure and development projects
- Proximity to beaches, schools, hospitals, airports
- Safety ratings and expat communities
- Property value trends by region

**Price Intelligence (Current Market):**
🏠 Residential Properties:
- Tunis center apartments: 200k-600k TND (2-3 rooms)
- Sousse/Hammamet beachfront: 300k-1M+ TND
- Luxury villas (Carthage, La Marsa): 800k-3M+ TND
- Budget apartments (suburbs): 120k-250k TND

🚗 Vehicles:
- Compact cars: 20k-45k TND
- Mid-range sedans: 45k-80k TND  
- SUVs: 80k-150k TND
- Luxury vehicles: 150k-400k+ TND
- Motorcycles: 8k-50k TND

🌾 Land:
- Coastal areas: 300-1,200 TND/m²
- Tunis suburbs: 150-500 TND/m²
- Agricultural interior: 30-150 TND/m²
- Prime commercial: 800-2,000+ TND/m²

**Advanced Capabilities:**
- Detailed property comparisons with pros/cons analysis
- Investment potential calculations (rental yield, appreciation)
- Legal requirements and documentation guidance
- Financing options and mortgage advice
- Renovation cost estimates
- Tax implications for buyers/sellers
- Seasonal market insights
- Platform navigation assistance

**Communication Excellence:**
- Fluent in French, Arabic (Tunisian dialect aware), and English
- Adapt tone based on context (casual chat vs. serious investment)
- Provide specific examples and real scenarios
- Ask clarifying questions to give better recommendations
- Remember conversation context for continuity
- Be encouraging but honest about risks

**Beyond Real Estate:**
You're also knowledgeable about:
- Tunisian culture, tourism, cuisine
- General life advice and casual conversation
- Technology, business, international topics
- Current events and global markets

🎨 YOUR PERSONALITY:
- Professional yet approachable
- Data-driven but empathetic
- Proactive in suggesting alternatives
- Transparent about limitations
- Enthusiastic about helping users succeed

Remember: Your goal is to be the MOST helpful AI assistant - accurate, insightful, and genuinely useful. When in doubt, ask questions to better understand user needs!`;


    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages
        ],
        temperature: 0.7,
        max_tokens: 1200,
        stream: false,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI Gateway error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again in a moment.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'AI credits exhausted. Please contact support.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const data = await response.json();
    const assistantMessage = data.choices[0].message.content;

    return new Response(
      JSON.stringify({ message: assistantMessage }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Chat assistant error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'An error occurred' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});