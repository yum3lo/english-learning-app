import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CheckCircle, XCircle, AlertTriangle, Shuffle, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';
import { type VocabularyItem } from '@/data/vocabulary';
import { useAuth, type AnswerCheckResult } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import PronunciationButton from './PronunciationButton';
import EmptyState from './EmptyState';
import { STAGE_CONFIG } from '@/lib/stage';
import { cn } from '@/lib/utils';
import leaves from '@/assets/leaves.png';

interface FlashcardViewProps {
  vocabulary: VocabularyItem[];
}

type FlashcardMode = 'word' | 'definition';

const ordinal = (n: number): string => {
  const rem100 = n % 100;
  if (rem100 >= 11 && rem100 <= 13) return `${n}th`;
  switch (n % 10) {
    case 1: return `${n}st`;
    case 2: return `${n}nd`;
    case 3: return `${n}rd`;
    default: return `${n}th`;
  }
};

interface FlashcardProps {
  vocabulary: VocabularyItem;
  mode: FlashcardMode;
  userAnswer: string;
  onAnswerChange: (answer: string) => void;
  onSubmit: () => void;
  showResult: boolean;
  isAnswered: boolean;
  isSubmitting: boolean;
}

const Flashcard = ({ vocabulary, mode, userAnswer, onAnswerChange, onSubmit, showResult, isAnswered, isSubmitting }: FlashcardProps) => {
  const stage = STAGE_CONFIG[vocabulary.stage];
  const StageIcon = stage.icon;

  const handleEnter = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !showResult && !isAnswered && !isSubmitting) {
      onSubmit();
    }
  };

  return (
    <Card className={cn('w-full transition-all duration-300 hover:shadow-lg border-t-[3px]', stage.borderClass)}>
      <CardContent className="p-6 md:p-8 text-center space-y-4">
        <p className="flex items-center justify-center gap-1.5 text-sm text-muted-foreground mb-2">
          <StageIcon className={cn('h-3.5 w-3.5', stage.iconColorClass)} />
          {stage.label} · {ordinal(vocabulary.repetitions + 1)} review
        </p>

        {mode === 'word' ? (
          <div className="space-y-4 w-full">
            <div className="space-y-2">
              <p className="italic text-muted-foreground">{vocabulary.partOfSpeech}</p>
              <p className="text-base md:text-lg">{vocabulary.definition}</p>
            </div>

            <div className="space-y-3 w-full">
              <Input
                value={userAnswer}
                onChange={(e) => onAnswerChange(e.target.value)}
                onKeyDown={handleEnter}
                placeholder="Type the word..."
                disabled={showResult || isAnswered}
                className="text-center text-lg"
              />

              {!showResult && !isAnswered ? (
                <Button onClick={onSubmit} disabled={!userAnswer.trim() || isSubmitting} className="w-full">
                  Check Answer
                </Button>
              ) : isAnswered && !showResult ? (
                <div className="text-center text-sm text-muted-foreground p-2">
                  Already answered
                </div>
              ) : null}
            </div>
          </div>
        ) : (
          <div className="space-y-4 w-full">
            <div className="space-y-2">
              <h1 className="text-bloom">{vocabulary.word}</h1>
              <p className="italic text-muted-foreground">{vocabulary.partOfSpeech}</p>
              <PronunciationButton
                word={vocabulary.word}
                pronunciation={vocabulary.pronunciation}
                showPronunciation={true}
              />
            </div>

            <div className="space-y-3 w-full">
              <Input
                value={userAnswer}
                onChange={(e) => onAnswerChange(e.target.value)}
                onKeyDown={handleEnter}
                placeholder="Type the definition..."
                disabled={showResult || isAnswered}
                className="text-center"
              />

              {!showResult && !isAnswered ? (
                <Button onClick={onSubmit} disabled={!userAnswer.trim() || isSubmitting} className="w-full">
                  Check Answer
                </Button>
              ) : isAnswered && !showResult ? (
                <div className="text-center text-sm text-muted-foreground p-2">
                  Already answered
                </div>
              ) : null}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

const VERDICT_STYLES: Record<AnswerCheckResult['verdict'], { bgClass: string; textClass: string; icon: typeof CheckCircle; title: string }> = {
  correct: { bgClass: 'bg-secondary/10', textClass: 'text-secondary', icon: CheckCircle, title: 'Correct!' },
  partial: { bgClass: 'bg-accent/10', textClass: 'text-accent', icon: AlertTriangle, title: 'So close' },
  incorrect: { bgClass: 'bg-destructive/10', textClass: 'text-destructive', icon: XCircle, title: 'Not quite' },
};

interface AnswerFeedbackProps {
  revealLabel: string;
  correctAnswerNode: React.ReactNode;
  result: AnswerCheckResult;
  onContinue: () => void;
}

const AnswerFeedback = ({ revealLabel, correctAnswerNode, result, onContinue }: AnswerFeedbackProps) => {
  const style = VERDICT_STYLES[result.verdict];
  const Icon = style.icon;
  const title = result.verdict === 'correct' && result.spellingIssue ? 'Right idea!' : style.title;

  return (
    <div className="space-y-4">
      <div className={cn('flex items-center justify-center gap-2 p-3 rounded-lg', style.bgClass, style.textClass)}>
        <Icon className="h-5 w-5" />
        <span className="font-medium">{title}</span>
      </div>

      {result.spellingIssue && result.spellingCorrection && (
        <p className="text-sm text-center text-muted-foreground">
          Watch the spelling — it's <strong>{result.spellingCorrection}</strong>.
        </p>
      )}

      {result.feedback && (
        <p className="text-sm text-center text-muted-foreground">{result.feedback}</p>
      )}

      {result.gradedOffline && (
        <p className="text-xs text-center text-muted-foreground italic">
          Graded offline (couldn't reach the grading service) — a quick match check instead of full meaning grading.
        </p>
      )}

      {result.verdict !== 'correct' && (
        <div className="space-y-2 text-sm text-center">
          <p><strong>{revealLabel}</strong> {correctAnswerNode}</p>
        </div>
      )}

      <p className="text-xs text-center text-muted-foreground">
        {result.scored
          ? `Next review in ${result.interval} day${result.interval === 1 ? '' : 's'}.`
          : "Bonus practice — already reviewed today, so this didn't change your schedule."}
      </p>

      <Button onClick={onContinue} className="w-full">Continue</Button>
    </div>
  );
};

const FlashcardView = ({ vocabulary }: FlashcardViewProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [shuffledVocabulary, setShuffledVocabulary] = useState<VocabularyItem[]>([]);
  const [mode, setMode] = useState<FlashcardMode>('definition');
  const [userAnswer, setUserAnswer] = useState('');
  const [showResult, setShowResult] = useState(false);
  const [checkResult, setCheckResult] = useState<AnswerCheckResult | null>(null);
  const [answeredCards, setAnsweredCards] = useState<Map<string, boolean>>(new Map());
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { checkFlashcardAnswer } = useAuth();
  const { toast } = useToast();

  //order-independent identity for "this session's word set" - grading a word updates its metadata (and can shift due-date order)
  // without changing the actual set of words being practiced
  // mode is deliberately excluded from the key so switching modes doesn't reset session progress -
  // answeredCards itself is keyed per word+mode, so both directions can still be attempted
  const sessionKey = `flashcards_${[...vocabulary].map(v => v.wordId).sort().join('_').slice(0, 50)}`;

  const score = Array.from(answeredCards.values()).filter(Boolean).length;
  const totalAnswered = answeredCards.size;

  useEffect(() => {
    // adopt incoming order as-is (already due-ordered by the caller); use the Shuffle button to randomize
    setShuffledVocabulary(vocabulary);

    const savedAnsweredCards = localStorage.getItem(sessionKey);
    if (savedAnsweredCards) {
      try {
        const parsedCards = JSON.parse(savedAnsweredCards);
        setAnsweredCards(new Map(Object.entries(parsedCards)));
      } catch (error) {
        console.error('Error parsing saved answered cards:', error);
        setAnsweredCards(new Map());
      }
    } else {
      setAnsweredCards(new Map());
    }

    setCurrentIndex(0);
    setUserAnswer('');
    setShowResult(false);
    setCheckResult(null);
    // only reset the session when the actual word set changes, not on every vocabulary re-fetch
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionKey]);

  // saving answered cards to localStorage whenever it changes
  useEffect(() => {
    if (answeredCards.size > 0) {
      const cardsObject = Object.fromEntries(answeredCards);
      localStorage.setItem(sessionKey, JSON.stringify(cardsObject));
    }
  }, [answeredCards, sessionKey]);

  // resolves the displayed card's latest data from the live vocabulary prop (repetitions/stage/
  // interval keep updating as user grades cards, even though shuffledVocabulary only captures order)
  const getCurrentCard = () => {
    const ordered = shuffledVocabulary[currentIndex];
    if (!ordered) return ordered;
    return vocabulary.find(v => v.wordId === ordered.wordId) ?? ordered;
  };

  const getCurrentCardKey = () => {
    const currentCard = shuffledVocabulary[currentIndex];
    return currentCard ? `${currentCard.wordId}:${mode}` : undefined;
  };

  const isCurrentCardAnswered = () => {
    const key = getCurrentCardKey();
    return key !== undefined && answeredCards.has(key);
  };

  const checkAnswer = async () => {
    if (!userAnswer.trim() || isCurrentCardAnswered() || isSubmitting) return;

    const currentCard = getCurrentCard();
    const cardKey = getCurrentCardKey();
    if (!cardKey) return;

    setIsSubmitting(true);
    try {
      const result = await checkFlashcardAnswer(currentCard.wordId, mode, userAnswer);
      setCheckResult(result);
      setShowResult(true);
      setAnsweredCards(prev => new Map([...prev, [cardKey, result.verdict === 'correct']]));
    } catch (error) {
      // AuthContext.checkFlashcardAnswer already surfaces a toast on failure
    } finally {
      setIsSubmitting(false);
    }
  };

  const goToCard = (index: number) => {
    setCurrentIndex(index);
    setUserAnswer('');
    setShowResult(false);
    setCheckResult(null);
  };

  const handleNext = () => {
    goToCard(currentIndex < shuffledVocabulary.length - 1 ? currentIndex + 1 : 0);
  };

  const handlePrevious = () => {
    goToCard(currentIndex > 0 ? currentIndex - 1 : shuffledVocabulary.length - 1);
  };

  const advanceToNextCard = () => {
    if (currentIndex >= shuffledVocabulary.length - 1) {
      toast({
        title: "Flashcard session complete!",
        description: `You scored ${score} out of ${totalAnswered} answered cards.`,
      });
    }
    goToCard(currentIndex < shuffledVocabulary.length - 1 ? currentIndex + 1 : 0);
  };

  const handleShuffle = () => {
    const shuffled = [...shuffledVocabulary].sort(() => Math.random() - 0.5);
    setShuffledVocabulary(shuffled);
    setCurrentIndex(0);
    setUserAnswer('');
    setShowResult(false);
    setCheckResult(null);
  };

  const handleModeChange = (newMode: FlashcardMode) => {
    setMode(newMode);
    setUserAnswer('');
    setShowResult(false);
    setCheckResult(null);
  };

  const handleResetSession = () => {
    localStorage.removeItem(sessionKey);
    setAnsweredCards(new Map());
    setCurrentIndex(0);
    setUserAnswer('');
    setShowResult(false);
    setCheckResult(null);
    toast({
      title: "Session reset!",
      description: "All progress has been cleared. Start fresh!",
    });
  };

  if (shuffledVocabulary.length === 0) {
    return (
      <EmptyState
        title="No vocabulary available for flashcards"
        description="Find unknown words to get started."
      />
    );
  }

  const currentCard = getCurrentCard();

  return (
    <div className="space-y-6">
      <div className="flex justify-center">
        <div className="bg-muted rounded-lg p-1 flex">
          <button
            onClick={() => handleModeChange('definition')}
            className={cn(
              'rounded-md px-4 py-1.5 text-sm font-medium transition-colors',
              mode === 'definition' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'
            )}
          >
            Definition mode
          </button>
          <button
            onClick={() => handleModeChange('word')}
            className={cn(
              'rounded-md px-4 py-1.5 text-sm font-medium transition-colors',
              mode === 'word' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'
            )}
          >
            Word mode
          </button>
        </div>
      </div>

      <img
        src={leaves}
        alt="Leaves Image"
        className="mx-auto my-12 h-auto w-full section-px max-w-sm"
      />

      <div className="text-center max-w-md mx-auto">
        <div className="flex justify-between items-center mb-2">
          <p className="text-sm text-muted-foreground">
            Card {currentIndex + 1} of {shuffledVocabulary.length}
          </p>
          <p className="text-sm text-muted-foreground">
            Score: {score}/{totalAnswered}
          </p>
        </div>
        <div className="w-full bg-border rounded-full h-1.5">
          <div
            className="bg-secondary h-1.5 rounded-full transition-all duration-300"
            style={{ width: `${((currentIndex + 1) / shuffledVocabulary.length) * 100}%` }}
          />
        </div>
      </div>

      <div className="max-w-md mx-auto space-y-4">
        <Flashcard
          vocabulary={currentCard}
          mode={mode}
          userAnswer={userAnswer}
          onAnswerChange={setUserAnswer}
          onSubmit={checkAnswer}
          showResult={showResult}
          isAnswered={isCurrentCardAnswered()}
          isSubmitting={isSubmitting}
        />

        {showResult && checkResult && (
          <AnswerFeedback
            revealLabel={mode === 'word' ? 'Correct answer:' : 'Correct definition:'}
            correctAnswerNode={mode === 'word' ? currentCard.word : currentCard.definition}
            result={checkResult}
            onContinue={advanceToNextCard}
          />
        )}
      </div>

      <div className="flex justify-center items-center gap-2 flex-wrap">
        <Button
          variant="outline"
          onClick={handlePrevious}
          disabled={shuffledVocabulary.length <= 1}
          title="Previous card"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        <Button
          variant="outline"
          onClick={handleShuffle}
          className="flex items-center gap-2"
          title="Shuffle cards"
        >
          <Shuffle className="h-4 w-4" />
          Shuffle
        </Button>

        <Button
          variant="outline"
          onClick={handleResetSession}
          className="flex items-center gap-2"
          title="Reset progress"
        >
          <RefreshCw className="h-4 w-4" />
          Reset
        </Button>

        <Button
          variant="outline"
          onClick={handleNext}
          disabled={shuffledVocabulary.length <= 1}
          title="Next card"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default FlashcardView;
