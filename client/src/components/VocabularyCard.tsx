import { type VocabularyItem } from '@/data/vocabulary';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import PronunciationButton from './PronunciationButton';
import ClickableText from './ClickableText';

interface VocabularyCardProps {
  vocabulary: VocabularyItem;
  onWordClick?: (word: string) => void;
}

const VocabularyCard = ({ vocabulary, onWordClick }: VocabularyCardProps) => {
  return (
    <Card className="shadow-md hover:shadow-lg transition-shadow duration-200">
      <CardHeader>
        <CardTitle>
          <div className="flex items-start justify-between gap-2">
            <span 
              className="text-lg text-primary font-semibold break-words flex-1"
              onClick={() => onWordClick && onWordClick(vocabulary.word)}
              style={{ cursor: onWordClick ? 'pointer' : 'default' }}
            >
              {vocabulary.word}
            </span>
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
          <span className="font-medium">Definition:</span> <ClickableText text={vocabulary.definition} onWordClick={onWordClick} />
        </p>
        <p className="text-sm">
          <span className="font-medium">Example:</span> <em>"<ClickableText text={vocabulary.example} onWordClick={onWordClick} />"</em>
        </p>
      </CardContent>
    </Card>
  );
};

export default VocabularyCard;
