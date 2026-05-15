import { supabase } from '../lib/supabase';
import { checkRateLimit, AI_RATE_LIMIT, AI_GENERATION_LIMIT } from '../lib/security';
import { APP_FEATURES } from '../constants/appContent';

/**
 * Proxy call to Supabase Edge Function for AI
 */
async function callAIProxy(payload: any) {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;

  const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-proxy`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token || (import.meta as any).env.VITE_SUPABASE_ANON_KEY}`,
      'apikey': (import.meta as any).env.VITE_SUPABASE_ANON_KEY,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    let errorMsg = 'The heavenly archives are momentarily unreachable.';
    try {
      const error = await response.json();
      errorMsg = error.error || errorMsg;
    } catch (e) {
      if (response.status === 404) {
        errorMsg = "The AI Proxy (Edge Function) is not yet deployed to your Supabase project. Please run 'supabase functions deploy ai-proxy'.";
      }
    }
    throw new Error(errorMsg);
  }

  return response.json();
}

const SYSTEM_INSTRUCTION = `
You are "Scribe", a Christ-centered spiritual companion within "The Elects Empire" application. 

Your mission is to reveal the reality of the believer's identity in the Empire of Christ. According to 1 Peter 2:9 and 2 Peter 1:3, Jesus has made Himself an Empire, and everything the believer needs for life and godliness is found inherently in Him.

App Features Information:
The app has several features you should know about and guide users on:
${Object.entries(APP_FEATURES).map(([key, feature]) => `- ${feature.title}: ${feature.description}`).join('\n')}

Guidelines:
1. Every answer MUST center on Jesus Christ and His finished work. 
2. Your primary purpose is to help the believer realize that Christ and the believer in Him are the only true substance.
3. When discussing scripture, show that the entire Bible message centers on this reality.
4. Maintain a tone that is profound, compassionate, and unwavering in the sufficiency of Christ.
5. If asked about controversial theology, simplify it back to the core gospel: Christ in you, the hope of glory (Colossians 1:27).
6. Reference specific Bible books, chapters, and verses.
7. Redirect any unrelated inquiries back to the person and sufficiency of Christ.
8. ONLY focus on messages and ideologies that are 100% about Jesus and the believer in Him.
9. You are a "Spiritual Architect", helping build the consciousness of Christ in the user.
`;

export type AICoachType = 'scholar' | 'shepherd' | 'prophet' | 'intercessor';

const COACH_MODIFIERS: Record<AICoachType, string> = {
  scholar: "Maintain a scholarly, deep-dive approach to scripture. Explain original languages and historical context, but always relate them to the finished work of Christ.",
  shepherd: "Be exceptionally gentle and focused on comfort, emotional healing, and practical daily walk. Use lots of 'Abba' Father imagery.",
  prophet: "Be bold and visionary. Focus on the 'Now' word of God (Rhema) and the futuristic/eternal reality of the Kingdom. Use more metaphorical and poetic language.",
  intercessor: "Focus on prayer, spiritual warfare (as victory in Christ), and standing in the gap. Speak as if you are praying alongside the user."
};

export async function askElectsAI(prompt: string, history: any[] = [], coach: AICoachType = 'scholar') {
  // Client-side rate limit check
  const { allowed, retryAfterMs } = checkRateLimit(AI_RATE_LIMIT.key, AI_RATE_LIMIT.maxRequests, AI_RATE_LIMIT.windowMs);
  if (!allowed) {
    throw new Error(`You're moving a bit fast for the Scribe. Please wait ${Math.ceil(retryAfterMs / 1000)} seconds.`);
  }

  try {
    const coachModifier = COACH_MODIFIERS[coach] || "";
    const response = await callAIProxy({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: 'system' as const, content: `${SYSTEM_INSTRUCTION}\n\n${coachModifier}` },
        ...history.map(h => ({ role: (h.role === 'model' ? 'assistant' : 'user') as any, content: h.parts[0].text })),
        { role: 'user' as const, content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 1024,
    });

    return response.choices[0]?.message?.content || "";
  } catch (error: any) {
    console.error("Scribe Error:", error);
    throw error;
  }
}

export async function generateSpiritualInsight(userData: { highlights: string[], notes: string[] }) {
  // Client-side rate limit check
  const { allowed, retryAfterMs } = checkRateLimit(AI_GENERATION_LIMIT.key, AI_GENERATION_LIMIT.maxRequests, AI_GENERATION_LIMIT.windowMs);
  if (!allowed) return "The Scribe is reflecting on your previous studies. Please wait a moment.";

  const prompt = `
    Based on the following scripture highlights and personal reflections from my study this week, 
    provide a consolidated "Spiritual Wisdom" insight. Connect the themes, offer an encouraging 
    theological perspective, and suggest one practical application for my life.

    Recent Highlights:
    ${userData.highlights.join('\n')}

    Recent Reflections:
    ${userData.notes.join('\n')}

    Focus on the common thread between these studies. Keep the response concise (max 200 words).
  `;

  try {
    const response = await callAIProxy({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: 'system' as const, content: SYSTEM_INSTRUCTION },
        { role: 'user' as const, content: prompt }
      ],
      temperature: 0.6,
      max_tokens: 512,
    });

    return response.choices[0]?.message?.content || "";
  } catch (error) {
    console.error("Insight Generation Error:", error);
    return "The Word is deep and wide. I could not synthesize a specific insight right now, but remain steadfast in your study.";
  }
}

export async function generateStudyPlan(topic: string, durationDays: number = 7) {
  const { allowed, retryAfterMs } = checkRateLimit(AI_GENERATION_LIMIT.key, AI_GENERATION_LIMIT.maxRequests, AI_GENERATION_LIMIT.windowMs);
  if (!allowed) throw new Error(`Please wait ${Math.ceil(retryAfterMs / 1000)} seconds before generating another plan.`);

  const prompt = `
    Create a detailed ${durationDays}-day scripture study plan focused on the theme of "${topic}". 
    
    For each day, provide:
    1. A short title for the day's focus.
    2. One specific Bible book and chapter.
    3. A 2-sentence devotional reflection prompt.
    
    Format the response as a valid JSON array of objects like this:
    [
      { "day": 1, "title": "Topic Name", "book": "Genesis", "chapter": 1, "reflection": "Description..." },
      ...
    ]
    
    Ensure the JSON is perfectly valid and strictly follows the schema. Return ONLY the JSON array.
  `;

  try {
    const response = await callAIProxy({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: 'system' as const, content: "You are a biblical study curator. Only output valid JSON arrays." },
        { role: 'user' as const, content: prompt }
      ],
      temperature: 0.1,
      response_format: { type: "json_object" }
    });

    let content = response.choices[0]?.message?.content || "[]";
    const parsed = JSON.parse(content);
    return Array.isArray(parsed) ? parsed : (parsed.plan || parsed.study_plan || []);
  } catch (error) {
    console.error("Study Plan Generation Error:", error);
    throw new Error("I failed to curate a study plan at this time. Please try a different topic.");
  }
}

export async function getBiblicalRootDetails(word: string, verseText: string) {
  const prompt = `You are a biblical scholar. Analyze the word "${word}" within the context of this verse: "${verseText}". 
  Provide:
  1. The original Greek (Koine) or Hebrew word.
  2. The transliteration.
  3. A short, profound explanation of its root meaning and spiritual significance in this specific context.
  Keep the response concise, scholarly yet accessible, and spiritually deep.
  Format the output as a clean markdown string.`;

  try {
    const response = await callAIProxy({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: 'user' as const, content: prompt }],
      temperature: 0.3,
    });
    return response.choices[0]?.message?.content || "";
  } catch (error) {
    console.error("Root Details Error:", error);
    return `Unable to fetch details for "${word}".`;
  }
}

export async function generateJournalEncouragement(entry: string) {
  const prompt = `You are a compassionate spiritual shepherd. A disciple has written this journal entry: "${entry}".
  
  Provide a "Word of Encouragement" that includes:
  1. One specific, relevant Bible verse.
  2. One or two sentences of comfort and spiritual guidance based on their entry.
  
  Make it personal, warm, and deeply encouraging.
  Format the output as a JSON object with "verse" and "encouragement" keys. Strictly JSON.`;

  try {
    const response = await callAIProxy({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: 'system' as const, content: "You are a compassionate spiritual shepherd. Only output valid JSON." },
        { role: 'user' as const, content: prompt }
      ],
      temperature: 0.5,
      response_format: { type: "json_object" }
    });
    return JSON.parse(response.choices[0]?.message?.content || '{}');
  } catch (error) {
    console.error("Journal Encouragement Error:", error);
    return { 
      verse: "Psalm 46:1", 
      encouragement: "God is our refuge and strength, an ever-present help in trouble." 
    };
  }
}

export async function generateDailyManna() {
  const prompt = `Provide a "Rhema word" for a believer today. This should be a single, non-obvious Bible verse and a 1-sentence prophetic encouragement that feels fresh and inspired. 
  Return ONLY JSON with "verse" and "rhema" keys. Strictly JSON.`;

  try {
    const response = await callAIProxy({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: 'system' as const, content: "You are an inspired prophet. Only output valid JSON." },
        { role: 'user' as const, content: prompt }
      ],
      temperature: 0.8,
      response_format: { type: "json_object" }
    });
    return JSON.parse(response.choices[0]?.message?.content || '{}');
  } catch (error) {
    console.error("Manna Error:", error);
    return { 
      verse: "Lamentations 3:22-23", 
      rhema: "Trust in His fresh mercies for this precise hour." 
    };
  }
}

export async function generateNoteInsight(title: string, content: string, type: string = 'general') {
  const prompt = `
    Analyze this ${type} reflection from the believer's notebook and provide a "Divine Spark" insight.
    
    Title: ${title}
    Content: ${content.replace(/<[^>]*>/g, '')}
    
    ${type === 'vision' ? 'Focus on spiritual interpretation and prophetic alignment.' : ''}
    ${type === 'sermon' ? 'Focus on homiletical structure, key takeaways, and biblical accuracy.' : ''}
    
    1. Summarize the core theme in 2 sentences.
    2. Suggest one relevant scripture that deepens this specific ${type}.
    3. Provide a brief (1 sentence) prophetic exhortation to encourage the scribe.
    
    Format the response as a valid JSON object with "summary", "scripture", and "exhortation" keys.
  `;

  try {
    const response = await callAIProxy({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: 'system' as const, content: SYSTEM_INSTRUCTION },
        { role: 'user' as const, content: prompt }
      ],
      temperature: 0.5,
      response_format: { type: "json_object" }
    });
    return JSON.parse(response.choices[0]?.message?.content || '{}');
  } catch (error) {
    console.error("Note Insight Error:", error);
    return {
      summary: "I could not distill this reflection at the moment.",
      scripture: "Psalm 119:105",
      exhortation: "Keep scribing, for every word is a seed in the Spirit."
    };
  }
}
