import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Headphones, Loader2, RefreshCcw } from 'lucide-react';
import MediaGrid from '@/components/MediaGrid';
import { useToast } from '@/hooks/use-toast';
import FilterSearch from '@/components/FilterSearch';
import PageHeader from '@/components/PageHeader';
import EmptyState from '@/components/EmptyState';
import LoadingSpinner from '@/components/LoadingSpinner';
import MediaLayout from '@/layouts/MediaLayout';
import { Button } from '@/components/ui/button';
import { mediaAPI } from '@/services/api';
import { categorizeDuration } from '@/constants/categories';
import { useInfiniteMedia } from '@/hooks/useInfiniteMedia';

const ListeningPage = () => {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedDuration, setSelectedDuration] = useState<string>('all');
  const [isFetchingNew, setIsFetchingNew] = useState(false);

  const { toast } = useToast();
  const triedYoutubeFallback = useRef(false);

  const { items: all, setItems: setAll, loading, isFetchingMore, hasMore, sentinelRef } = useInfiniteMedia({
    type: 'video',
    enabled: true,
  });

  // first time a logged-in user has no stored videos at all, try fetching some from YouTube
  // so the page isn't empty on their very first visit - only ever runs once per page load.
  // Skipped for guests: /media/youtube/fetch requires auth, so this would just 401.
  useEffect(() => {
    if (!user || loading || all.length > 0 || triedYoutubeFallback.current) return;
    triedYoutubeFallback.current = true;

    const fetchFromYoutube = async () => {
      try {
        const youtubeResp = await mediaAPI.fetchYoutubeVideos({ limit: 10 });
        if (youtubeResp?.success && youtubeResp.videos && youtubeResp.videos.length > 0) {
          setAll(youtubeResp.videos);
          toast({
            title: `${youtubeResp.videos.length} new videos added`,
            description: 'New videos fetched from YouTube.',
          });
        } else {
          toast({
            title: 'No videos available',
            description: 'No videos could be fetched.',
          });
        }
      } catch (error) {
        toast({
          variant: 'destructive',
          title: 'Error fetching videos',
          description: 'There was an error fetching videos. Please try again later.',
        });
      }
    };

    fetchFromYoutube();
  }, [user, loading, all.length, setAll, toast]);

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

  const handleFetchNew = async () => {
    setIsFetchingNew(true);
    try {
      // requesting server to fetch new videos from YouTube and save only new ones
      const response = await mediaAPI.fetchYoutubeVideos({
        category: selectedCategory !== 'all' ? selectedCategory : undefined,
        limit: 3
      });

      if (response?.success && response.videos && response.videos.length > 0) {
        setAll(prev => [...response.videos, ...prev]);
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
      setIsFetchingNew(false);
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
          description="Curated videos with transcripts, matched to your level and interests."
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
              selectedDuration={selectedDuration}
              setSelectedDuration={setSelectedDuration}
              filteredCount={filtered.length}
              mediaType="videos"
            />
            {user && (
              <Button
                onClick={handleFetchNew}
                disabled={isFetchingNew}
                aria-label={isFetchingNew ? 'Fetching new videos' : 'Fetch new videos from YouTube'}
                variant="secondary"
              >
                <RefreshCcw className="w-4 h-4" />
                <span className="hidden sm:inline">{isFetchingNew ? 'Fetching...' : 'Fetch new'}</span>
              </Button>
            )}
          </div>

          <div className="mb-8">
            <MediaGrid items={filtered} />

            {/* scrolling this into view fetches the next page of already-stored videos */}
            <div ref={sentinelRef} />

            {isFetchingMore && (
              <div className="flex justify-center py-6">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            )}

            {!hasMore && all.length > 0 && (
              <p className="text-center text-sm text-muted-foreground py-6">
                {user
                  ? 'You\'ve reached the end. Use "Fetch new" to check YouTube for more.'
                  : "You've reached the end."}
              </p>
            )}
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
