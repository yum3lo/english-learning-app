import { type VocabularyItem } from '@/data/vocabulary';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import PronunciationButton from './PronunciationButton';
import ClickableText from './ClickableText';
import { daysBetween, isDue } from '@/lib/srs';
import { STAGE_CONFIG } from '@/lib/stage';
import { cn } from '@/lib/utils';

interface VocabularyCardProps {
  vocabulary: VocabularyItem;
  onWordClick?: (word: string, sentence?: string, mediaType?: VocabularyItem['sourceMediaType']) => void;
}

const SOURCE_LABELS: Record<NonNullable<VocabularyItem['sourceMediaType']>, string> = {
  article: 'In this article',
  video: 'In this video',
};

const getStatusLine = (vocabulary: VocabularyItem): { text: string; className: string } => {
  if (isDue(vocabulary.nextReviewDate)) {
    return { text: 'Due to water today', className: 'text-accent' };
  }
  if (vocabulary.repetitions === 0) {
    return { text: 'Just planted', className: 'text-muted-foreground' };
  }
  const days = daysBetween(new Date(), new Date(vocabulary.nextReviewDate));
  if (vocabulary.stage === 'bloomed') {
    return { text: `Mastered · review in ${days} days`, className: 'text-muted-foreground' };
  }
  return { text: `Review in ${days} days`, className: 'text-muted-foreground' };
};

const VocabularyCard = ({ vocabulary, onWordClick }: VocabularyCardProps) => {
  const stage = STAGE_CONFIG[vocabulary.stage];
  const StageIcon = stage.icon;
  const filledPips = vocabulary.stage === 'bloomed' ? 4 : Math.min(vocabulary.repetitions, 4);
  const status = getStatusLine(vocabulary);
  const hasPronunciation = vocabulary.pronunciation && vocabulary.pronunciation !== 'No pronunciation available';

  return (
    <Card className={cn('shadow-md hover:shadow-lg transition-shadow duration-200 border-t-[3px]', stage.borderClass)}>
      <CardHeader className="p-4 sm:p-5">
        <CardTitle>
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-1 flex-1 min-w-0">
              <span
                className="text-lg text-bloom font-semibold break-words"
                onClick={() => onWordClick && onWordClick(vocabulary.word, vocabulary.sourceSentence, vocabulary.sourceMediaType)}
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
            <StageIcon
              className={cn('w-4 h-4 shrink-0 mt-1', stage.iconColorClass)}
              aria-label={stage.label}
            >
              <title>{stage.label}</title>
            </StageIcon>
          </div>
        </CardTitle>
        <CardDescription>
          <span className="text-sm font-mono">
            {hasPronunciation ? `${vocabulary.pronunciation} · ${vocabulary.partOfSpeech}` : vocabulary.partOfSpeech}
          </span>
        </CardDescription>
      </CardHeader>
      <CardContent className="p-4 sm:p-5 pt-0 sm:pt-0 space-y-3">
        <p className="text-sm line-clamp-2">
          <ClickableText text={vocabulary.definition} onWordClick={onWordClick} />
        </p>

        {vocabulary.sourceSentence && (
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              {vocabulary.sourceMediaType ? SOURCE_LABELS[vocabulary.sourceMediaType] : 'In context'}
            </p>
            <p className="border-l-[3px] border-accent pl-3 text-sm italic text-muted-foreground line-clamp-2">
              "{vocabulary.sourceSentence}"
            </p>
          </div>
        )}

        <div className="flex gap-1">
          {[0, 1, 2, 3].map(i => (
            <span
              key={i}
              className={cn('flex-1 h-1 rounded-full', i < filledPips ? stage.pipFilledClass : 'bg-border')}
            />
          ))}
        </div>

        <p className={cn('text-sm', status.className)}>{status.text}</p>
      </CardContent>
    </Card>
  );
};

export default VocabularyCard;