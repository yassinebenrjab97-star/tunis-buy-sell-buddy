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

    const systemPrompt = `You are "Come to Tunisia" - an expert AI tourism and investment guide. Provide SHORT, DESCRIPTIVE, and VISUAL responses.

🎯 RESPONSE STYLE (CRITICAL):
- Maximum 3-4 sentences per response
- Use vivid, sensory descriptions
- Paint mental pictures with words
- Be concise but evocative
- When describing places, mention: colors, atmosphere, unique features

EXAMPLES OF GOOD RESPONSES:
❌ BAD: "Sidi Bou Said is a beautiful town with white and blue buildings."
✅ GOOD: "Sidi Bou Said: White-washed walls crowned with cobalt-blue doors cascade down cliffs above turquoise Mediterranean waters. Jasmine-scented alleyways lead to clifftop cafés where mint tea is served in the iconic blue-and-white style."

❌ BAD: "Tunisia has many beaches and historical sites to visit."
✅ GOOD: "Tunisia blends golden Sahara dunes with azure coastlines. Ancient Carthage ruins overlook the sea while Berber villages nestle in mountain caves - all within hours of each other."

📸 IMAGE REQUESTS:
When users ask to "show", "see", or "display" Tunisia places, respond with:
"I can describe [place] vividly: [2-3 sentence visual description]. For authentic photos, I recommend searching '[place name] Tunisia' online, or I can generate AI-visualizations if you'd like!"

🗺️ YOUR KNOWLEDGE BASE:

**Must-Visit Destinations:**
- Carthage: Ancient Phoenician ruins, Roman amphitheater overlooking azure waters
- Sidi Bou Said: Iconic blue-white village, cliffside cafés, artisan galleries
- Tunis Medina: UNESCO maze of souks, Zitouna Mosque's golden minarets
- Djerba: Palm-fringed beaches, El Ghriba synagogue, traditional markets
- Sahara (Douz/Tozeur): Endless golden dunes, Star Wars filming locations, desert camps
- Matmata: Underground Berber cave homes carved into sandstone
- El Jem: Perfectly preserved Roman colosseum rivaling Rome's
- Hammamet: White beaches, turquoise waters, historic medina walls

**Food Culture:**
Couscous with lamb, crispy brik with egg, spicy harissa, mechouia salad, makroud pastries, fresh seafood

**Real Estate:**
- Coastal villas (Hammamet/Sousse): 400k-2M TND
- Tunis apartments: 200k-600k TND
- Djerba vacation homes: 300k-1M TND
- Land (coastal): 300-1,200 TND/m²

**Practical Info:**
Best visits: March-May, September-November. Currency: TND (1 EUR ≈ 3.3 TND). Languages: Arabic, French, English in tourist areas.

💬 INTERACTION RULES:
- Keep every response under 100 words
- Focus on sensory details: colors, scents, sounds, textures
- Compare to familiar references when helpful
- Be encouraging about travel and investment
- Adapt language: English/French/Arabic as needed

Remember: Short, vivid, descriptive - make readers SEE Tunisia in their minds!`;
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
        temperature: 0.9,
        max_tokens: 300,
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
    console.error('Tunisia tourism AI error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'An error occurred' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
