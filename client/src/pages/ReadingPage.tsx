import { useState, useEffect, useRef } from 'react';
import { BookOpen, Loader2 } from 'lucide-react';
import MediaGrid from '@/components/MediaGrid';
import FilterSearch from '@/components/FilterSearch';
import PageHeader from '@/components/PageHeader';
import EmptyState from '@/components/EmptyState';
import LoadingSpinner from '@/components/LoadingSpinner';
import MediaLayout from '@/layouts/MediaLayout';
import { useInfiniteMedia } from '@/hooks/useInfiniteMedia';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';

const ReadingPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const debouncedSearch = useDebouncedValue(searchTerm.trim());

  const { items: all, loading, isFetchingMore, hasMore, sentinelRef } = useInfiniteMedia({
    type: 'article',
    enabled: true,
    category: selectedCategory === 'all' ? undefined : selectedCategory,
    search: debouncedSearch || undefined,
  });

  // only the very first load blocks the whole page - a filter change just refetches the
  // grid in place, since the search/category matching now happens server-side (see
  // useInfiniteMedia) and there's no reason to lose the header/filter bar while that runs
  const hasLoadedOnceRef = useRef(false);
  useEffect(() => { if (!loading) hasLoadedOnceRef.current = true; }, [loading]);

  if (loading && !hasLoadedOnceRef.current) {
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
          <div className="mb-6">
            <FilterSearch
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              selectedCategory={selectedCategory}
              setSelectedCategory={setSelectedCategory}
              filteredCount={all.length}
              mediaType="articles"
            />
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : all.length === 0 ? (
            <EmptyState
              title="No articles found"
              description={searchTerm || selectedCategory !== 'all'
                ? "Try adjusting your search criteria or filters."
                : "New articles are added automatically every few hours - check back soon."}
            />
          ) : (
            <div className="mb-8">
              <MediaGrid items={all} />

              {/* scrolling this into view fetches the next page - see useInfiniteMedia */}
              <div ref={sentinelRef} />

              {isFetchingMore && (
                <div className="flex justify-center py-6">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              )}

              {!hasMore && (
                <p className="text-center text-sm text-muted-foreground py-6">
                  You've reached the end. New articles are added automatically every few hours.
                </p>
              )}
            </div>
          )}
        </>
      }
    />
  );
};

export default ReadingPage;
