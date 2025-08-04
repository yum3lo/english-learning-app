import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { BookOpen, Zap } from 'lucide-react';
import MediaCarousel from '@/components/MediaCarousel';
import { type MediaItem } from '@/components/MediaCard';
import articlesData from '@/data/articles.json';
import { useToast } from '@/hooks/use-toast';
import FilterSearch from '@/components/FilterSearch';
import PageHeader from '@/components/PageHeader';
import EmptyState from '@/components/EmptyState';
import LoadingSpinner from '@/components/LoadingSpinner';
import MediaLayout from '@/layouts/MediaLayout';

const ReadingPage = () => {
  const { user } = useAuth();
  const [newest, setNewest] = useState<MediaItem[]>([]);
  const [all, setAll] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const { toast } = useToast();

  useEffect(() => {
    const fetchArticles = async () => {
      setLoading(true);
      try {
        const mockArticles: MediaItem[] = articlesData as MediaItem[];
        const userLevel = user?.cefrLevel || 'B2';
        const userInterests = user?.fieldsOfInterest || [];
        // filter articles based on user level and interests
        const recommended = mockArticles.filter(article => {
          const levelMatch = article.cefrLevel === userLevel;
          const interestMatch = userInterests.some(interest => 
            article.categories.includes(interest)
          );
          return levelMatch && interestMatch;
        });
        
        const sortedByDate = [...recommended].sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        
        setNewest(sortedByDate.slice(0, 6));
        setAll(recommended);
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

    fetchArticles();
  }, [user]);

  const filtered = all.filter(article => {
    const matchesSearch =
      !searchTerm ||
      article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      article.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || article.categories.includes(selectedCategory);

    return matchesSearch && matchesCategory;
  });

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