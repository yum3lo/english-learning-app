import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { BookOpen, Play, CheckCircle } from 'lucide-react';
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardContent, 
  CardFooter 
} from '@/components/ui/card';
import { type MediaItem } from '@/data/mediaData';
import { formatDuration } from '@/constants/categories';

interface MediaCardProps {
  item: MediaItem;
  className?: string;
}

const MediaCard = ({ item, className = '' }: MediaCardProps) => {
  return (
    <Link to={item.type === 'article' ? `/reading/${item._id}` : `/listening/${item._id}`} className="block h-full">
      <div className={`p-1 h-full ${className}`}>
        <Card className='overflow-hidden hover:shadow-md transition-shadow h-full flex flex-col'>
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
                <BookOpen className="text-4xl" />
              ) : (
                <Play className="text-4xl" />
              )}
            </div>
            {item.isCompleted && (
              <div
                className='absolute top-2 right-2 bg-primary text-primary-foreground rounded-full p-1'
                title="Completed"
              >
                <CheckCircle className="w-4 h-4" />
              </div>
            )}
            {item.duration && (
              <Badge variant="bloom" className='absolute bottom-2 right-2'>
                {formatDuration(item.duration)}
              </Badge>
            )}
          </div>
          <CardHeader className="p-4 sm:p-5">
            <CardTitle>
              <h3 className="line-clamp-2">{item.title}</h3>
            </CardTitle>
            <CardDescription>
              <div className='flex items-center justify-between text-sm'>
                {item.source}
              </div>
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-5 pt-0 sm:pt-0 flex-1">
            <div className='text-sm line-clamp-2'>{item.description}</div>
          </CardContent>
          <CardFooter className="p-4 sm:p-5 pt-0 sm:pt-0">
            <div className='flex flex-wrap gap-1'>
              {item.categories.slice(0, 2).map((category) => (
                <Badge 
                  key={category}
                  variant="simple"
                >
                  {category}
                </Badge>
              ))}
              {item.categories.length > 2 && (
                <Badge variant="simple">
                  +{item.categories.length - 2}
                </Badge>
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
