import express from 'express';
import axios from 'axios';
import { VocabularyWord } from '../models/Vocabulary';

const router = express.Router();

// GET /api/dictionary/:word
router.get('/:word', async (req, res) => {
  try {
    const raw = (req.params.word || '').trim();
    if (!raw) {
      res.status(400).json({ success: false, message: 'Word is required' });
      return;
    }

    const key = raw.toLowerCase();

    // looking up locally first
    const local = await VocabularyWord.findOne({ word: key }).lean();
    if (local) {
      const entry = {
        _id: local._id,
        word: local.word,
        phonetic: local.phonetic,
        phonetics: local.phonetic ? [{ text: local.phonetic }] : [],
        origin: undefined,
        meanings: [
          {
            partOfSpeech: local.partOfSpeech || 'unknown',
            definitions: [
              {
                definition: local.definition || '',
                example: local.exampleSentences?.[0],
                synonyms: local.synonyms || [],
                antonyms: local.antonyms || []
              }
            ]
          }
        ]
      };

      res.status(200).json({ success: true, entry });
      return;
    }

    // not in DB -> fetching from external dictionary API
    const apiUrl = `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(key)}`;
    const response = await axios.get(apiUrl, { timeout: 5000 });
    const data = response.data;
    if (!Array.isArray(data) || data.length === 0) {
      res.status(404).json({ success: false, message: 'Definition not found' });
      return;
    }

    const fetched = data[0];

    let savedId: string | undefined;
    try {
      const firstMeaning = fetched.meanings?.[0];
      const firstDef = firstMeaning?.definitions?.[0];

      const created = await VocabularyWord.create({
        word: key,
        definition: firstDef?.definition || (fetched.meanings?.[0]?.definitions?.[0]?.definition || 'No definition available'),
        phonetic: fetched.phonetic || fetched.phonetics?.[0]?.text || undefined,
        cefrLevel: 'B2',
        partOfSpeech: firstMeaning?.partOfSpeech || 'unknown',
        exampleSentences: firstDef?.example ? [firstDef.example] : [],
        synonyms: firstDef?.synonyms || [],
        antonyms: firstDef?.antonyms || []
      });
      savedId = created._id.toString();
    } catch (err: any) {
      console.warn('Could not save dictionary word locally:', (err && err.message) ? err.message : err);
      // another request may have created it concurrently - look it up so the client still gets a wordId
      const existing = await VocabularyWord.findOne({ word: key }).lean();
      savedId = existing?._id?.toString();
    }

    res.status(200).json({ success: true, entry: { ...fetched, _id: savedId } });
  } catch (error: any) {
    console.error('Dictionary lookup error:', error?.message || error);
    res.status(500).json({ success: false, message: 'Dictionary lookup failed' });
  }
});

export default router;
