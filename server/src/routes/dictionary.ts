import express from 'express';
import axios from 'axios';
import { VocabularyWord, ISense } from '../models/Vocabulary';
import { disambiguateSense } from '../services/senseDisambiguationService';
import { getCachedDisambiguation, setCachedDisambiguation } from '../utils/disambiguationCache';
import { CONTRACTIONS } from '../constants/contractions';

const router = express.Router();

interface DictionaryContext {
  lemma: string;
  partOfSpeech: string;
  definition: string;
  bestSenseIndex: number;
  sourceIsModel: boolean;
}

// flattens the external dictionaryapi.dev meanings[]/definitions[] shape into one sense per
// part-of-speech x definition pair, matching our simpler ISense[] storage shape
function flattenSenses(meanings: any[]): ISense[] {
  const senses: ISense[] = [];
  for (const meaning of meanings || []) {
    for (const def of meaning.definitions || []) {
      senses.push({
        partOfSpeech: meaning.partOfSpeech || 'unknown',
        definition: def.definition || '',
        example: def.example,
        synonyms: def.synonyms || [],
        antonyms: def.antonyms || [],
      });
    }
  }
  return senses;
}

// GET /api/dictionary/:word?sentence=...
router.get('/:word', async (req, res) => {
  try {
    const raw = (req.params.word || '').trim();
    if (!raw) {
      res.status(400).json({ success: false, message: 'Word is required' });
      return;
    }

    const key = raw.toLowerCase();
    const sentence = typeof req.query.sentence === 'string' ? req.query.sentence.trim() : undefined;

    let vocabWord = await VocabularyWord.findOne({ word: key });

    // treat missing/empty senses as stale (legacy-shape doc, or a prior "not found" stub) and refresh
    if (!vocabWord || vocabWord.senses.length === 0) {
      let phonetic: string | undefined;
      let audioUrl: string | undefined;
      let senses: ISense[] = [];

      if (CONTRACTIONS[key]) {
        // dictionaryapi.dev either lacks contractions entirely ("won't") or indexes an
        // unrelated sense ("don't" as a noun), so serve the built-in definition directly -
        // there's exactly one standard meaning, no external lookup or disambiguation needed
        senses = [{ partOfSpeech: 'contraction', definition: CONTRACTIONS[key], synonyms: [], antonyms: [] }];
      } else {
        try {
          const apiUrl = `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(key)}`;
          const response = await axios.get(apiUrl, { timeout: 5000 });
          const data = response.data;
          if (Array.isArray(data) && data.length > 0) {
            const fetched = data[0];
            phonetic = fetched.phonetic || fetched.phonetics?.[0]?.text || undefined;
            audioUrl = fetched.phonetics?.find((p: any) => p.audio)?.audio || undefined;
            senses = flattenSenses(fetched.meanings);
          }
        } catch (err: any) {
          // dictionaryapi.dev 404s (or errors) for unknown words - fall through with empty senses
          if (err?.response?.status !== 404) {
            console.warn('External dictionary lookup failed:', err?.message || err);
          }
        }
      }

      vocabWord = await VocabularyWord.findOneAndUpdate(
        { word: key },
        { $setOnInsert: { word: key, cefrLevel: 'B2' }, $set: { phonetic, audioUrl, senses } },
        { upsert: true, new: true }
      );
    }

    const senses = vocabWord!.senses;
    let context: DictionaryContext | null = null;

    if (senses.length === 0) {
      context = null;
    } else if (senses.length === 1) {
      context = {
        lemma: key,
        partOfSpeech: senses[0].partOfSpeech,
        definition: senses[0].definition,
        bestSenseIndex: 0,
        sourceIsModel: false,
      };
    } else if (!sentence) {
      // no sentence context to disambiguate against - best guess, not shown as authoritative
      context = {
        lemma: key,
        partOfSpeech: senses[0].partOfSpeech,
        definition: senses[0].definition,
        bestSenseIndex: 0,
        sourceIsModel: false,
      };
    } else {
      const cached = getCachedDisambiguation(raw, sentence);
      if (cached) {
        context = {
          lemma: cached.lemma,
          partOfSpeech: cached.partOfSpeech,
          definition: cached.bestSenseIndex >= 0 ? senses[cached.bestSenseIndex].definition : cached.definition,
          bestSenseIndex: cached.bestSenseIndex,
          sourceIsModel: cached.bestSenseIndex === -1,
        };
      } else {
        try {
          const result = await disambiguateSense(
            raw,
            sentence,
            senses.map(s => ({ partOfSpeech: s.partOfSpeech, definition: s.definition }))
          );
          setCachedDisambiguation(raw, sentence, result);
          context = {
            lemma: result.lemma,
            partOfSpeech: result.partOfSpeech,
            definition: result.bestSenseIndex >= 0 ? senses[result.bestSenseIndex].definition : result.definition,
            bestSenseIndex: result.bestSenseIndex,
            sourceIsModel: result.bestSenseIndex === -1,
          };
        } catch (err: any) {
          console.warn('Sense disambiguation failed, falling back to first sense:', err?.message || err);
          context = {
            lemma: key,
            partOfSpeech: senses[0].partOfSpeech,
            definition: senses[0].definition,
            bestSenseIndex: 0,
            sourceIsModel: false,
          };
        }
      }
    }

    res.status(200).json({
      success: true,
      entry: {
        _id: vocabWord!._id,
        word: vocabWord!.word,
        phonetic: vocabWord!.phonetic,
        phonetics: vocabWord!.phonetic ? [{ text: vocabWord!.phonetic, audio: vocabWord!.audioUrl }] : [],
        senses,
        context,
      },
    });
  } catch (error: any) {
    console.error('Dictionary lookup error:', error?.message || error);
    res.status(500).json({ success: false, message: 'Dictionary lookup failed' });
  }
});

export default router;
