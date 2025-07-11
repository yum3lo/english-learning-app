import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { BookHeart, Library, BookOpen, Search, LibraryBig } from 'lucide-react';
import { CATEGORIES } from '@/constants/categories';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import MediaCard, { type MediaItem } from '@/components/MediaCard';
import articlesData from '@/data/articles.json';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface CarouselProps {
  title: string;
  items: MediaItem[];
}

const RecommendedCarousel = ({ title, items }: { title: string; items: MediaItem[] }) => {
  return (
    <div className="mb-8">
      <div className="flex justify-between items-center mb-4">
        <h2 className="flex items-center gap-2">
          <BookHeart />
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

const MediaCarousel = ({ title, items }: CarouselProps) => {
  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="flex items-center gap-2">
          <Library />
          {title}
        </h2>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {items.map((item) => (
          <MediaCard key={item._id} item={item} />
        ))}
      </div>
    </div>
  );
};

const ReadingPage = () => {
  const { user } = useAuth();
  const [recommendedArticles, setRecommendedArticles] = useState<MediaItem[]>([]);
  const [allArticles, setAllArticles] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLevel, setSelectedLevel] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const { toast } = useToast();

  useEffect(() => {
    const fetchArticles = async () => {
      setLoading(true);
      try {
        const mockArticles: MediaItem[] = articlesData as MediaItem[];
        const userLevel = user?.cefrLevel || 'B2';
        const userInterests = user?.fieldsOfInterest || [];
        // filter articles based on user level and interests
        const recommended = mockArticles.filter(article => {
          const levelMatch = article.cefrLevel === userLevel;
          const interestMatch = userInterests.some(interest => 
            article.categories.includes(interest)
          );
          return levelMatch && interestMatch;
        });
        
        setRecommendedArticles(recommended);
        setAllArticles(mockArticles);
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Error fetching articles",
          description: "There was an error fetching articles. Please try again later.",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchArticles();
  }, [user]);

  const filteredArticles = allArticles.filter(article => {
    const matchesSearch =
      !searchTerm ||
      article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      article.description?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesLevel = selectedLevel === 'all' || article.cefrLevel === selectedLevel;
    const matchesCategory = selectedCategory === 'all' || article.categories.includes(selectedCategory);

    return matchesSearch && matchesLevel && matchesCategory;
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading articles...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="mb-2 flex items-center gap-2">
            <BookOpen />
            Reading Practice
          </h1>
          <p>Enhance your reading comprehension with curated articles for your level and preferences.</p>
        </div>

        {recommendedArticles.length > 0 && (
          <RecommendedCarousel
            title="Recommended for You"
            items={recommendedArticles}
          />
        )}

        <div className="rounded-xl border shadow p-6 mb-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                type="text"
                placeholder="Search articles..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={selectedLevel} onValueChange={setSelectedLevel}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="All Levels" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Levels</SelectItem>
                <SelectItem value="B2">B2 (Upper Intermediate)</SelectItem>
                <SelectItem value="C1">C1 (Advanced)</SelectItem>
                <SelectItem value="C2">C2 (Proficiency)</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {CATEGORIES.map(category => (
                  <SelectItem key={category} value={category}>{category}</SelectItem>
                ))}
              </SelectContent>
            </Select>

          </div>

          <div className="text-sm">
            {filteredArticles.length} articles found
          </div>
        </div>

        <MediaCarousel
          title="All Articles"
          items={filteredArticles}
        />

        {filteredArticles.length === 0 && (
          <div className="flex flex-col items-center py-20">
            <LibraryBig />
            <h3 className="mb-2">No articles found</h3>
            <p>Try adjusting your search criteria or filters.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReadingPage;