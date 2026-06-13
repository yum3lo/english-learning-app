export async function formatTranscriptWithOpenAI(rawTranscript: string): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY not set in environment');
  }

  if (!rawTranscript || rawTranscript.trim().length === 0) {
    throw new Error('Transcript to format is empty');
  }

  // truncating to ~10k tokens (rough ~40k characters) to stay within limits
  const truncatedText = rawTranscript.slice(0, 40000);

  const systemPrompt = `You are an expert transcript editor. The user will give you a raw video transcript that has no punctuation, capitalization, or paragraph breaks - just a continuous stream of words.

Your task is to rewrite it as readable text by:
- Adding proper punctuation (periods, commas, question marks, etc.)
- Capitalizing the first word of each sentence and proper nouns
- Splitting the text into paragraphs where the topic shifts

Rules:
- Do not change, add, remove, or reorder any words.
- Do not summarize, translate, or rephrase anything.
- Return only the formatted transcript text, with no extra commentary, headings, or markdown.`;

  const userPrompt = `Format the following transcript:

"""
${truncatedText}
"""`;

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
      max_tokens: 16000,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
  }

  const data = (await response.json()) as any;
  const formatted = data?.choices?.[0]?.message?.content?.trim();

  if (!formatted) {
    throw new Error('Empty response from OpenAI');
  }

  return formatted;
}
