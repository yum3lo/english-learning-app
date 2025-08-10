import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { BookMarked, ArrowUpDown, Shuffle } from 'lucide-react';
import { Link } from 'react-router-dom';
import VocabularyCard from '@/components/VocabularyCard';
import { type VocabularyItem, vocabularyData } from '@/data/vocabulary';
import { useToast } from '@/hooks/use-toast';
import PageHeader from '@/components/PageHeader';
import EmptyState from '@/components/EmptyState';
import LoadingSpinner from '@/components/LoadingSpinner';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';

const VocabularyPage = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'latest' | 'alphabetical'>('latest');
  const [words, setWords] = useState<VocabularyItem[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const wordsPerPage = 9;

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

  const handleSortChange = (value: 'latest' | 'alphabetical') => {
    setSortBy(value);
    setCurrentPage(1);
  };

  const sortedWords = [...words].sort((a, b) => {
    if (sortBy === 'alphabetical') {
      return a.word.toLowerCase().localeCompare(b.word.toLowerCase());
    }
    return 0;
  });

  // for pagination
  const totalPages = Math.ceil(sortedWords.length / wordsPerPage);
  const startIndex = (currentPage - 1) * wordsPerPage;
  const endIndex = startIndex + wordsPerPage;
  const currentWords = sortedWords.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (loading) {
    return <LoadingSpinner message="Loading your vocabulary..." />;
  }

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <PageHeader
            icon={BookMarked}
            title="My Vocabulary"
            description="Review and practice the words you've learned. Track your progress and master new vocabulary."
          />
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex items-center gap-2">
              <ArrowUpDown className="h-4 w-4" />
              <Select value={sortBy} onValueChange={handleSortChange}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Sort by..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="latest">Most recent</SelectItem>
                  <SelectItem value="alphabetical">Alphabetical</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <Button asChild className="flex items-center gap-2">
              <Link to="/flashcards">
                <Shuffle className="h-4 w-4" />
                Flashcards
              </Link>
            </Button>
          </div>
        </div>

        <div className="space-y-6">
          <p>You have learned <span className="font-semibold text-primary">{sortedWords.length}</span> words so far. Keep up the great work!</p>

          {sortedWords.length > 0 ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {currentWords.map((word, index) => (
                  <VocabularyCard key={`${word.word}-${index}`} vocabulary={word} />
                ))}
              </div>
              
              {totalPages > 1 && (
                <div className="flex justify-center mt-8">
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious 
                          onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                          className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                        />
                      </PaginationItem>
                      
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                        if (
                          page === 1 ||
                          page === totalPages ||
                          (page >= currentPage - 1 && page <= currentPage + 1)
                        ) {
                          return (
                            <PaginationItem key={page}>
                              <PaginationLink
                                onClick={() => handlePageChange(page)}
                                isActive={currentPage === page}
                                className="cursor-pointer"
                              >
                                {page}
                              </PaginationLink>
                            </PaginationItem>
                          );
                        } else if (page === currentPage - 2 || page === currentPage + 2) {
                          return (
                            <PaginationItem key={page}>
                              <PaginationEllipsis />
                            </PaginationItem>
                          );
                        }
                        return null;
                      })}
                      
                      <PaginationItem>
                        <PaginationNext 
                          onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                          className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              )}
            </>
          ) : (
            <EmptyState
              title="No vocabulary found"
              description="Start learning new words to build your vocabulary collection."
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default VocabularyPage;