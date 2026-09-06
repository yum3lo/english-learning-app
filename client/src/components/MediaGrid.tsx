import MediaCard, { type MediaItem } from '@/components/MediaCard';

interface MediaGridProps {
  items: MediaItem[];
}

const MediaGrid = ({ items }: MediaGridProps) => {
  const sortedItems = [...items].sort((a, b) =>
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-card">
      {sortedItems.map((item) => (
        <MediaCard key={item._id} item={item} />
      ))}
    </div>
  );
};
export default MediaGrid;
