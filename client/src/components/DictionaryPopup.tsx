import { X, BookOpen, Plus, Loader2 } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import type { DictionaryEntry } from '@/types/dictionary';
import PronunciationButton from './PronunciationButton';

interface DictionaryPopupProps {
  word: string;
  dictionaryData: DictionaryEntry | null;
  isOpen: boolean;
  onClose: () => void;
  onAddToLearned: (wordData: {
    word: string;
    definition: string;
    partOfSpeech: string;
    example?: string;
    pronunciation?: string;
  }) => void;
  isAddingToLearned?: boolean;
  isLoading?: boolean;
}

const DictionaryPopup = ({ 
  word, 
  dictionaryData, 
  isOpen, 
  onClose, 
  onAddToLearned,
  isAddingToLearned = false,
  isLoading = false
}: DictionaryPopupProps) => {
  if (!isOpen) return null;

  const handleAddToLearned = () => {
    if (!dictionaryData) return;
    
    const firstMeaning = dictionaryData.meanings[0];
    const firstDefinition = firstMeaning?.definitions[0];
    
    const wordData = {
      word: dictionaryData.word,
      definition: firstDefinition?.definition || 'No definition available',
      partOfSpeech: firstMeaning?.partOfSpeech || 'unknown',
      example: firstDefinition?.example,
      pronunciation: dictionaryData.phonetic || dictionaryData.phonetics[0]?.text
    };
    
    onAddToLearned(wordData);
  };

  return (
    <div className="fixed inset-0 bg-foreground/50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-2xl max-h-[80vh] overflow-y-auto">
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
            {dictionaryData?.phonetic && (
              <CardDescription className="text-lg font-mono mt-1">
                {dictionaryData.phonetic}
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
                Definition not found for "{word}"
              </p>
              <p className="text-sm mt-2">
                Try checking the spelling or try a different word.
              </p>
            </div>
          ) : (
            <>
              {dictionaryData.origin && (
                <div className="bg-muted/50 p-4 rounded-lg">
                  <h4 className="mb-2">ORIGIN</h4>
                  <p className="text-sm">{dictionaryData.origin}</p>
                </div>
              )}

              <div className="space-y-4">
                {dictionaryData.meanings.map((meaning, meaningIndex) => (
                  <div key={meaningIndex} className="border rounded-lg p-4">
                    <Badge variant="secondary" className="mb-3">
                      {meaning.partOfSpeech}
                    </Badge>
                    
                    <div className="space-y-3">
                      {meaning.definitions.map((definition, defIndex) => (
                        <div key={defIndex} className="space-y-2">
                          <p className="text-sm leading-relaxed">
                            <span className="font-medium">Definition:</span> {definition.definition}
                          </p>
                          
                          {definition.example && (
                            <p className="text-sm italic">
                              <span className="font-medium">Example:</span> "{definition.example}"
                            </p>
                          )}
                          
                          {definition.synonyms.length > 0 && (
                            <div>
                              <span className="text-xs font-medium">SYNONYMS: </span>
                              <span className="text-xs">
                                {definition.synonyms.join(', ')}
                              </span>
                            </div>
                          )}
                          
                          {definition.antonyms.length > 0 && (
                            <div>
                              <span className="text-xs font-medium">ANTONYMS: </span>
                              <span className="text-xs">
                                {definition.antonyms.join(', ')}
                              </span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-center pt-4">
                <Button 
                  onClick={handleAddToLearned}
                  disabled={isAddingToLearned}
                  className="flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  {isAddingToLearned ? 'Adding to learned...' : 'Add to learned words'}
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default DictionaryPopup;
