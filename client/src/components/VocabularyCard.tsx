import { type VocabularyItem } from '@/data/vocabulary';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import PronunciationButton from './PronunciationButton';

interface VocabularyCardProps {
  vocabulary: VocabularyItem;
}

const VocabularyCard = ({ vocabulary }: VocabularyCardProps) => {
  return (
    <Card className="shadow-md hover:shadow-lg transition-shadow duration-200">
      <CardHeader>
        <CardTitle>
          <div className="flex items-start justify-between gap-2">
            <span className="text-lg text-primary font-semibold break-words flex-1">{vocabulary.word}</span>
            <PronunciationButton
              word={vocabulary.word}
              pronunciation={vocabulary.pronunciation}
              showPronunciation={false}
            />
          </div>
          <div className="flex items-center">
            <span className="text-sm font-mono break-words">{vocabulary.pronunciation}</span>
          </div>
        </CardTitle>
        <CardDescription>
          <span className="text-sm italic">{vocabulary.partOfSpeech}</span>
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
    </Card>
  );
};

export default VocabularyCard;
