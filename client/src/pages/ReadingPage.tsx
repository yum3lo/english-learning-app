import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { BookOpen, RefreshCcw } from 'lucide-react';
import MediaGrid from '@/components/MediaGrid';
import { type MediaItem } from '@/components/MediaCard';
import { useToast } from '@/hooks/use-toast';
import FilterSearch from '@/components/FilterSearch';
import PageHeader from '@/components/PageHeader';
import EmptyState from '@/components/EmptyState';
import LoadingSpinner from '@/components/LoadingSpinner';
import MediaLayout from '@/layouts/MediaLayout';
import { Button } from '@/components/ui/button';
import { mediaAPI } from '@/services/api';

const ReadingPage = () => {
  const { user } = useAuth();
  const [all, setAll] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const { toast } = useToast();
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const gridEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchArticles = async () => {
      setLoading(true);
      try {
        const response = await mediaAPI.getRecommendations({
          type: 'article',
          limit: 20,
          page: 1
        });
        if (response.success) {
          setAll(response.recommendations);
          setPage(1);
          setHasMore(response.pagination.page < response.pagination.totalPages);
        } else {
          throw new Error('Failed to fetch articles');
        }
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Error fetching articles",
          description: "There was an error fetching articles. Please try again later.",
        });
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchArticles();
    }
  }, [user, toast]);

  const filtered = all.filter(article => {
    const matchesSearch =
      !searchTerm ||
      article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      article.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || article.categories.includes(selectedCategory);

    return matchesSearch && matchesCategory;
  });

  const handleLoadMore = async () => {
    setIsFetchingMore(true);
    try {
      const nextPage = page + 1;
      const response = await mediaAPI.getRecommendations({
        type: 'article',
        limit: 20,
        page: nextPage
      });

      if (response.success && response.recommendations.length > 0) {
        setAll(prev => [...prev, ...response.recommendations]);
        setPage(nextPage);
        setHasMore(response.pagination.page < response.pagination.totalPages);
        toast({
          title: `${response.recommendations.length} more articles loaded`,
          description: 'Scroll down to see them.',
        });
        // the new cards render at the end of the grid, below whatever was already on screen -
        // without this, "Load more" looks like it did nothing since nothing visible changes
        requestAnimationFrame(() => {
          gridEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
        });
      } else {
        setHasMore(false);
        toast({
          title: 'No more articles',
          description: "You've reached the end of the available articles. New ones are added automatically every few hours.",
        });
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error fetching more articles',
        description: 'There was a problem loading more articles. Try again later.'
      });
    } finally {
      setIsFetchingMore(false);
    }
  };

  if (loading) {
    return <LoadingSpinner message="Loading articles..." />;
  }

  return (
    <MediaLayout
      header={
        <PageHeader
          icon={BookOpen}
          title="Reading Practice"
          description="Curated articles matched to your level and interests."
        />
      }
      mainContent={
        <>
          <div className="flex flex-col lg:flex-row lg:items-center gap-4 mb-6">
            <FilterSearch
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              selectedCategory={selectedCategory}
              setSelectedCategory={setSelectedCategory}
              filteredCount={filtered.length}
              mediaType="articles"
            />
            <Button
              onClick={handleLoadMore}
              disabled={isFetchingMore || !hasMore}
              aria-label={isFetchingMore ? 'Loading more articles' : 'Load more articles'}
              variant="secondary"
            >
              <RefreshCcw className="w-4 h-4" />
              <span className="hidden sm:inline">{isFetchingMore ? 'Loading...' : 'Load more'}</span>
            </Button>
          </div>

          <div className="mb-8">
            <MediaGrid items={filtered} />
            <div ref={gridEndRef} />
          </div>

          {filtered.length === 0 && (
            <EmptyState
              title="No articles found"
              description={all.length === 0
                ? "New articles are added automatically every few hours - check back soon."
                : "Try adjusting your search criteria or filters to find more articles that match your interests."}
            />
          )}
        </>
      }
    />
  );
};

export default ReadingPage;