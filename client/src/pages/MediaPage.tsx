import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ArrowLeft, BookOpen, Clock, Calendar, User, Volume2, Library, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import LoadingSpinner from '@/components/LoadingSpinner';
import VideoPlayer from '@/components/VideoPlayer';
import InteractiveMarkdownRenderer from '@/components/InteractiveMarkdownRenderer';
import DictionaryPopup from '@/components/DictionaryPopup';
import { useToast } from '@/hooks/use-toast';
import { useDictionary } from '@/hooks/useDictionary';
import { mediaAPI } from '@/services/api';
import type { UnifiedMediaItem } from '@/data/mediaData';
import EmptyState from '@/components/EmptyState';

const MediaPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, recordMediaCompleted } = useAuth();
  const { toast } = useToast();
  
  const [media, setMedia] = useState<UnifiedMediaItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [isCompleting, setIsCompleting] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  
  const {
    selectedWord,
    dictionaryData,
    isDictionaryOpen,
    isLoadingDictionary,
    isAddingToLearned,
    handleWordClick,
    handleAddToLearned,
    handleCloseDictionary,
  } = useDictionary();

  useEffect(() => {
    const fetchMediaData = async () => {
      if (!id) {
        navigate('/404');
        return;
      }

      setLoading(true);
      try {
        const response = await mediaAPI.getById(id);
        
        if (response.success && response.media) {
          setMedia(response.media);
        } else {
          toast({
            variant: "destructive",
            title: "Media not found",
            description: "The requested content could not be found.",
          });
          navigate('/');
        }
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

    if (user) {
      fetchMediaData();
    }
  }, [id, user, navigate, toast]);

  useEffect(() => {
    if (media && id && user) {
      // checking if media is completed on the server side
      const isAlreadyCompleted = user.completedMedia?.some(
        completedMedia => completedMedia.mediaId === id && completedMedia.mediaType === media.type
      ) || false;
      setIsCompleted(isAlreadyCompleted);
    }
  }, [media, id, user]);

  const handleCompleteMedia = async () => {
    if (!media || !id || isCompleted || isCompleting) return;

    setIsCompleting(true);
    setIsCompleted(true);
    try {
      await recordMediaCompleted(media.type, id);

      toast({
        title: "Progress updated!",
        description: `${media.type === 'article' ? 'Article' : 'Video'} marked as complete. You earned 5 points!`,
      });
    } catch (error) {
      setIsCompleted(false);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to mark media as complete. Please try again.",
      });
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

        <h2 className="flex items-center gap-2 mb-4">
          <Library />
          {media.type === 'article' ? 'Article Content' : 'Video Content'}
        </h2>
        
        {media.type === 'video' && media.content?.videoUrl ? (
          <VideoPlayer
            videoUrl={media.content.videoUrl}
            title={media.title}
            transcript={media.content.transcript}
            onWordClick={handleWordClick}
          />
        ) : media.content?.content ? (
          <>
            <Card>
              <CardContent className='mt-8'>
                <InteractiveMarkdownRenderer 
                  content={media.content.content} 
                  onWordClick={handleWordClick}
                />
              </CardContent>
            </Card>

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
          </>
        ) : (
          <EmptyState 
            title="Content Not Available" 
            description="We're sorry, but the content you are looking for is not available at this time."
          />
        )}
      </div>

      <DictionaryPopup
        word={selectedWord}
        dictionaryData={dictionaryData}
        isOpen={isDictionaryOpen}
        onClose={handleCloseDictionary}
        onAddToLearned={handleAddToLearned}
        isAddingToLearned={isAddingToLearned}
        isLoading={isLoadingDictionary}
      />
    </div>
  );
};

export default MediaPage;