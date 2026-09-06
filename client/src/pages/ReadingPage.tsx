import { useState, useEffect } from 'react';
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

  useEffect(() => {
    const fetchArticles = async (tryGuardianIfEmpty = true) => {
      setLoading(true);
      try {
        const response = await mediaAPI.getRecommendations({
          type: 'article',
          limit: 20
        });
        if (response.success) {
          const articles = response.recommendations;
          if (articles.length === 0 && tryGuardianIfEmpty) {
            const guardianResp = await mediaAPI.fetchGuardianArticles({ limit: 10 });
            if (guardianResp?.success && guardianResp.articles && guardianResp.articles.length > 0) {
              await fetchArticles(false);
              toast({
                title: `${guardianResp.articles.length} new articles added`,
                description: 'New articles fetched.',
              });
              return;
            } else {
              toast({
                title: 'No articles available',
                description: 'No articles could be fetched.',
              });
            }
          }
          setAll(articles);
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
      // requesting server to fetch new articles from Guardian and save only new ones
      const response = await mediaAPI.fetchGuardianArticles({
        category: selectedCategory !== 'all' ? selectedCategory : undefined,
        limit: 10
      });

      if (response?.success && response.articles && response.articles.length > 0) {
        const newArticles = response.articles as any[];
        const combined = [...newArticles, ...all];

        setAll(combined);

        toast({
          title: `${response.articles.length} new articles added`,
          description: 'New articles fetched from The Guardian.',
        });
      } else {
        toast({
          title: 'No new articles',
          description: 'No unseen articles were available from The Guardian.',
        });
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error fetching new articles',
        description: 'There was a problem fetching new articles. Try again later.'
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
              disabled={isFetchingMore}
              aria-label={isFetchingMore ? 'Loading more articles' : 'Load more articles'}
              variant="secondary"
            >
              <RefreshCcw className="w-4 h-4" />
              <span className="hidden sm:inline">{isFetchingMore ? 'Loading...' : 'Load more'}</span>
            </Button>
          </div>

          <div className="mb-8">
            <MediaGrid items={filtered} />
          </div>

          {filtered.length === 0 && (
            <EmptyState
              title="No articles found"
              description="Try adjusting your search criteria or filters to find more articles that match your interests."
            />
          )}
        </>
      }
    />
  );
};

export default ReadingPage;