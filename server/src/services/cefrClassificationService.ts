import { CATEGORIES, CEFR_LEVELS, CEFRLevel } from '../constants/categories';

interface ClassificationResult {
  level: CEFRLevel;
  confidence: number;
  rationale: string;
  category: string;
}

const VALID_LEVELS = new Set(CEFR_LEVELS);
const VALID_CATEGORIES = new Set<string>(CATEGORIES);

export async function classifyTextWithOpenAI(text: string): Promise<ClassificationResult> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY not set in environment');
  }

  if (!text || text.trim().length === 0) {
    throw new Error('Text to classify is empty');
  }

  // Truncate text to ~10k tokens (rough ~40k characters) to stay within limits
  const truncatedText = text.slice(0, 40000);

  const systemPrompt = `You are an expert English language proficiency classifier and content categorizer. Your task is to analyze text and (1) classify it according to the CEFR (Common European Framework of Reference for Languages) scale, and (2) pick the single best-fit topic category.

This system only supports the following CEFR levels:
- B1: Intermediate - Clear standard input on familiar matters and simple texts
- B2: Upper Intermediate - Clear, detailed text with varied sentence structures
- C1: Advanced - Complex, abstract texts with sophisticated vocabulary and structures
- C2: Mastery - Extremely complex, nuanced, and sophisticated language

If the text is simpler than B1 (e.g. beginner/elementary level), classify it as B1, since it is the lowest level supported.

For category, choose exactly ONE of these that the text is primarily ABOUT (not just tangentially mentions):
${CATEGORIES.join(', ')}

Guidance on easily-confused categories:
- "Life Stories" is for first-person or profile pieces centered on one person's personal experience, memoir, or life journey (a "how X changed me" piece, a profile of an ordinary person's life) - NOT for content about literature/books, film, or public figures' professional work.
- "Literature" is about books/authors as a subject (reviews, literary analysis) - not any text that happens to be well-written.
- "Cinema" is about film/filmmaking as a subject - not any text that mentions a movie in passing.
- A recipe or "how to cook X" piece is "Food", even if the writing itself is stylish.
- Use "General" only when nothing else genuinely fits - it should be rare, not a default.

Respond ONLY with valid JSON in this exact format:
{
  "level": "B1",
  "confidence": 0.85,
  "rationale": "Brief explanation of why this level was chosen",
  "category": "One of the categories listed above"
}

Do not include any other text or markdown formatting.`;

  const userPrompt = `Classify the following text - both its CEFR level and its single best-fit topic category:

"""
${truncatedText}
"""

Remember: Respond ONLY with valid JSON, no other text.`;

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
      }),
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
      console.error('Failed to parse OpenAI response:', responseText);
      throw new Error('Invalid JSON response from OpenAI');
    }

    // normalizing levels below the supported range as model may return A1/A2
    if (parsed.level === 'A1' || parsed.level === 'A2') {
      parsed.level = 'B1';
    }

    // validating response
    if (!parsed.level || !VALID_LEVELS.has(parsed.level)) {
      throw new Error(`Invalid CEFR level returned: ${parsed.level}`);
    }

    if (typeof parsed.confidence !== 'number' || parsed.confidence < 0 || parsed.confidence > 1) {
      parsed.confidence = 0.5;
    }

    if (typeof parsed.category !== 'string' || !VALID_CATEGORIES.has(parsed.category)) {
      parsed.category = 'General';
    }

    return {
      level: parsed.level as CEFRLevel,
      confidence: parsed.confidence,
      rationale: parsed.rationale || 'Classification completed',
      category: parsed.category,
    };
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Unknown error during classification');
  }
}
