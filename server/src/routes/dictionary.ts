import express from 'express';
import axios from 'axios';
import rateLimit from 'express-rate-limit';
import { VocabularyWord, ISense } from '../models/Vocabulary';
import { disambiguateSense } from '../services/senseDisambiguationService';
import { getCachedDisambiguation, setCachedDisambiguation } from '../utils/disambiguationCache';
import { CONTRACTIONS } from '../constants/contractions';

// wink-lemmatizer ships no type declarations - typed require avoids ambient-module resolution
// differences between tsc and ts-node
const lemmatizer: {
  verb: (word: string) => string;
  noun: (word: string) => string;
  adjective: (word: string) => string;
} = require('wink-lemmatizer');

const router = express.Router();

interface DictionaryContext {
  lemma: string;
  partOfSpeech: string;
  definition: string;
  bestSenseIndex: number;
  sourceIsModel: boolean;
}

function lemmaCandidates(word: string): string[] {
  return Array.from(new Set(
    [lemmatizer.verb(word), lemmatizer.noun(word), lemmatizer.adjective(word)]
      .filter(candidate => candidate && candidate !== word)
  ));
}

function isFormOf(sense: any): boolean {
  return Array.isArray(sense.tags) && sense.tags.includes('form of');
}

// flattens the external freedictionaryapi.com entries[]/senses[] shape (one entry per
// part-of-speech, each holding multiple senses) into the simpler flat ISense[] storage shape,
// separating real definitions from "form of X" grammatical pointers
function flattenSenses(entries: any[]): { real: ISense[]; formOf: ISense[] } {
  const real: ISense[] = [];
  const formOf: ISense[] = [];
  for (const entry of entries || []) {
    for (const sense of entry.senses || []) {
      const flat: ISense = {
        partOfSpeech: entry.partOfSpeech || 'unknown',
        definition: sense.definition || '',
        example: sense.examples?.[0],
        synonyms: sense.synonyms || [],
        antonyms: sense.antonyms || [],
      };
      (isFormOf(sense) ? formOf : real).push(flat);
    }
  }
  return { real, formOf };
}

interface RawEntry {
  phonetic?: string;
  real: ISense[];
  formOf: ISense[];
}

async function fetchRawEntry(word: string): Promise<RawEntry | null> {
  const apiUrl = `https://freedictionaryapi.com/api/v1/entries/en/${encodeURIComponent(word)}`;
  const response = await axios.get(apiUrl, { timeout: 5000 });
  const data = response.data;
  if (!data?.entries || data.entries.length === 0) return null;

  const { real, formOf } = flattenSenses(data.entries);
  return {
    // this API doesn't expose pronunciation audio, only IPA text
    phonetic: data.entries[0]?.pronunciations?.[0]?.text || undefined,
    real,
    formOf,
  };
}

interface DictionaryEntry {
  phonetic?: string;
  audioUrl?: string;
  senses: ISense[];
  formOf?: string;
  formOfRoots?: string[];
}

type LookupResult =
  | { found: true; entry: DictionaryEntry }
  | { found: false; unavailable: boolean };

async function fetchDictionaryEntry(word: string): Promise<LookupResult> {
  try {
    const raw = await fetchRawEntry(word);
    if (!raw) return { found: false, unavailable: false };

    let senses = raw.real;
    const formOfRoots: string[] = [];

    if (raw.formOf.length > 0) {
      for (const candidate of lemmaCandidates(word)) {
        try {
          const base = await fetchRawEntry(candidate);
          if (base) {
            senses = senses.concat(base.real);
            formOfRoots.push(candidate);
          }
        } catch {
        }
      }
      if (senses.length === 0) senses = raw.formOf;
    }

    return {
      found: true,
      entry: {
        phonetic: raw.phonetic,
        audioUrl: undefined,
        senses,
        formOf: raw.formOf[0]?.definition,
        formOfRoots: formOfRoots.length > 0 ? formOfRoots : undefined,
      },
    };
  } catch (err: any) {
    console.warn(`External dictionary lookup failed for "${word}":`, err?.message || err);
    return { found: false, unavailable: true };
  }
}

// this route is reachable by guests (no per-user budget), and a lookup can trigger a paid
// OpenAI disambiguation call, so it gets a tighter cap than the app-wide limiter in server.ts
const dictionaryLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60,
  message: 'Too many dictionary lookups from this IP, please try again later.'
});

// GET /api/dictionary/:word?sentence=...
router.get('/:word', dictionaryLimiter, async (req, res) => {
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
      let resolvedLemma: string | undefined;
      let formOf: string | undefined;
      let formOfRoots: string[] | undefined;

      if (CONTRACTIONS[key]) {
        // dictionaryapi.dev either lacks contractions entirely ("won't") or indexes an
        // unrelated sense ("don't" as a noun), so serve the built-in definition directly -
        // there's exactly one standard meaning, no external lookup or disambiguation needed
        senses = [{ partOfSpeech: 'contraction', definition: CONTRACTIONS[key], synonyms: [], antonyms: [] }];
      } else {
        let result = await fetchDictionaryEntry(key);

        if (!result.found && !result.unavailable) {
          for (const candidate of lemmaCandidates(key)) {
            const candidateResult = await fetchDictionaryEntry(candidate);
            if (candidateResult.found) {
              result = candidateResult;
              resolvedLemma = candidate;
              break;
            }
            if (candidateResult.unavailable) {
              result = candidateResult;
              break;
            }
          }
        }

        if (result.found) {
          phonetic = result.entry.phonetic;
          audioUrl = result.entry.audioUrl;
          senses = result.entry.senses;
          formOf = result.entry.formOf;
          formOfRoots = result.entry.formOfRoots;
        } else if (result.unavailable) {
          // don't cache anything - we don't actually know whether this word has a
          // definition, only that we couldn't ask the external dictionary right now
          res.status(200).json({ success: true, unavailable: true, entry: null });
          return;
        }
      }

      vocabWord = await VocabularyWord.findOneAndUpdate(
        { word: key },
        {
          $setOnInsert: { word: key, cefrLevel: 'B2' },
          $set: { phonetic, audioUrl, senses, formOf, formOfRoots, ...(resolvedLemma ? { lemma: resolvedLemma } : {}) },
        },
        { upsert: true, new: true }
      );
    }

    const senses = vocabWord!.senses;
    const lemma = vocabWord!.lemma || key;
    let context: DictionaryContext | null = null;

    if (senses.length === 0) {
      context = null;
    } else if (senses.length === 1) {
      context = {
        lemma,
        partOfSpeech: senses[0].partOfSpeech,
        definition: senses[0].definition,
        bestSenseIndex: 0,
        sourceIsModel: false,
      };
    } else if (!sentence) {
      // no sentence context to disambiguate against - best guess, not shown as authoritative
      context = {
        lemma,
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
            lemma,
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
        formOf: vocabWord!.formOf,
        formOfRoots: vocabWord!.formOfRoots,
        context,
      },
    });
  } catch (error: any) {
    console.error('Dictionary lookup error:', error?.message || error);
    res.status(500).json({ success: false, message: 'Dictionary lookup failed' });
  }
});

export default router;
