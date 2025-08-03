import { useState, useEffect } from 'react';
import MediaCard, { type MediaItem } from '@/components/MediaCard';
import { Zap } from 'lucide-react';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@/components/ui/carousel";

const NewestCarousel = ({ title, items }: { title: string; items: MediaItem[] }) => {
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!api) {
      return;
    }

    setCount(api.scrollSnapList().length);
    setCurrent(api.selectedScrollSnap() + 1);

    api.on("select", () => {
      setCurrent(api.selectedScrollSnap() + 1);
    });
  }, [api]);

  return (
    <div className="mb-6 lg:mb-8">
      <div className="flex justify-between items-center mb-4">
        <h2 className="flex items-center gap-2">
          <Zap className="w-5 h-5 lg:w-5 lg:h-5" />
          {title}
        </h2>

        {/* mobile scroll indicator */}
        <div className="flex sm:hidden text-xs text-muted-foreground">
          {current} / {count}
        </div>
      </div>
      
      <Carousel
        opts={{
          align: 'start',
        }}
        setApi={setApi}
        className='w-full relative px-4 sm:px-0'
      >
        <CarouselContent className="-ml-2 md:-ml-4">
          {items.map((item) => (
            <CarouselItem key={item._id} className='basis-full sm:basis-1/2 lg:basis-1/3 xl:basis-1/4 pl-2 md:pl-4 py-2'>
              <MediaCard item={item} />
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious className="left-0 sm:-left-12 h-8 w-8 sm:h-10 sm:w-10 bg-background/80 backdrop-blur-sm border shadow-lg" />
        <CarouselNext className="right-0 sm:-right-12 h-8 w-8 sm:h-10 sm:w-10 bg-background/80 backdrop-blur-sm border shadow-lg" />
      </Carousel>
      
      {/* mobile dot indicators */}
      <div className="flex sm:hidden justify-center mt-4 gap-2">
        {Array.from({ length: count }).map((_, index) => (
          <button
            key={index}
            className={`h-2 w-2 rounded-full transition-colors ${
              index + 1 === current ? 'bg-primary' : 'bg-muted'
            }`}
            onClick={() => api?.scrollTo(index)}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
};

export default NewestCarousel;