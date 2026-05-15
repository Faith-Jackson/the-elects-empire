// Supabase Edge Function: ai-proxy
// This function proxies AI requests to Groq, keeping the API key server-side.
//
// Deploy: supabase functions deploy ai-proxy --no-verify-jwt
// Set secret: supabase secrets set GROQ_API_KEY=your_key_here

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Rate limiting per user (in-memory, resets on function cold start)
const rateLimits = new Map<string, { count: number; resetAt: number }>();

function checkRate(userId: string, max: number = 30, windowMs: number = 60000): boolean {
  const now = Date.now();
  const entry = rateLimits.get(userId);
  
  if (!entry || now >= entry.resetAt) {
    rateLimits.set(userId, { count: 1, resetAt: now + windowMs });
    return true;
  }
  
  if (entry.count >= max) return false;
  entry.count++;
  return true;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const GROQ_API_KEY = Deno.env.get('GROQ_API_KEY');
    if (!GROQ_API_KEY) {
      throw new Error('GROQ_API_KEY not configured as a Supabase secret.');
    }

    // Extract user from Supabase JWT (optional — allows anonymous AI use)
    const authHeader = req.headers.get('Authorization');
    let userId = 'anonymous';
    
    if (authHeader) {
      try {
        // Decode JWT payload (we trust Supabase's verification)
        const token = authHeader.replace('Bearer ', '');
        const payload = JSON.parse(atob(token.split('.')[1]));
        userId = payload.sub || 'anonymous';
      } catch {
        // Continue with anonymous rate limiting
      }
    }

    // Rate limit check
    if (!checkRate(userId)) {
      return new Response(
        JSON.stringify({ error: 'Rate limit exceeded. Please wait a moment.' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body = await req.json();
    
    // Validate request structure
    if (!body.messages || !Array.isArray(body.messages)) {
      return new Response(
        JSON.stringify({ error: 'Invalid request: messages array required.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Enforce model whitelist
    const allowedModels = ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant'];
    const model = allowedModels.includes(body.model) ? body.model : 'llama-3.3-70b-versatile';

    // Enforce token limits
    const maxTokens = Math.min(body.max_tokens || 1024, 2048);

    // Forward to Groq
    const groqResponse = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages: body.messages,
        temperature: body.temperature ?? 0.7,
        max_tokens: maxTokens,
        ...(body.response_format ? { response_format: body.response_format } : {}),
      }),
    });

    const data = await groqResponse.json();

    return new Response(JSON.stringify(data), {
      status: groqResponse.status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
