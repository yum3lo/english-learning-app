import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ArrowLeft, Zap, Layers } from 'lucide-react';
import FlashcardView from '@/components/FlashcardView';
import { type VocabularyItem, convertLearnedWordsToVocabulary } from '@/data/vocabulary';
import { useToast } from '@/hooks/use-toast';
import PageHeader from '@/components/PageHeader';
import EmptyState from '@/components/EmptyState';
import LoadingSpinner from '@/components/LoadingSpinner';
import { Button } from '@/components/ui/button';
import { isDue } from '@/lib/srs';

const FlashcardsPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [words, setWords] = useState<VocabularyItem[]>([]);

  const { toast } = useToast();

  useEffect(() => {
    const fetchVocabulary = async () => {
      setLoading(true);
      try {
        if (user?.learnedWords && user.learnedWords.length > 0) {
          const userVocabulary = convertLearnedWordsToVocabulary(user.learnedWords);
          const dueOrdered = [...userVocabulary].sort(
            (a, b) => new Date(a.nextReviewDate).getTime() - new Date(b.nextReviewDate).getTime()
          );
          setWords(dueOrdered);
        } else {
          setWords([]);
        }
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Error fetching vocabulary",
          description: "There was an error fetching your vocabulary. Please try again later.",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchVocabulary();
  }, [user, toast]);

  if (loading) {
    return <LoadingSpinner message="Loading flashcards..." />;
  }

  const dueCount = words.filter(w => isDue(w.nextReviewDate)).length;

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 py-8">
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Button>

        <div className="mb-8">
          <PageHeader
            icon={Zap}
            title="Flashcard practice"
            description={
              dueCount > 0
                ? `${dueCount} word${dueCount === 1 ? ' is' : 's are'} due to water today. Let's tend them.`
                : "You're all caught up - review anytime to keep your streak alive."
            }
          />
        </div>

        {words.length > 0 ? (
          <FlashcardView vocabulary={words} />
        ) : (
          <EmptyState
            icon={Layers}
            iconColorClass="text-accent"
            iconBgClass="bg-accent/15"
            title="Nothing to water yet"
            description="Learn a few words on the vocabulary page and they'll show up here, ready to practice."
            action={{ label: 'Go to my garden', to: '/vocabulary' }}
          />
        )}
      </div>
    </div>
  );
};

export default FlashcardsPage;
