import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ArrowLeft, BookOpen, Clock, Calendar, User, Star, Volume2, Library, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import LoadingSpinner from '@/components/LoadingSpinner';
import VocabularyCard from '@/components/VocabularyCard';
import VideoPlayer from '@/components/VideoPlayer';
import MarkdownRenderer from '@/components/MarkdownRenderer';
import { useToast } from '@/hooks/use-toast';
import { mediaDataService, type UnifiedMediaItem } from '@/data/mediaData';
import { type VocabularyItem } from '@/data/vocabulary';
import EmptyState from '@/components/EmptyState';

const MediaPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, recordMediaCompleted } = useAuth();
  const { toast } = useToast();
  
  const [media, setMedia] = useState<UnifiedMediaItem | null>(null);
  const [vocabulary, setVocabulary] = useState<VocabularyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCompleting, setIsCompleting] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  useEffect(() => {
    const fetchMediaData = async () => {
      if (!id) {
        navigate('/404');
        return;
      }

      setLoading(true);
      try {
        const foundMedia = mediaDataService.getMediaById(id);
        
        if (!foundMedia) {
          navigate('/404');
          return;
        }

        setMedia(foundMedia);
        
        const userLevel = user?.cefrLevel || 'B2';
        const levelVocabulary = mediaDataService.getVocabularyForMedia(id, userLevel);
        setVocabulary(levelVocabulary);
        
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Error loading media",
          description: "There was an error loading the media content. Please try again later.",
        });
        navigate('/');
      } finally {
        setLoading(false);
      }
    };

    fetchMediaData();
  }, [id, user, navigate, toast]);

  useEffect(() => {
    if (media && id) {
      const completedMediaKey = `completed_${media.type}_${id}`;
      const isAlreadyCompleted = localStorage.getItem(completedMediaKey) === 'true';
      setIsCompleted(isAlreadyCompleted);
    }
  }, [media, id]);

  const handleCompleteMedia = async () => {
    if (!media || !id || isCompleted) return;

    setIsCompleting(true);
    try {
      await recordMediaCompleted(media.type);
      
      const completedMediaKey = `completed_${media.type}_${id}`;
      localStorage.setItem(completedMediaKey, 'true');
      setIsCompleted(true);
    } catch (error) {
      console.error('Failed to complete media:', error);
    } finally {
      setIsCompleting(false);
    }
  };

  const formatDuration = (duration: string) => {
    return duration;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return <LoadingSpinner message="Loading media content..." />;
  }

  if (!media) {
    return null;
  }

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 py-8">
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Button>

        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            {media.type === 'article' ? (
              <BookOpen className="w-6 h-6 lg:w-8 lg:h-8" />
            ) : (
              <Volume2 className="w-6 h-6 lg:w-8 lg:h-8" />
            )}
            <h1>{media.title}</h1>
          </div>
          
          <div className="flex flex-wrap items-center gap-4 text-sm mb-4">
            <div className="flex items-center gap-1">
              <User className="w-4 h-4" />
              {media.source}
            </div>
            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              {formatDate(media.createdAt)}
            </div>
            {media.duration && (
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {formatDuration(media.duration)}
              </div>
            )}
          </div>

          {media.description && (
            <p className="mb-4">{media.description}</p>
          )}

          <div className="flex flex-wrap gap-2">
            {media.categories.map(category => (
              <span key={category} className='px-2 py-1 bg-muted text-xs rounded'>{category}</span>
            ))}
          </div>
        </div>

        {vocabulary.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <Star />
              <h2>Key Vocabulary</h2>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {vocabulary.map((vocab, index) => (
                <VocabularyCard key={index} vocabulary={vocab} />
              ))}
            </div>
          </div>
        )}

        <h2 className="flex items-center gap-2 mb-4">
          <Library />
          {media.type === 'article' ? 'Article Content' : 'Video Content'}
        </h2>
        
        {media.type === 'video' && media.content?.videoUrl ? (
          <VideoPlayer
            videoUrl={media.content.videoUrl}
            title={media.title}
            transcript={media.content.transcript}
          />
        ) : media.content?.content ? (
          <Card>
            <CardContent className='mt-8'>
              <MarkdownRenderer content={media.content.content} />
            </CardContent>
          </Card>
        ) : (
          <EmptyState 
            title="Content Not Available" 
            description="We're sorry, but the content you are looking for is not available at this time."
          />
        )}

        <div className="mt-8 flex justify-center">
          <Button
            onClick={handleCompleteMedia}
            disabled={isCompleting || isCompleted}
            size="lg"
            className="flex items-center gap-2"
          >
            <CheckCircle className="w-5 h-5" />
            {isCompleted 
              ? `${media.type === 'article' ? 'Article' : 'Video'} completed!`
              : isCompleting 
                ? 'Marking as complete...'
                : `Mark as complete`
            }
          </Button>
        </div>
      </div>
    </div>
  );
};

export default MediaPage;