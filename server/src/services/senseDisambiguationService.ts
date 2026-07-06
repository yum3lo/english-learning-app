export interface CandidateSense {
  partOfSpeech: string;
  definition: string;
}

export interface DisambiguationResult {
  lemma: string;
  partOfSpeech: string;
  bestSenseIndex: number;
  definition: string;
  confidence: 'high' | 'medium' | 'low';
}

const TIMEOUT_MS = 3000;
const VALID_CONFIDENCE = new Set(['high', 'medium', 'low']);

export async function disambiguateSense(
  surfaceForm: string,
  sentence: string,
  senses: CandidateSense[]
): Promise<DisambiguationResult> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY not set in environment');
  }

  const systemPrompt = `You are a lexicographer helping an English learner. Given a target word, the sentence it appeared in, and a list of candidate dictionary senses, choose the single sense that best fits the usage in that sentence. Prefer choosing one of the provided senses. Only if NONE fit the usage, write your own concise, learner-friendly definition. Respond with JSON only, no prose.`;

  const sensesList = senses.map((s, i) => `${i}: (${s.partOfSpeech}) ${s.definition}`).join('\n');
  const userPrompt = `Target word (as it appears): "${surfaceForm}"
Sentence: "${sentence}"
Candidate senses:
${sensesList}

Respond with JSON only, in this exact schema:
{
  "lemma": "string, the dictionary headword/lemma of the target word",
  "partOfSpeech": "string, the part of speech of the chosen sense",
  "bestSenseIndex": 0,
  "definition": "string, the chosen sense's text, or your own concise definition if bestSenseIndex is -1",
  "confidence": "high, medium, or low"
}`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.2,
        max_tokens: 300,
        response_format: { type: 'json_object' },
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
    }

    const data = (await response.json()) as any;
    const responseText = data?.choices?.[0]?.message?.content ?? '';

    let parsed: any;
    try {
      parsed = JSON.parse(responseText);
    } catch (e) {
      throw new Error('Invalid JSON response from disambiguation model');
    }

    const bestSenseIndex = Number.isInteger(parsed.bestSenseIndex) ? parsed.bestSenseIndex : -1;
    if (bestSenseIndex < -1 || bestSenseIndex >= senses.length) {
      throw new Error(`bestSenseIndex out of range: ${parsed.bestSenseIndex}`);
    }

    if (!parsed.definition || typeof parsed.definition !== 'string') {
      throw new Error('Missing or invalid definition in disambiguation response');
    }

    const confidence = VALID_CONFIDENCE.has(parsed.confidence) ? parsed.confidence : 'medium';

    return {
      lemma: typeof parsed.lemma === 'string' && parsed.lemma ? parsed.lemma : surfaceForm,
      partOfSpeech: typeof parsed.partOfSpeech === 'string' && parsed.partOfSpeech
        ? parsed.partOfSpeech
        : (bestSenseIndex >= 0 ? senses[bestSenseIndex].partOfSpeech : 'unknown'),
      bestSenseIndex,
      definition: parsed.definition,
      confidence,
    };
  } finally {
    clearTimeout(timeoutId);
  }
}
