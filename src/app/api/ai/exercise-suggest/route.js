// app/api/ai/exercise-suggest/route.js
import { NextResponse } from 'next/server';

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY; // server-only

const LOCAL_RULES = {
  'barbell bench press': {
    details: 'Compound chest press emphasizing pectorals with triceps and anterior deltoids assisting.',
    category: 'Chest',
    primaryMusclesWorked: ['Pectoralis major'],
    secondaryMusclesWorked: ['Triceps brachii', 'Anterior deltoid'],
    targetReps: '6-10',
    targetSets: 3,
    rest: 120,
    tempo: '2/1/2',
  },
  squat: {
    details: 'Barbell back squat focusing on quads and glutes; maintain neutral spine.',
    category: 'Legs',
    primaryMusclesWorked: ['Quadriceps', 'Gluteus maximus'],
    secondaryMusclesWorked: ['Hamstrings', 'Erector spinae', 'Core'],
    targetReps: '5-8',
    targetSets: 5,
    rest: 150,
    tempo: '3/1/2',
  },
  deadlift: {
    details: 'Conventional deadlift; hinge pattern; drive through midfoot, lockout with glutes.',
    category: 'Back',
    primaryMusclesWorked: ['Hamstrings', 'Gluteus maximus'],
    secondaryMusclesWorked: ['Erector spinae', 'Lats', 'Forearms'],
    targetReps: '3-5',
    targetSets: 5,
    rest: 180,
    tempo: '2/1/2',
  },
};

export async function POST(req) {
	console.log("here");
  try {
    const { name } = await req.json();
    const exercise = String(name || '')
      .trim()
      .toLowerCase();
    if (!exercise) return NextResponse.json({ ok: false, reason: 'NO_NAME' }, { status: 400 });

    // fallback if no key configured
    if (!OPENROUTER_API_KEY) {
      const local = LOCAL_RULES[exercise] || null;
      return NextResponse.json({ ok: true, source: local ? 'local' : 'none', data: local }, { status: 200 });
    }

    // call OpenRouter with short timeout
    const controller = new AbortController();
    const tid = setTimeout(() => controller.abort(), 6000);

    const system = `You are a fitness assistant. Return STRICT JSON ONLY.
Schema:
{
  "details": string,
  "category": string,
  "primaryMusclesWorked": string[],
  "secondaryMusclesWorked": string[],
  "targetReps": string,
  "targetSets": number,
  "rest": number,
  "tempo": string,
  "imgUrl": string | null,
  "videoUrl": string | null
}
Rules:
- concise, accurate defaults
- "targetReps" may be "8-12"
- "tempo" like "2/1/2"; "" if unknown
- keep arrays under 6 items
- NEVER include explanations or markdown — JSON ONLY.`;

    const userPrompt = `Exercise name: "${name}". Suggest values for the schema.`;

    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        'HTTP-Referer': 'https://your-app.example',
        'X-Title': 'Exercise autofill',
      },
      body: JSON.stringify({
        model: 'openrouter/openai/gpt-4o-mini',
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.3,
        max_tokens: 300,
      }),
    }).finally(() => clearTimeout(tid));

    if (!res.ok) {
      const local = LOCAL_RULES[exercise] || null;
      return NextResponse.json({ ok: true, source: local ? 'local' : 'none', data: local }, { status: 200 });
    }

    const data = await res.json();
    const text = data?.choices?.[0]?.message?.content || '';
    const json = tryParseJSON(text);

    if (!json || typeof json !== 'object') {
      const local = LOCAL_RULES[exercise] || null;
      return NextResponse.json({ ok: true, source: local ? 'local' : 'none', data: local }, { status: 200 });
    }

    return NextResponse.json({ ok: true, source: 'ai', data: json }, { status: 200 });
  } catch {
    return NextResponse.json({ ok: true, source: 'none', data: null }, { status: 200 });
  }
}

function tryParseJSON(s) {
  if (!s) return null;
  try {
    const m = s.match(/```json\s*([\s\S]*?)```/i);
    if (m) return JSON.parse(m[1]);
    return JSON.parse(s);
  } catch {
    return null;
  }
}
