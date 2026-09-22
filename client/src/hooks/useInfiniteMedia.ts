import { useState, useEffect, useRef, useCallback } from 'react';
import { mediaAPI } from '@/services/api';
import { type MediaItem } from '@/components/MediaCard';
import { useToast } from '@/hooks/use-toast';

interface UseInfiniteMediaOptions {
  type: 'article' | 'video';
  enabled: boolean;
  pageSize?: number;
  category?: string;
  search?: string;
}

// shared pagination + scroll-to-load-more mechanics for the Reading/Listening pages - fetches
// page 1 up front, then fetches the next page whenever the sentinel div scrolls into view.
// Refetches from page 1 whenever category/search change.
export function useInfiniteMedia({ type, enabled, pageSize = 20, category, search }: UseInfiniteMediaOptions) {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const fetchingRef = useRef(false);
  const { toast } = useToast();

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;

    const fetchInitial = async () => {
      setLoading(true);
      try {
        const response = await mediaAPI.getRecommendations({ type, limit: pageSize, page: 1, category, search });
        if (cancelled) return;
        if (response.success) {
          setItems(response.recommendations);
          setPage(1);
          setHasMore(response.pagination.page < response.pagination.totalPages);
        } else {
          throw new Error(`Failed to fetch ${type}s`);
        }
      } catch (error) {
        if (!cancelled) {
          toast({
            variant: 'destructive',
            title: `Error fetching ${type}s`,
            description: `There was an error fetching ${type}s. Please try again later.`,
          });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchInitial();
    return () => { cancelled = true; };
  }, [enabled, type, pageSize, category, search, toast]);

  const loadMore = useCallback(async () => {
    if (fetchingRef.current || !hasMore) return;
    fetchingRef.current = true;
    setIsFetchingMore(true);
    try {
      const nextPage = page + 1;
      const response = await mediaAPI.getRecommendations({ type, limit: pageSize, page: nextPage, category, search });

      if (response.success && response.recommendations.length > 0) {
        setItems(prev => [...prev, ...response.recommendations]);
        setPage(nextPage);
        setHasMore(response.pagination.page < response.pagination.totalPages);
      } else {
        setHasMore(false);
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: `Error fetching more ${type}s`,
        description: `There was a problem loading more ${type}s. Try again later.`,
      });
    } finally {
      fetchingRef.current = false;
      setIsFetchingMore(false);
    }
  }, [page, hasMore, type, pageSize, category, search, toast]);

  // keep a ref to the latest loadMore so the observer (set up once the sentinel mounts) always
  // calls the version closed over the current page/hasMore, without needing to re-subscribe
  const loadMoreRef = useRef(loadMore);
  useEffect(() => { loadMoreRef.current = loadMore; }, [loadMore]);

  useEffect(() => {
    const node = sentinelRef.current;
    if (!node || loading) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) loadMoreRef.current();
      },
      { rootMargin: '400px' }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [loading]);

  return { items, setItems, loading, isFetchingMore, hasMore, sentinelRef };
}
