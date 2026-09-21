import { useState } from 'react';
import { BookOpen, Loader2 } from 'lucide-react';
import MediaGrid from '@/components/MediaGrid';
import FilterSearch from '@/components/FilterSearch';
import PageHeader from '@/components/PageHeader';
import EmptyState from '@/components/EmptyState';
import LoadingSpinner from '@/components/LoadingSpinner';
import MediaLayout from '@/layouts/MediaLayout';
import { useInfiniteMedia } from '@/hooks/useInfiniteMedia';

const ReadingPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const { items: all, loading, isFetchingMore, hasMore, sentinelRef } = useInfiniteMedia({
    type: 'article',
    enabled: true,
  });

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
              filteredCount={filtered.length}
              mediaType="articles"
            />
          </div>

          <div className="mb-8">
            <MediaGrid items={filtered} />

            {/* scrolling this into view fetches the next page - see useInfiniteMedia */}
            <div ref={sentinelRef} />

            {isFetchingMore && (
              <div className="flex justify-center py-6">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            )}

            {!hasMore && all.length > 0 && (
              <p className="text-center text-sm text-muted-foreground py-6">
                You've reached the end. New articles are added automatically every few hours.
              </p>
            )}
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
