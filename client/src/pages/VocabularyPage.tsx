import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Sprout, ArrowUpDown, Search, type LucideIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import VocabularyCard from '@/components/VocabularyCard';
import DictionaryPopup from '@/components/DictionaryPopup';
import { type VocabularyItem, type MasteryStage, convertLearnedWordsToVocabulary } from '@/data/vocabulary';
import { useDictionary } from '@/hooks/useDictionary';
import { useToast } from '@/hooks/use-toast';
import PageHeader from '@/components/PageHeader';
import EmptyState from '@/components/EmptyState';
import LoadingSpinner from '@/components/LoadingSpinner';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { isDue } from '@/lib/srs';
import { STAGE_CONFIG } from '@/lib/stage';
import { cn } from '@/lib/utils';

type StageFilter = 'all' | MasteryStage;

interface StageFilterOption {
  value: StageFilter;
  label: string;
  icon?: LucideIcon;
  colorClass?: string;
}

const STAGE_FILTERS: StageFilterOption[] = [
  { value: 'all', label: 'All' },
  { value: 'seedling', label: 'Seedling', icon: STAGE_CONFIG.seedling.icon, colorClass: STAGE_CONFIG.seedling.iconColorClass },
  { value: 'growing', label: 'Growing', icon: STAGE_CONFIG.growing.icon, colorClass: STAGE_CONFIG.growing.iconColorClass },
  { value: 'bloomed', label: 'Bloomed', icon: STAGE_CONFIG.bloomed.icon, colorClass: STAGE_CONFIG.bloomed.iconColorClass },
];

const STAGE_EMPTY_COPY: Record<MasteryStage, { title: string; description: string; action: { label: string; to: string } }> = {
  seedling: {
    title: 'No seedlings right now',
    description: 'Every new word starts here. Read an article or video and tap a word to plant a fresh seed.',
    action: { label: 'Browse articles', to: '/reading' },
  },
  growing: {
    title: 'Nothing growing yet',
    description: 'Answer a seedling correctly in flashcards and watch it start growing.',
    action: { label: 'Practice flashcards', to: '/flashcards' },
  },
  bloomed: {
    title: 'Nothing has bloomed yet',
    description: 'Keep practicing, a word blooms after a few solid reviews in a row.',
    action: { label: 'Practice flashcards', to: '/flashcards' },
  },
};

const VocabularyPage = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'latest' | 'alphabetical'>('latest');
  const [words, setWords] = useState<VocabularyItem[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [stageFilter, setStageFilter] = useState<StageFilter>('all');
  const wordsPerPage = 9;

  const {
    selectedWord,
    dictionaryData,
    isDictionaryOpen,
    isLoadingDictionary,
    isAddingToLearned,
    handleWordClick,
    handleAddToLearned,
    handleCloseDictionary,
  } = useDictionary();

  const { toast } = useToast();

  useEffect(() => {
    const fetchVocabulary = async () => {
      setLoading(true);
      try {
        if (user?.learnedWords && user.learnedWords.length > 0) {
          const userVocabulary = convertLearnedWordsToVocabulary(user.learnedWords);
          setWords(userVocabulary);
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

  const handleSortChange = (value: 'latest' | 'alphabetical') => {
    setSortBy(value);
    setCurrentPage(1);
  };

  const handleStageFilterChange = (value: StageFilter) => {
    setStageFilter(value);
    setCurrentPage(1);
  };

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const sortedWords = [...words].sort((a, b) => {
    if (sortBy === 'alphabetical') {
      return a.word.toLowerCase().localeCompare(b.word.toLowerCase());
    }
    return 0;
  });

  const stageCounts = {
    seedling: words.filter(w => w.stage === 'seedling').length,
    growing: words.filter(w => w.stage === 'growing').length,
    bloomed: words.filter(w => w.stage === 'bloomed').length,
  };
  const dueCount = words.filter(w => isDue(w.nextReviewDate)).length;
  const streakCount = user?.streakCount ?? 0;

  const filteredWords = sortedWords
    .filter(w => stageFilter === 'all' || w.stage === stageFilter)
    .filter(w => w.word.toLowerCase().includes(searchTerm.trim().toLowerCase()));

  // for pagination
  const totalPages = Math.ceil(filteredWords.length / wordsPerPage);
  const startIndex = (currentPage - 1) * wordsPerPage;
  const endIndex = startIndex + wordsPerPage;
  const currentWords = filteredWords.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (loading) {
    return <LoadingSpinner message="Loading your vocabulary garden..." />;
  }

  return (
    <div className="min-h-screen">
      <div className="container mx-auto section-px py-8">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
          <PageHeader
            icon={Sprout}
            title="My vocabulary garden"
            description="Every word you save takes root here. Tend it to watch it bloom."
          />
          <Link to="/flashcards" className="btn-primary whitespace-nowrap">
            Practice flashcards
          </Link>
        </div>

        {words.length > 0 && (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
              <div className="rounded-lg p-3 bg-secondary/15">
                <div className="text-sm text-muted-foreground">Words planted</div>
                <div className="text-2xl font-medium text-foreground mt-0.5">{words.length}</div>
              </div>
              <div className="rounded-lg p-3 bg-card border border-border">
                <div className="text-sm text-muted-foreground">Bloomed</div>
                <div className="text-2xl font-medium text-bloom mt-0.5">{stageCounts.bloomed}</div>
              </div>
              <div className="rounded-lg p-3 bg-card border border-border">
                <div className="text-sm text-muted-foreground">Day streak</div>
                <div className="text-2xl font-medium text-accent mt-0.5">{streakCount}</div>
              </div>
              <div className="rounded-lg p-3 bg-card border border-border">
                <div className="text-sm text-muted-foreground">Due to water</div>
                <div className="text-2xl font-medium text-foreground mt-0.5">{dueCount}</div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
              <div className="flex flex-wrap gap-2">
                {STAGE_FILTERS.map(filter => {
                  const isActive = stageFilter === filter.value;
                  const count = filter.value === 'all' ? words.length : stageCounts[filter.value];
                  const Icon = filter.icon;
                  return (
                    <button
                      key={filter.value}
                      onClick={() => handleStageFilterChange(filter.value)}
                      className={cn(
                        'inline-flex items-center gap-1.5 rounded-full btn-sm font-medium transition-colors',
                        isActive ? 'bg-primary text-primary-foreground' : 'bg-card border border-border text-muted-foreground'
                      )}
                    >
                      {Icon && <Icon className={cn('h-3.5 w-3.5', !isActive && filter.colorClass)} />}
                      {filter.label} {count}
                    </button>
                  );
                })}
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    value={searchTerm}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    placeholder="Search words"
                    className="pl-8 w-full sm:w-[160px]"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <ArrowUpDown className="h-4 w-4 shrink-0" />
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
              </div>
            </div>
          </>
        )}

        {words.length > 0 ? (
          filteredWords.length > 0 ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 card-gap">
                {currentWords.map((word, index) => (
                  <VocabularyCard
                    key={`${word.word}-${index}`}
                    vocabulary={word}
                    onWordClick={handleWordClick}
                  />
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
          ) : searchTerm.trim() ? (
            <EmptyState
              title="Nothing grows here"
              description="No words match that search. Try a different term or clear your filters."
              action={{
                label: 'Clear filters',
                onClick: () => {
                  setSearchTerm('');
                  setStageFilter('all');
                  setCurrentPage(1);
                },
              }}
            />
          ) : stageFilter !== 'all' ? (
            <EmptyState
              icon={STAGE_CONFIG[stageFilter].icon}
              iconColorClass={STAGE_CONFIG[stageFilter].iconColorClass}
              iconBgClass={STAGE_CONFIG[stageFilter].bgTintClass}
              title={STAGE_EMPTY_COPY[stageFilter].title}
              description={STAGE_EMPTY_COPY[stageFilter].description}
              action={STAGE_EMPTY_COPY[stageFilter].action}
            />
          ) : null
        ) : (
          <EmptyState
            icon={Sprout}
            iconColorClass="text-secondary"
            iconBgClass="bg-secondary/15"
            title="Your garden is bare"
            description="Read an article and tap any word to plant your first seed."
            action={{ label: 'Browse articles', to: '/reading' }}
          />
        )}
      </div>

      <DictionaryPopup
        word={selectedWord}
        dictionaryData={dictionaryData}
        isOpen={isDictionaryOpen}
        onClose={handleCloseDictionary}
        onAddToLearned={handleAddToLearned}
        isAddingToLearned={isAddingToLearned}
        isLoading={isLoadingDictionary}
      />
    </div>
  );
};

export default VocabularyPage;