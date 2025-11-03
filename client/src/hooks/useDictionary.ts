import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { DictionaryService } from '@/services/dictionaryService';
import type { DictionaryEntry } from '@/types/dictionary';
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

  const handleWordClick = async (word: string, sentence?: string) => {
    setSelectedWord(word);
    setEncounteredSentence(sentence || null);
    setIsDictionaryOpen(true);
    setIsLoadingDictionary(true);
    setDictionaryData(null);

    try {
      const wordData = await DictionaryService.getWordWithFallback(word);
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

  const handleAddToLearned = async (wordData: {
    word: string;
    definition: string;
    partOfSpeech: string;
    example?: string;
    pronunciation?: string;
  }) => {
    try {
      setIsAddingToLearned(true);
      const payload = {
        ...wordData,
        exampleInText: encounteredSentence || undefined
      };

      await addLearnedWord(payload);
      setIsDictionaryOpen(false);
      setEncounteredSentence(null);
    } finally {
      setIsAddingToLearned(false);
    }
  };

  const handleCloseDictionary = () => {
    setIsDictionaryOpen(false);
    setDictionaryData(null);
    setSelectedWord('');
    setEncounteredSentence(null);
  };

  return {
    selectedWord,
    dictionaryData,
    isDictionaryOpen,
    isLoadingDictionary,
    isAddingToLearned,
    handleWordClick,
    handleAddToLearned,
    handleCloseDictionary,
  };
};