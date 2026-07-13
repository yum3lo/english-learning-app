export interface GradingResult {
  verdict: 'correct' | 'partial' | 'incorrect';
  semanticMatch: boolean;
  keyConceptPresent: boolean;
  spellingIssue: boolean;
  spellingCorrection: string | null;
  feedback: string;
}

const TIMEOUT_MS = 3500;
const VALID_VERDICTS = new Set(['correct', 'partial', 'incorrect']);

export async function gradeDefinitionAnswer(
  word: string,
  referenceDefinition: string,
  userAnswer: string
): Promise<GradingResult> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY not set in environment');
  }

  const systemPrompt = `You are grading an English learner's flashcard answer. You are given a word, its reference definition, and the learner's typed answer. Decide whether the answer captures the MEANING of the reference definition, allowing different wording, synonyms, and paraphrase - do NOT require exact words. Also judge whether the defining key concept is present, and whether the meaning is right but misspelled. Be encouraging but honest: a vague answer that misses the defining concept is 'partial', not 'correct'. Respond with JSON only.`;

  const userPrompt = `Word: "${word}"
Reference definition: "${referenceDefinition}"
Learner's answer: "${userAnswer}"

Respond with JSON only, in this exact schema:
{
  "verdict": "correct, partial, or incorrect",
  "semanticMatch": true or false,
  "keyConceptPresent": true or false,
  "spellingIssue": true or false,
  "spellingCorrection": "suggested fix string, or null",
  "feedback": "one short encouraging sentence explaining the verdict"
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
        temperature: 0,
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
      throw new Error('Invalid JSON response from grading model');
    }

    // tolerate the model wrapping verdict in unexpected casing/whitespace rather than
    // throwing (and silently falling back to the much harsher Levenshtein check) over formatting
    const normalizedVerdict = typeof parsed.verdict === 'string' ? parsed.verdict.trim().toLowerCase() : '';
    const verdict = VALID_VERDICTS.has(normalizedVerdict) ? (normalizedVerdict as GradingResult['verdict']) : null;
    if (!verdict) {
      throw new Error(`Invalid verdict in grading response: ${parsed.verdict}`);
    }

    return {
      verdict,
      semanticMatch: Boolean(parsed.semanticMatch),
      keyConceptPresent: Boolean(parsed.keyConceptPresent),
      spellingIssue: Boolean(parsed.spellingIssue),
      spellingCorrection: typeof parsed.spellingCorrection === 'string' ? parsed.spellingCorrection : null,
      feedback: typeof parsed.feedback === 'string' && parsed.feedback ? parsed.feedback : '',
    };
  } finally {
    clearTimeout(timeoutId);
  }
}
