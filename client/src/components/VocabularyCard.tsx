import { Volume2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { type VocabularyItem } from '@/data/vocabulary';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card';

interface VocabularyCardProps {
  vocabulary: VocabularyItem;
}

const VocabularyCard = ({ vocabulary }: VocabularyCardProps) => {
  const playPronunciation = () => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(vocabulary.word);
      utterance.rate = 0.8;
      utterance.lang = 'en-US';
      window.speechSynthesis.speak(utterance);
    }
  };

  return (
    <Card className="shadow-md hover:shadow-lg transition-shadow duration-200">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="text-lg text-primary font-semibold">{vocabulary.word}</span>
          <div className="flex items-center gap-2">
            <span className="text-sm font-mono text-muted-foreground">{vocabulary.pronunciation}</span>
            <Button
              variant="ghostPrimary"
              size="sm"
              onClick={playPronunciation}
              className="h-8 w-8 p-0"
              title="Play pronunciation"
            >
              <Volume2 className="h-4 w-4" />
            </Button>
          </div>
        </CardTitle>
        <CardDescription>
          <span className="text-sm text-muted-foreground italic">{vocabulary.partOfSpeech}</span>
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        <p className="text-sm">
          <span className="font-medium">Definition:</span> {vocabulary.definition}
        </p>
        <p className="text-sm">
          <span className="font-medium">Example:</span> <em>"{vocabulary.example}"</em>
        </p>
      </CardContent>
      <CardFooter className="flex justify-end">
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-muted">
          {vocabulary.cefrLevel} Level
        </span>
      </CardFooter>
    </Card>
  );
};

export default VocabularyCard;
