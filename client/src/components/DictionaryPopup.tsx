import { X, BookOpen, Sprout, Loader2, ChevronDown } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import type { DictionaryEntry } from '@/types/dictionary';
import type { SourceMediaType } from '@/data/vocabulary';
import PronunciationButton from './PronunciationButton';
import { useAuth } from '@/contexts/AuthContext';

const SOURCE_LABELS: Record<SourceMediaType, string> = {
  article: 'In this article',
  video: 'In this video',
};

interface DictionaryPopupProps {
  word: string;
  dictionaryData: DictionaryEntry | null;
  isOpen: boolean;
  onClose: () => void;
  onAddToLearned: () => void;
  isAddingToLearned?: boolean;
  isLoading?: boolean;
  sourceSentence?: string | null;
  sourceMediaType?: SourceMediaType | null;
}

const DictionaryPopup = ({
  word,
  dictionaryData,
  isOpen,
  onClose,
  onAddToLearned,
  isAddingToLearned = false,
  isLoading = false,
  sourceSentence,
  sourceMediaType
}: DictionaryPopupProps) => {
  if (!isOpen) return null;

  const { user } = useAuth();
  const alreadyLearned = Boolean(
    user?.learnedWords?.some(w => (
      w.wordId && dictionaryData?.word && w.wordId.word.toLowerCase() === dictionaryData.word.toLowerCase()
    ))
  );

  const hasSenses = (dictionaryData?.senses.length ?? 0) > 0;

  const plantButton = !alreadyLearned && dictionaryData?._id && (
    <div className="flex justify-center pt-4">
      <Button
        onClick={onAddToLearned}
        disabled={isAddingToLearned}
        className="flex items-center gap-2"
      >
        <Sprout className="w-4 h-4" />
        {isAddingToLearned ? 'Planting...' : 'Plant in my garden'}
      </Button>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-foreground/50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-2xl max-h-[80vh] overflow-y-auto bg-background rounded-2xl">
        <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-4">
          <div className="flex-1">
            <CardTitle className="flex items-center gap-3 text-2xl">
              {dictionaryData ? dictionaryData.word : word}
              {dictionaryData && (
                <PronunciationButton
                  word={dictionaryData.word}
                  pronunciation={dictionaryData.phonetic || dictionaryData.phonetics[0]?.text}
                  showPronunciation={false}
                />
              )}
            </CardTitle>
            {dictionaryData && (
              <CardDescription className="flex items-center gap-2 mt-1">
                {dictionaryData.context?.partOfSpeech && (
                  <span className="bg-secondary/15 text-secondary text-xs px-2.5 py-0.5 rounded-full">
                    {dictionaryData.context.partOfSpeech}
                  </span>
                )}
                {dictionaryData.phonetic && (
                  <span className="text-sm font-mono">{dictionaryData.phonetic}</span>
                )}
              </CardDescription>
            )}
          </div>
          <Button variant="none" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </CardHeader>

        <CardContent className="space-y-6">
          {isLoading ? (
            <div className="text-center py-8">
              <Loader2 className="w-8 h-8 text-primary mx-auto mb-4 animate-spin" />
              <p className="text-lg font-medium">
                Looking up "{word}"...
              </p>
              <p className="text-sm mt-2">
                Fetching definition from dictionary
              </p>
            </div>
          ) : !dictionaryData ? (
            <div className="text-center py-8">
              <BookOpen className="w-12 h-12 mx-auto mb-4" />
              <p className="text-lg font-medium">
                Couldn't look up "{word}"
              </p>
              <p className="text-sm mt-2">
                There was a problem reaching the dictionary. Please try again.
              </p>
            </div>
          ) : !hasSenses ? (
            <>
              <div className="text-center py-8">
                <BookOpen className="w-12 h-12 mx-auto mb-4" />
                <p className="text-lg font-medium">
                  No definition found for "{word}"
                </p>
                <p className="text-sm mt-2">
                  Try checking the spelling, or plant it anyway and look it up later.
                </p>
              </div>
              {plantButton}
            </>
          ) : (
            <>
              {dictionaryData.context && (
                <div className="space-y-2">
                  <p className="text-sm leading-relaxed">
                    <span className="font-medium">Definition:</span> {dictionaryData.context.definition}
                  </p>
                </div>
              )}

              {sourceSentence && (
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    {sourceMediaType ? SOURCE_LABELS[sourceMediaType] : 'In context'}
                  </p>
                  <p className="border-l-[3px] border-accent pl-3 text-sm italic text-muted-foreground">
                    "{sourceSentence}"
                  </p>
                </div>
              )}

              {dictionaryData.senses.length > 1 && (
                <details className="group border rounded-lg p-4">
                  <summary className="flex items-center justify-between cursor-pointer text-sm font-medium list-none">
                    More definitions
                    <ChevronDown className="w-4 h-4 transition-transform group-open:rotate-180" />
                  </summary>
                  <div className="space-y-3 mt-3">
                    {dictionaryData.senses.map((sense, senseIndex) => (
                      <div key={senseIndex} className="space-y-2 pt-3 border-t first:pt-0 first:border-t-0">
                        <p className="text-sm leading-relaxed">
                          <span className="bg-secondary/15 text-secondary text-xs px-2.5 py-0.5 rounded-full mr-2">
                            {sense.partOfSpeech}
                          </span>
                          {sense.definition}
                        </p>

                        {sense.example && (
                          <p className="border-l-[3px] border-accent pl-3 text-sm italic text-muted-foreground">
                            "{sense.example}"
                          </p>
                        )}

                        {sense.synonyms.length > 0 && (
                          <div>
                            <span className="text-sm font-medium">SYNONYMS: </span>
                            <span className="text-sm">{sense.synonyms.join(', ')}</span>
                          </div>
                        )}

                        {sense.antonyms.length > 0 && (
                          <div>
                            <span className="text-sm font-medium">ANTONYMS: </span>
                            <span className="text-sm">{sense.antonyms.join(', ')}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </details>
              )}

              {plantButton}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default DictionaryPopup;
