import { Link } from 'react-router-dom';
import { BookOpen, Play } from 'lucide-react';
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardContent, 
  CardFooter 
} from '@/components/ui/card';

interface MediaItem {
  _id: string;
  title: string;
  type: 'article' | 'video';
  url: string;
  source: string;
  description?: string;
  imageUrl?: string;
  cefrLevel: 'B2' | 'C1' | 'C2';
  categories: string[];
  createdAt: string;
}

interface MediaCardProps {
  item: MediaItem;
  className?: string;
}

const MediaCard = ({ item, className = '' }: MediaCardProps) => {
  return (
    <Link to={`media/${item._id}`} className="block">
      <div className={`p-1 ${className}`}>
        <Card className='overflow-hidden hover:shadow-md transition-shadow'>
          <div className="relative aspect-video bg-muted/50 rounded-t-lg overflow-hidden">
            {item.imageUrl ? (
              <img 
                src={item.imageUrl} 
                alt={item.title}
                className="w-full h-full object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  const placeholder = target.nextElementSibling as HTMLElement;
                  if (placeholder) placeholder.style.display = 'flex';
                }}
              />
            ) : null}
            <div 
              className={`w-full h-full flex items-center justify-center ${item.imageUrl ? 'hidden' : 'flex'}`}
              style={{ display: item.imageUrl ? 'none' : 'flex' }}
            >
              {item.type === 'article' ? (
                <BookOpen className="text-4xl text-foreground" />
              ) : (
                <Play className="text-4xl text-foreground" />
              )}
            </div>
            <div className='absolute top-2 left-2 bg-foreground text-background px-2 py-1 rounded text-xs font-semibold'>
              {item.cefrLevel}
            </div>
          </div>
          <CardHeader>
            <CardTitle>
              <h3 className="line-clamp-2">{item.title}</h3>
            </CardTitle>
            <CardDescription>
              <div className='flex items-center justify-between text-sm'>
                {item.source}
              </div>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className='text-sm line-clamp-2'>{item.description}</div>
          </CardContent>
          <CardFooter>
            <div className='flex flex-wrap gap-1'>
              {item.categories.slice(0, 2).map((category) => (
                <span 
                  key={category}
                  className='px-2 py-1 bg-muted text-xs rounded'
                >
                  {category}
                </span>
              ))}
              {item.categories.length > 2 && (
                <span className='px-2 py-1 text-xs rounded'>
                  +{item.categories.length - 2}
                </span>
              )}
            </div>
          </CardFooter>
        </Card>
      </div>
    </Link>
  );
};

export default MediaCard;
export type { MediaItem };
