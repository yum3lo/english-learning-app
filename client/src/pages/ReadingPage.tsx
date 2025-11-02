import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { BookOpen, Zap } from 'lucide-react';
import MediaCarousel from '@/components/MediaCarousel';
import { type MediaItem } from '@/components/MediaCard';
import { useToast } from '@/hooks/use-toast';
import FilterSearch from '@/components/FilterSearch';
import PageHeader from '@/components/PageHeader';
import EmptyState from '@/components/EmptyState';
import LoadingSpinner from '@/components/LoadingSpinner';
import MediaLayout from '@/layouts/MediaLayout';
import { mediaAPI } from '@/services/api';

const ReadingPage = () => {
  const { user } = useAuth();
  const [newest, setNewest] = useState<MediaItem[]>([]);
  const [all, setAll] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const { toast } = useToast();
  const [isFetchingMore, setIsFetchingMore] = useState(false);

  useEffect(() => {
    const fetchArticles = async () => {
      setLoading(true);
      try {
        const response = await mediaAPI.getRecommendations({
          type: 'article',
          limit: 20
        })

        if (response.success) {
          const articles = response.recommendations;
          const sortedByDate = [...articles].sort((a, b) => 
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
          
          setNewest(sortedByDate.slice(0, 6));
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
        const sortedByDate = [...combined].sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );

        setNewest(sortedByDate.slice(0, 6));
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
          description="Enhance your reading comprehension with curated articles for your level and preferences."
        />
      }
      newestCarousel={
        newest.length > 0 ? (
          <MediaCarousel
            title="Newest Articles"
            items={newest}
            variant="carousel"
            icon={Zap}
            showMobileIndicators={true}
          />
        ) : undefined
      }
      sidebar={
        <FilterSearch
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          selectedCategory={selectedCategory}
          setSelectedCategory={setSelectedCategory}
          filteredCount={filtered.length}
          mediaType="articles"
        />
      }
      mainContent={
        <>
          <div className="mb-8">
            <MediaCarousel
              title="All Articles"
              items={filtered}
              showLoadMore={true}
              isLoadingMore={isFetchingMore}
              onLoadMore={handleLoadMore}
            />
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