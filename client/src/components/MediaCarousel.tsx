import { Library } from 'lucide-react';
import MediaCard, { type MediaItem } from '@/components/MediaCard';

interface CarouselProps {
  title: string;
  items: MediaItem[];
}

const MediaCarousel = ({ title, items }: CarouselProps) => {
  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="flex items-center gap-2">
          <Library />
          {title}
        </h2>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {items.map((item) => (
          <MediaCard key={item._id} item={item} />
        ))}
      </div>
    </div>
  );
};

export default MediaCarousel;