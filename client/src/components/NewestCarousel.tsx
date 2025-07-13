import MediaCard, { type MediaItem } from '@/components/MediaCard';
import { Zap } from 'lucide-react';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

const NewestCarousel = ({ title, items }: { title: string; items: MediaItem[] }) => {
  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="flex items-center gap-2">
          <Zap />
          {title}
        </h2>
      </div>
      
      <Carousel
        opts={{
          align: 'start',
        }}
        className='w-full'
      >
        <CarouselContent>
          {items.map((item) => (
            <CarouselItem key={item._id} className='md:basis-1/2 lg:basis-1/3 py-2'>
              <MediaCard item={item} />
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious />
        <CarouselNext />
      </Carousel>
    </div>
  );
};

export default NewestCarousel;