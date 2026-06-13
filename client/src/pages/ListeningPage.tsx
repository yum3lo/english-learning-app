import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Headphones, Zap } from 'lucide-react';
import MediaCarousel from '@/components/MediaCarousel';
import { type MediaItem } from '@/components/MediaCard';
import { useToast } from '@/hooks/use-toast';
import FilterSearch from '@/components/FilterSearch';
import PageHeader from '@/components/PageHeader';
import EmptyState from '@/components/EmptyState';
import LoadingSpinner from '@/components/LoadingSpinner';
import MediaLayout from '@/layouts/MediaLayout';
import { mediaAPI } from '@/services/api';
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
  const [isFetchingMore, setIsFetchingMore] = useState(false);

  useEffect(() => {
    const fetchVideos = async (tryYoutubeIfEmpty = true) => {
      setLoading(true);
      try {
        const response = await mediaAPI.getRecommendations({
          type: 'video',
          limit: 20
        });
        if (response.success) {
          const videos = response.recommendations;
          if (videos.length === 0 && tryYoutubeIfEmpty) {
            const youtubeResp = await mediaAPI.fetchYoutubeVideos({ limit: 10 });
            if (youtubeResp?.success && youtubeResp.videos && youtubeResp.videos.length > 0) {
              await fetchVideos(false);
              toast({
                title: `${youtubeResp.videos.length} new videos added`,
                description: 'New videos fetched from YouTube.',
              });
              return;
            } else {
              toast({
                title: 'No videos available',
                description: 'No videos could be fetched.',
              });
            }
          }
          const sortedByDate = [...videos].sort((a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );

          setNewest(sortedByDate.slice(0, 6));
          setAll(videos);
        } else {
          throw new Error('Failed to fetch videos');
        }
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

    if (user) {
      fetchVideos();
    }
  }, [user, toast]);

  const filtered = all.filter(video => {
    const matchesSearch =
      !searchTerm ||
      video.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      video.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || video.categories.includes(selectedCategory);
    const matchesDuration = selectedDuration === 'all' ||
      (video.duration !== undefined && categorizeDuration(video.duration) === selectedDuration);

    return matchesSearch && matchesCategory && matchesDuration;
  });

  const handleLoadMore = async () => {
    setIsFetchingMore(true);
    try {
      // requesting server to fetch new videos from YouTube and save only new ones
      const response = await mediaAPI.fetchYoutubeVideos({
        category: selectedCategory !== 'all' ? selectedCategory : undefined,
        limit: 3
      });

      if (response?.success && response.videos && response.videos.length > 0) {
        const newVideos = response.videos as any[];
        const combined = [...newVideos, ...all];
        const sortedByDate = [...combined].sort((a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );

        setNewest(sortedByDate.slice(0, 6));
        setAll(combined);

        toast({
          title: `${response.videos.length} new videos added`,
          description: 'New videos fetched from YouTube.',
        });
      } else {
        toast({
          title: 'No new videos right now',
          description: "We couldn't find any new videos for your level at the moment. Please try again later.",
        });
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error fetching new videos',
        description: 'There was a problem fetching new videos. Try again later.'
      });
    } finally {
      setIsFetchingMore(false);
    }
  };

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
          <div className="mb-8">
            <MediaCarousel
              title="All Videos"
              items={filtered}
              showLoadMore={true}
              isLoadingMore={isFetchingMore}
              onLoadMore={handleLoadMore}
            />
          </div>

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
