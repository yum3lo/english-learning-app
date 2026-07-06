import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { DictionaryService } from '@/services/dictionaryService';
import type { DictionaryEntry } from '@/types/dictionary';
import type { SourceMediaType } from '@/data/vocabulary';
import { useToast } from '@/hooks/use-toast';

export const useDictionary = () => {
  const { addLearnedWord } = useAuth();
  const { toast } = useToast();

  const [selectedWord, setSelectedWord] = useState<string>('');
  const [dictionaryData, setDictionaryData] = useState<DictionaryEntry | null>(null);
  const [isDictionaryOpen, setIsDictionaryOpen] = useState(false);
  const [isLoadingDictionary, setIsLoadingDictionary] = useState(false);
  const [isAddingToLearned, setIsAddingToLearned] = useState(false);
  const [encounteredSentence, setEncounteredSentence] = useState<string | null>(null);
  const [encounteredMediaType, setEncounteredMediaType] = useState<SourceMediaType | null>(null);

  const handleWordClick = async (word: string, sentence?: string, mediaType?: SourceMediaType) => {
    setSelectedWord(word);
    setEncounteredSentence(sentence || null);
    setEncounteredMediaType(mediaType || null);
    setIsDictionaryOpen(true);
    setIsLoadingDictionary(true);
    setDictionaryData(null);

    try {
      const wordData = await DictionaryService.getWordWithFallback(word, sentence);
      setDictionaryData(wordData);
    } catch (error) {
      console.error('Error fetching dictionary data:', error);
      toast({
        variant: "destructive",
        title: "Dictionary Error",
        description: `Could not find definition for "${word}"`,
      });
    } finally {
      setIsLoadingDictionary(false);
    }
  };

  // relays the disambiguation already computed at lookup time - no second model call happens here
  const handleAddToLearned = async () => {
    if (!dictionaryData?._id) return;

    try {
      setIsAddingToLearned(true);
      const context = dictionaryData.context;
      const payload = {
        wordId: dictionaryData._id,
        surfaceForm: selectedWord,
        lemma: context?.lemma || selectedWord,
        partOfSpeech: context?.partOfSpeech || 'unknown',
        definition: context?.definition || 'No definition available',
        pronunciation: dictionaryData.phonetic || dictionaryData.phonetics[0]?.text,
        audioUrl: dictionaryData.phonetics.find(p => p.audio)?.audio,
        sourceSentence: encounteredSentence || undefined,
        sourceMediaType: encounteredMediaType || undefined,
        sourceIsModel: context?.sourceIsModel ?? false,
        allSenses: dictionaryData.senses,
      };

      await addLearnedWord(payload);
      setIsDictionaryOpen(false);
      setEncounteredSentence(null);
      setEncounteredMediaType(null);
    } finally {
      setIsAddingToLearned(false);
    }
  };

  const handleCloseDictionary = () => {
    setIsDictionaryOpen(false);
    setDictionaryData(null);
    setSelectedWord('');
    setEncounteredSentence(null);
    setEncounteredMediaType(null);
  };

  return {
    selectedWord,
    dictionaryData,
    isDictionaryOpen,
    isLoadingDictionary,
    isAddingToLearned,
    encounteredSentence,
    encounteredMediaType,
    handleWordClick,
    handleAddToLearned,
    handleCloseDictionary,
  };
};
