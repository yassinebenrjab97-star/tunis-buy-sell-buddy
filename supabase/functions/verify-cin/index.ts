import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { cinImageUrl, enteredCinNumber } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    console.log('Starting CIN verification for:', enteredCinNumber);

    // Use Lovable AI with vision to extract CIN number from image
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: `You are a CIN (Carte d'Identité Nationale - Tunisian ID card) number extraction expert. 
            
Your task:
1. Look at the ID card image
2. Find the CIN number (8 digits)
3. Extract ONLY the 8-digit number, nothing else
4. Return in this EXACT format: {"cin_number": "12345678", "confidence": "high/medium/low", "notes": "any observations"}

Important:
- Tunisian CIN numbers are always 8 digits
- Look for numbers near text like "CIN" or "N°"
- If unclear or multiple numbers, pick the most likely CIN
- If you cannot find it, return {"cin_number": "NOT_FOUND", "confidence": "none", "notes": "explain why"}`
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Extract the CIN number from this Tunisian ID card image. Return only valid JSON.'
              },
              {
                type: 'image_url',
                image_url: {
                  url: cinImageUrl
                }
              }
            ]
          }
        ],
        temperature: 0.1, // Low temperature for consistent extraction
        max_tokens: 200,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI Gateway error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ 
            verified: false,
            error: 'Trop de demandes. Veuillez réessayer dans un moment.',
            needsManualReview: true 
          }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ 
            verified: false,
            error: 'Crédits AI épuisés. Contactez le support.',
            needsManualReview: true 
          }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const data = await response.json();
    const aiMessage = data.choices[0].message.content;
    
    console.log('AI Response:', aiMessage);

    // Parse the JSON response from AI
    let extractedData;
    try {
      // Try to extract JSON from the response
      const jsonMatch = aiMessage.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        extractedData = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in AI response');
      }
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      return new Response(
        JSON.stringify({ 
          verified: false,
          error: 'Impossible de lire le CIN depuis l\'image. Assurez-vous que l\'image est claire.',
          needsManualReview: true,
          details: 'AI response parsing failed'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const extractedCin = extractedData.cin_number;
    const confidence = extractedData.confidence;
    const notes = extractedData.notes;

    console.log('Extracted CIN:', extractedCin);
    console.log('Confidence:', confidence);
    console.log('Entered CIN:', enteredCinNumber);

    // Validate the CIN format
    const cinPattern = /^\d{8}$/;
    if (!cinPattern.test(enteredCinNumber)) {
      return new Response(
        JSON.stringify({ 
          verified: false,
          error: 'Le numéro CIN doit contenir exactement 8 chiffres.',
          needsManualReview: false
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if CIN was found in image
    if (extractedCin === 'NOT_FOUND') {
      return new Response(
        JSON.stringify({ 
          verified: false,
          error: 'Aucun numéro CIN trouvé dans l\'image. Veuillez télécharger une photo claire de votre CIN.',
          needsManualReview: true,
          details: notes
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Compare extracted CIN with entered CIN
    const isMatch = extractedCin === enteredCinNumber;
    const needsReview = confidence === 'low' || !isMatch;

    console.log('Match result:', isMatch);
    console.log('Needs review:', needsReview);

    return new Response(
      JSON.stringify({ 
        verified: isMatch && confidence !== 'low',
        extractedCin,
        confidence,
        notes,
        needsManualReview: needsReview,
        message: isMatch 
          ? (confidence === 'high' 
              ? 'Vérification réussie! Votre CIN correspond à l\'image.' 
              : 'CIN correspond mais nécessite une vérification manuelle.')
          : 'Le numéro CIN ne correspond pas à celui de l\'image. Veuillez vérifier.'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('CIN verification error:', error);
    return new Response(
      JSON.stringify({ 
        verified: false,
        error: error instanceof Error ? error.message : 'Erreur lors de la vérification',
        needsManualReview: true
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
