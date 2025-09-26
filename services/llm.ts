import type { Itinerary, Preferences, TransportMode } from '@/types/domain';

type OpenAIChatResponse = {
  choices: { message: { role: string; content: string } }[];
};

function formatPrompt(itineraries: Itinerary[], prefs: Preferences): string {
  const header = `You are a mobility assistant. Rank the itineraries by the user's preferences. Return STRICT JSON object: {"items":[{"id":"...","score":number,"rationale":["..."]}]}. No prose.`;
  const prefsText = `prefs: time=${prefs.weightTime}, cost=${prefs.weightCost}, comfort=${prefs.weightComfort}`;
  const items = itineraries
    .map((it) => `- ${it.id}: time=${Math.round(it.totalTimeMin)}m, cost=₹${(it.totalCostCents / 100).toFixed(2)}, comfort=${Math.round(it.averageComfortScore * 100)}%, legs=${it.legs.map((l) => l.mode).join('>')}`)
    .join('\n');
  return [header, prefsText, items].join('\n');
}

export async function llmRerank(itineraries: Itinerary[], prefs: Preferences, apiKey: string): Promise<{ id: string; score: number; rationale: string[]; fullRationale: string }[]> {
  const prompt = formatPrompt(itineraries, prefs);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'You are a helpful assistant.' },
        { role: 'user', content: prompt },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.2,
    }),
    signal: controller.signal,
  });
  clearTimeout(timeout);
  if (!res.ok) {
    throw new Error(`OpenAI error: ${res.status}`);
  }
  const data = (await res.json()) as OpenAIChatResponse;
  const content = data.choices?.[0]?.message?.content ?? '{}';
  try {
    const parsed = JSON.parse(content);
    let items = [];
    if (Array.isArray(parsed)) items = parsed;
    else if (parsed && Array.isArray(parsed.items)) items = parsed.items;
    
    // Add full rationale to each item
    const fullRationale = `Based on your preferences (Time: ${prefs.weightTime}, Cost: ${prefs.weightCost}, Comfort: ${prefs.weightComfort}), I've ranked these options considering factors like travel time, cost efficiency, and comfort levels. The top recommendation balances your stated priorities while considering practical factors like transfers and mode reliability.`;
    
    return items.map((item: any) => ({
      ...item,
      fullRationale
    }));
  } catch {
    return [];
  }
}


type GeneratedLeg = {
  mode: TransportMode;
  minutes: number;
  costCents: number;
  comfortScore: number; // 0-1
  description?: string;
};

type GenerateResponse = {
  itineraries: Array<{
    id?: string;
    legs: GeneratedLeg[];
  }>;
};

export async function llmGenerateItineraries(params: {
  originText: string;
  destinationText: string;
  cityHint?: string;
  distanceKm: number;
  prefs: Preferences;
  apiKey: string;
  count?: number;
}): Promise<GenerateResponse> {
  const { originText, destinationText, cityHint, distanceKm, prefs, apiKey, count = 4 } = params;
  const sys = 'You are a mobility planner. Produce realistic door-to-door public transport itineraries for the given trip, including walking connections, transit (BUS, METRO, RAIL), cycling or ride-hail as appropriate. Use plausible durations and fares for the city context. Output STRICT JSON with the schema {"itineraries":[{"id":"string(optional)","legs":[{"mode":"WALK|BUS|METRO|RAIL|BIKE|RIDE_HAIL","minutes":number,"costCents":number,"comfortScore":number,"description":"optional"}]}]}. No additional text.';
  const user = `Trip: ${originText} -> ${destinationText}${cityHint ? ` in ${cityHint}` : ''}\nDistance straight-line: ${distanceKm.toFixed(1)} km\nPreferences: time=${prefs.weightTime}, cost=${prefs.weightCost}, comfort=${prefs.weightComfort}\nReturn ${count} diverse options with realistic times, transfers and costs. Ensure comfortScore is in [0,1].`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20000);
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: sys },
        { role: 'user', content: user },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3,
    }),
    signal: controller.signal,
  });
  clearTimeout(timeout);
  if (!res.ok) throw new Error(`OpenAI error: ${res.status}`);
  const data = await res.json() as any;
  const content = data?.choices?.[0]?.message?.content ?? '{}';
  try {
    const parsed = JSON.parse(content) as GenerateResponse;
    if (parsed && Array.isArray(parsed.itineraries)) return parsed;
  } catch {}
  return { itineraries: [] };
}

export async function llmPredictCost(params: {
  originText: string;
  destinationText: string;
  cityHint?: string;
  distanceKm: number;
  mode: string;
  apiKey: string;
}): Promise<number> {
  const { originText, destinationText, cityHint, distanceKm, mode, apiKey } = params;
  const sys = 'You are a cost prediction expert for urban transportation. Given trip details, predict the realistic cost in cents (USD). Consider local pricing, distance, and transport mode. Return only a JSON number.';
  const user = `Trip: ${originText} -> ${destinationText}${cityHint ? ` in ${cityHint}` : ''}\nDistance: ${distanceKm.toFixed(1)} km\nMode: ${mode}\nPredict cost in cents (INR). Return JSON: {"costCents": number}`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: sys },
        { role: 'user', content: user },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.2,
    }),
    signal: controller.signal,
  });
  clearTimeout(timeout);
  if (!res.ok) throw new Error(`OpenAI error: ${res.status}`);
  const data = await res.json() as any;
  const content = data?.choices?.[0]?.message?.content ?? '{}';
  try {
    const parsed = JSON.parse(content) as { costCents: number };
    return Math.max(0, Math.round(parsed.costCents || 0));
  } catch {}
  return 0;
}


