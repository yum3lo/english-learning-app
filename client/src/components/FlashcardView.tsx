import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CheckCircle, XCircle, Shuffle, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';
import { type VocabularyItem } from '@/data/vocabulary';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import PronunciationButton from './PronunciationButton';
import EmptyState from './EmptyState';
import { STAGE_CONFIG } from '@/lib/stage';
import { previewInterval } from '@/lib/srs';
import { cn } from '@/lib/utils';
import leaves from '@/assets/leaves.png';

interface FlashcardViewProps {
  vocabulary: VocabularyItem[];
}

type FlashcardMode = 'word' | 'definition';

interface DifficultyButton {
  label: string;
  quality: number;
  bgClass: string;
  textClass: string;
  borderClass: string;
}

const DIFFICULTY_BUTTONS: DifficultyButton[] = [
  { label: 'Again', quality: 1, bgClass: 'bg-destructive/10', textClass: 'text-destructive', borderClass: 'border-destructive/30' },
  { label: 'Hard', quality: 3, bgClass: 'bg-accent/10', textClass: 'text-accent', borderClass: 'border-accent/30' },
  { label: 'Good', quality: 4, bgClass: 'bg-secondary/10', textClass: 'text-secondary', borderClass: 'border-secondary/30' },
  { label: 'Easy', quality: 5, bgClass: 'bg-bloom/10', textClass: 'text-bloom', borderClass: 'border-bloom/30' },
];

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

interface RevealAndGradeProps {
  vocabulary: VocabularyItem;
  revealLabel: string;
  correctAnswerNode: React.ReactNode;
  isCorrect: boolean | null;
  isSubmitting: boolean;
  onGrade: (quality: number) => void;
}

const RevealAndGrade = ({ vocabulary, revealLabel, correctAnswerNode, isCorrect, isSubmitting, onGrade }: RevealAndGradeProps) => (
  <div className="space-y-4">
    <div className={cn('flex items-center justify-center gap-2 p-3 rounded-lg', isCorrect ? 'bg-secondary/10 text-secondary' : 'bg-destructive/10 text-destructive')}>
      {isCorrect ? <CheckCircle className="h-5 w-5" /> : <XCircle className="h-5 w-5" />}
      <span className="font-medium">{isCorrect ? 'Correct!' : 'Not quite'}</span>
    </div>

    <div className="space-y-2 text-sm text-center">
      <p><strong>{revealLabel}</strong> {correctAnswerNode}</p>
    </div>

    <div>
      <p className="text-sm tracking-wide text-muted-foreground text-center mb-2">
        After revealing, how did it feel?
      </p>
      <div className="grid grid-cols-4 gap-2">
        {DIFFICULTY_BUTTONS.map(btn => (
          <button
            key={btn.label}
            onClick={() => onGrade(btn.quality)}
            disabled={isSubmitting}
            className={cn(
              'rounded-lg border py-2 px-1 text-center text-sm font-medium transition-opacity hover:opacity-80 disabled:opacity-50',
              btn.bgClass, btn.textClass, btn.borderClass
            )}
          >
            {btn.label}
            <span className="block text-xs opacity-80 font-normal">
              {previewInterval(vocabulary, btn.quality)} day{previewInterval(vocabulary, btn.quality) === 1 ? '' : 's'}
            </span>
          </button>
        ))}
      </div>
    </div>
  </div>
);

const FlashcardView = ({ vocabulary }: FlashcardViewProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [shuffledVocabulary, setShuffledVocabulary] = useState<VocabularyItem[]>([]);
  const [mode, setMode] = useState<FlashcardMode>('definition');
  const [userAnswer, setUserAnswer] = useState('');
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [answeredCards, setAnsweredCards] = useState<Map<string, boolean>>(new Map());
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { reviewWord } = useAuth();
  const { toast } = useToast();

  //order-independent identity for "this session's word set" - grading a word updates its metadata (and can shift due-date order)
  // without changing the actual set of words being practiced
  // mode is deliberately excluded (switching modes must not reset progress or let the same word be graded twice per cycle)
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
    setIsCorrect(null);
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
    return currentCard?.wordId;
  };

  const isCurrentCardAnswered = () => {
    return answeredCards.has(getCurrentCardKey());
  };

  const checkAnswer = () => {
    if (!userAnswer.trim() || isCurrentCardAnswered()) return;

    const currentCard = getCurrentCard();
    const correctAnswer = mode === 'word' ? currentCard.word : currentCard.definition;
    const userAnswerNormalized = userAnswer.toLowerCase().trim();
    const correctAnswerNormalized = correctAnswer.toLowerCase();

    let correct = false;

    if (mode === 'word') {
      correct = userAnswerNormalized === correctAnswerNormalized;
    } else {
      const userWords = userAnswerNormalized.split(/\s+/).filter(word => word.length > 2);
      const correctWords = correctAnswerNormalized.split(/\s+/).filter(word => word.length > 2);

      // correct if at least 60% of important words match, later to replace with AI checking
      const matchingWords = userWords.filter(word =>
        correctWords.some(correctWord =>
          correctWord.includes(word) || word.includes(correctWord)
        )
      );

      correct = matchingWords.length >= Math.ceil(correctWords.length * 0.6) && matchingWords.length >= 2;
    }

    // this is a hint only - the actual SRS quality comes from the difficulty button the user picks next
    setIsCorrect(correct);
    setShowResult(true);
  };

  const goToCard = (index: number) => {
    setCurrentIndex(index);
    setUserAnswer('');
    setShowResult(false);
    setIsCorrect(null);
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
        description: `You scored ${score + 1} out of ${totalAnswered + 1} answered cards.`,
      });
    }
    goToCard(currentIndex < shuffledVocabulary.length - 1 ? currentIndex + 1 : 0);
  };

  const handleGrade = async (quality: number) => {
    if (isCurrentCardAnswered() || isSubmitting) return;

    const currentCard = getCurrentCard();
    const cardKey = getCurrentCardKey();
    const wasGood = quality >= 4;

    setIsSubmitting(true);
    try {
      await reviewWord(currentCard.wordId, quality);
      setAnsweredCards(prev => new Map([...prev, [cardKey, wasGood]]));
      toast({
        title: quality === 1 ? "No worries!" : "Progress saved",
        description: quality === 1 ? "This word will come back around soon." : "Nicely done — see you next time it's due.",
      });
      advanceToNextCard();
    } catch (error) {
      // AuthContext.reviewWord already surfaces a toast on failure
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleShuffle = () => {
    const shuffled = [...shuffledVocabulary].sort(() => Math.random() - 0.5);
    setShuffledVocabulary(shuffled);
    setCurrentIndex(0);
    setUserAnswer('');
    setShowResult(false);
    setIsCorrect(null);
  };

  const handleModeChange = (newMode: FlashcardMode) => {
    setMode(newMode);
    setUserAnswer('');
    setShowResult(false);
    setIsCorrect(null);
  };

  const handleResetSession = () => {
    localStorage.removeItem(sessionKey);
    setAnsweredCards(new Map());
    setCurrentIndex(0);
    setUserAnswer('');
    setShowResult(false);
    setIsCorrect(null);
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

        {showResult && (
          <RevealAndGrade
            vocabulary={currentCard}
            revealLabel={mode === 'word' ? 'Correct answer:' : 'Correct definition:'}
            correctAnswerNode={mode === 'word' ? currentCard.word : currentCard.definition}
            isCorrect={isCorrect}
            isSubmitting={isSubmitting}
            onGrade={handleGrade}
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
