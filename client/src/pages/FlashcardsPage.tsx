import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ArrowLeft, Zap } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import FlashcardView from '@/components/FlashcardView';
import { type VocabularyItem, vocabularyData } from '@/data/vocabulary';
import { useToast } from '@/hooks/use-toast';
import PageHeader from '@/components/PageHeader';
import EmptyState from '@/components/EmptyState';
import LoadingSpinner from '@/components/LoadingSpinner';
import { Button } from '@/components/ui/button';

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
        const userVocabulary: VocabularyItem[] = Object.values(vocabularyData).flat();
        setWords(userVocabulary);
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
            title="Flashcard Practice"
            description="Test your knowledge with interactive flashcards. Choose between word mode or definition mode to challenge yourself."
          />
        </div>

        {words.length > 0 ? (
          <div className="space-y-6">
            <Card className="bg-primary/30 border-primary">
              <CardHeader>
                <CardTitle>
                  Ready to Practice?
                </CardTitle>
                <CardDescription>
                  You have <span className="font-semibold text-primary">{words.length}</span> vocabulary words available for practice. 
                  Choose your mode and start earning points for correct answers!
                </CardDescription>
              </CardHeader>
            </Card>

            <FlashcardView vocabulary={words} />
          </div>
        ) : (
          <EmptyState
            title="No vocabulary available"
            description="Start learning new words to unlock flashcard practice. Visit the vocabulary section to build your collection."
          />
        )}
      </div>
    </div>
  );
};

export default FlashcardsPage;
