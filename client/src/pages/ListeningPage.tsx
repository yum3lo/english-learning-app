import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Headphones, Zap } from 'lucide-react';
import MediaCarousel from '@/components/MediaCarousel';
import { type MediaItem } from '@/components/MediaCard';
import videosData from '@/data/videos.json';
import { useToast } from '@/hooks/use-toast';
import FilterSearch from '@/components/FilterSearch';
import PageHeader from '@/components/PageHeader';
import EmptyState from '@/components/EmptyState';
import LoadingSpinner from '@/components/LoadingSpinner';
import MediaLayout from '@/layouts/MediaLayout';
import { categorizeDuration } from '@/constants/categories';

const ListeningPage = () => {
  const { user } = useAuth();
  const [newest, setNewest] = useState<MediaItem[]>([]);
  const [all, setAll] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedDuration, setSelectedDuration] = useState<string>('all');

  const { toast } = useToast();

  useEffect(() => {
    const fetchVideos = async () => {
      setLoading(true);
      try {
        const mockVideos: MediaItem[] = videosData as MediaItem[];
        const userLevel = user?.cefrLevel || 'B2';
        const userInterests = user?.fieldsOfInterest || [];
        
        // filter videos based on user level and interests
        const recommended = mockVideos.filter(video => {
          const levelMatch = video.cefrLevel === userLevel;
          const interestMatch = userInterests.some(interest => 
            video.categories.includes(interest)
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
          title: "Error fetching videos",
          description: "There was an error fetching videos. Please try again later.",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchVideos();
  }, [user]);

  const filtered = all.filter(video => {
    const matchesSearch =
      !searchTerm ||
      video.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      video.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || video.categories.includes(selectedCategory);
    const matchesDuration = selectedDuration === 'all' || 
      (video.duration && categorizeDuration(video.duration) === selectedDuration);

    return matchesSearch && matchesCategory && matchesDuration;
  });

  if (loading) {
    return <LoadingSpinner message="Loading videos..." />;
  }

  return (
    <MediaLayout
      header={
        <PageHeader
          icon={Headphones}
          title="Listening Practice"
          description="Improve your listening comprehension with curated videos for your level and preferences."
        />
      }
      newestCarousel={
        newest.length > 0 ? (
          <MediaCarousel
            title="Newest Videos"
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
          selectedDuration={selectedDuration}
          setSelectedDuration={setSelectedDuration}
          filteredCount={filtered.length}
          mediaType="videos"
        />
      }
      mainContent={
        <>
          <MediaCarousel
            title="All Videos"
            items={filtered}
          />

          {filtered.length === 0 && (
            <EmptyState
              title="No videos found"
              description="Try adjusting your search criteria or filters to find more videos that match your interests."
            />
          )}
        </>
      }
    />
  );
};

export default ListeningPage;
