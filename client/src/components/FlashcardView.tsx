import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ChevronLeft, ChevronRight, CheckCircle, XCircle, Shuffle, RefreshCw } from 'lucide-react';
import { type VocabularyItem } from '@/data/vocabulary';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import PronunciationButton from './PronunciationButton';
import EmptyState from './EmptyState';

interface FlashcardViewProps {
  vocabulary: VocabularyItem[];
}

type FlashcardMode = 'word' | 'definition';

interface FlashcardProps {
  vocabulary: VocabularyItem;
  mode: FlashcardMode;
  userAnswer: string;
  onAnswerChange: (answer: string) => void;
  onSubmit: () => void;
  showResult: boolean;
  isCorrect: boolean | null;
  isAnswered: boolean;
}

const Flashcard = ({ vocabulary, mode, userAnswer, onAnswerChange, onSubmit, showResult, isCorrect, isAnswered }: FlashcardProps) => {
  const handleEnter = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !showResult && !isAnswered) {
      onSubmit();
    }
  };

  return (
    <Card className="h-96 w-full max-w-md mx-auto transition-all duration-300 hover:shadow-lg">
      <CardContent className="flex flex-col justify-center items-center h-full p-6 text-center space-y-4">
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
                <Button onClick={onSubmit} disabled={!userAnswer.trim()} className="w-full">
                  Check Answer
                </Button>
              ) : isAnswered && !showResult ? (
                <div className="text-center text-sm text-muted-foreground p-2">
                  Already answered
                </div>
              ) : (
                <div className="space-y-3">
                  <div className={`flex items-center justify-center gap-2 p-3 rounded-lg ${
                    isCorrect ? 'bg-muted/50 text-secondary' : 'bg-primary/50 text-destructive'
                  }`}>
                    {isCorrect ? <CheckCircle className="h-5 w-5" /> : <XCircle className="h-5 w-5" />}
                    <span className="font-medium">
                      {isCorrect ? 'Correct! +1 point' : 'Incorrect'}
                    </span>
                  </div>
                  
                  <div className="space-y-2">
                    <p className="text-sm"><strong>Correct answer:</strong> {vocabulary.word}</p>
                    <PronunciationButton
                      word={vocabulary.word}
                      pronunciation={vocabulary.pronunciation}
                      showPronunciation={true}
                    />
                    <p className="text-sm"><strong>Example:</strong> <em>"{vocabulary.example}"</em></p>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-4 w-full">
            <div className="space-y-2">
              <h1 className="text-primary">{vocabulary.word}</h1>
              <p className="italic">{vocabulary.partOfSpeech}</p>
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
                <Button onClick={onSubmit} disabled={!userAnswer.trim()} className="w-full">
                  Check Answer
                </Button>
              ) : isAnswered && !showResult ? (
                <div className="text-center text-sm text-muted-foreground p-2">
                  Already answered
                </div>
              ) : (
                <div className="space-y-3">
                  <div className={`flex items-center justify-center gap-2 p-3 rounded-lg ${
                    isCorrect ? 'bg-muted/50 text-secondary' : 'bg-primary/50 text-destructive'
                  }`}>
                    {isCorrect ? <CheckCircle className="h-5 w-5" /> : <XCircle className="h-5 w-5" />}
                    <span className="font-medium">
                      {isCorrect ? 'Correct! +1 point' : 'Incorrect'}
                    </span>
                  </div>
                  
                  <div className="space-y-2">
                    <p className="text-sm"><strong>Correct definition:</strong> {vocabulary.definition}</p>
                    <p className="text-sm"><strong>Example:</strong> <em>"{vocabulary.example}"</em></p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

const FlashcardView = ({ vocabulary }: FlashcardViewProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [shuffledVocabulary, setShuffledVocabulary] = useState<VocabularyItem[]>([]);
  const [mode, setMode] = useState<FlashcardMode>('definition');
  const [userAnswer, setUserAnswer] = useState('');
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [answeredCards, setAnsweredCards] = useState<Map<string, boolean>>(new Map());
  
  const { user, updateUser } = useAuth();
  const { toast } = useToast();

  // unique session key for the vocabulary set and mode
  const sessionKey = `flashcards_${mode}_${vocabulary.map(v => v.word).join('_').slice(0, 50)}`;

  const score = Array.from(answeredCards.values()).filter(Boolean).length;
  const totalAnswered = answeredCards.size;

  useEffect(() => {
    const shuffled = [...vocabulary].sort(() => Math.random() - 0.5);
    setShuffledVocabulary(shuffled);
    
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
  }, [vocabulary, sessionKey]);

  // saving answered cards to localStorage whenever it changes
  useEffect(() => {
    if (answeredCards.size > 0) {
      const cardsObject = Object.fromEntries(answeredCards);
      localStorage.setItem(sessionKey, JSON.stringify(cardsObject));
    }
  }, [answeredCards, sessionKey]);

  const getCurrentCardKey = () => {
    const currentCard = shuffledVocabulary[currentIndex];
    return `${currentCard?.word}_${mode}`;
  };

  const isCurrentCardAnswered = () => {
    return answeredCards.has(getCurrentCardKey());
  };

  const checkAnswer = () => {
    if (!userAnswer.trim() || isCurrentCardAnswered()) return;

    const currentCard = shuffledVocabulary[currentIndex];
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
    
    setIsCorrect(correct);
    setShowResult(true);
    
    const cardKey = getCurrentCardKey();
    setAnsweredCards(prev => new Map([...prev, [cardKey, correct]]));
    
    if (correct) {
      if (user) {
        updateUser({ points: (user.points || 0) + 1 });
      }
      toast({
        title: "Correct!",
        description: "You earned 1 point!",
      });
    }
  };

  const handleNext = () => {
    if (currentIndex < shuffledVocabulary.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      toast({
        title: "Flashcard session complete!",
        description: `You scored ${score} out of ${totalAnswered} answered cards.`,
      });
      setCurrentIndex(0);
    }
    
    setUserAnswer('');
    setShowResult(false);
    setIsCorrect(null);
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    } else {
      setCurrentIndex(shuffledVocabulary.length - 1);
    }
    
    setUserAnswer('');
    setShowResult(false);
    setIsCorrect(null);
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
    // answered cards are cleared when mode changes
    setAnsweredCards(new Map());
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

  const currentCard = shuffledVocabulary[currentIndex];

  return (
    <div className="space-y-6">
      <div className="flex justify-center">
        <div className="bg-primary/30 rounded-lg p-1 flex">
          <Button
            variant={mode === 'definition' ? 'default' : 'none'}
            size="sm"
            onClick={() => handleModeChange('definition')}
          >
            Definition Mode
          </Button>
          <Button
            variant={mode === 'word' ? 'default' : 'none'}
            size="sm"
            onClick={() => handleModeChange('word')}
          >
            Word Mode
          </Button>
        </div>
      </div>

      <div className="text-center">
        <div className="flex justify-between items-center mb-2">
          <p className="text-sm">
            Card {currentIndex + 1} of {shuffledVocabulary.length}
          </p>
          <p className="text-sm font-medium">
            Score: {score}/{totalAnswered} ({totalAnswered} answered)
          </p>
        </div>
        <div className="w-full bg-primary/20 rounded-full h-2">
          <div 
            className="bg-primary h-2 rounded-full transition-all duration-300"
            style={{ width: `${((currentIndex + 1) / shuffledVocabulary.length) * 100}%` }}
          />
        </div>
      </div>

      <div className="flex justify-center">
        <Flashcard
          vocabulary={currentCard}
          mode={mode}
          userAnswer={userAnswer}
          onAnswerChange={setUserAnswer}
          onSubmit={checkAnswer}
          showResult={showResult}
          isCorrect={isCorrect}
          isAnswered={isCurrentCardAnswered()}
        />
      </div>

      <div className="flex justify-center items-center gap-2 md:gap-4 flex-wrap">
        <Button
          variant="outline"
          onClick={handlePrevious}
          disabled={shuffledVocabulary.length <= 1}
          className="flex items-center gap-2"
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
          <div className='hidden md:block'>Shuffle</div>
        </Button>

        <Button
          variant="outline"
          onClick={handleResetSession}
          className="flex items-center gap-2"
          title="Reset progress"
        >
          <RefreshCw className="h-4 w-4" />
          <div className='hidden md:block'>Reset</div>
        </Button>

        <Button
          variant="outline"
          onClick={handleNext}
          disabled={shuffledVocabulary.length <= 1}
          className="flex items-center gap-2"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default FlashcardView;
