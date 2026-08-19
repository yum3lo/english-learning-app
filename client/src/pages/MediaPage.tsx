import { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ArrowLeft, Clock, Calendar, Newspaper, Sprout, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import LoadingSpinner from '@/components/LoadingSpinner';
import VideoPlayer from '@/components/VideoPlayer';
import InteractiveMarkdownRenderer from '@/components/InteractiveMarkdownRenderer';
import DictionaryPopup from '@/components/DictionaryPopup';
import { useToast } from '@/hooks/use-toast';
import { useDictionary } from '@/hooks/useDictionary';
import { mediaAPI } from '@/services/api';
import mediaDataService, { type UnifiedMediaItem } from '@/data/mediaData';
import EmptyState from '@/components/EmptyState';
import teapot from '@/assets/teapot.png';

const isObjectId = (value: string) => /^[0-9a-fA-F]{24}$/.test(value);

const DESCRIPTION_PREVIEW_LENGTH = 200;
const WORDS_PER_MINUTE = 200;

const MediaPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, recordMediaCompleted } = useAuth();
  const { toast } = useToast();

  const [media, setMedia] = useState<UnifiedMediaItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [isCompleting, setIsCompleting] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [readingProgress, setReadingProgress] = useState(0);

  const sessionStartRef = useRef<{ points: number; wordsLearned: number } | null>(null);

  const {
    selectedWord,
    dictionaryData,
    isDictionaryOpen,
    isLoadingDictionary,
    isAddingToLearned,
    encounteredSentence,
    encounteredMediaType,
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
        if (!isObjectId(id)) {
          // mock/demo content (e.g. sample videos) isn't stored in the database
          const localMedia = mediaDataService.getMediaById(id);
          if (localMedia) {
            setMedia(localMedia);
          } else {
            toast({
              variant: "destructive",
              title: "Media not found",
              description: "The requested content could not be found.",
            });
            navigate('/');
          }
          return;
        }

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

  // snapshot the user's stats once the page is ready, so the sidebar can show what changed this session
  useEffect(() => {
    if (user && media && !sessionStartRef.current) {
      sessionStartRef.current = { points: user.points, wordsLearned: user.wordsLearned };
    }
  }, [user, media]);

  useEffect(() => {
    const handleScroll = () => {
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = docHeight > 0 ? Math.round((window.scrollY / docHeight) * 100) : 0;
      setReadingProgress(Math.min(100, Math.max(0, progress)));
    };

    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [media]);

  const readingTimeMinutes = useMemo(() => {
    if (media?.type !== 'article' || !media.content?.content) return null;
    const wordCount = media.content.content.trim().split(/\s+/).filter(Boolean).length;
    return Math.max(1, Math.round(wordCount / WORDS_PER_MINUTE));
  }, [media]);

  const sessionWordsPlanted = user && sessionStartRef.current
    ? Math.max(0, user.wordsLearned - sessionStartRef.current.wordsLearned)
    : 0;
  const sessionPoints = user && sessionStartRef.current
    ? Math.max(0, user.points - sessionStartRef.current.points)
    : 0;

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

  const hasContent = media.type === 'video'
    ? Boolean(media.content?.videoUrl || media.url)
    : Boolean(media.content?.content);

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 py-8">
        <Button
          variant="link"
          onClick={() => navigate(-1)}
          className="mb-4 h-auto px-0 text-secondary hover:text-secondary/80"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to {media.type === 'article' ? 'articles' : 'videos'}
        </Button>

        {media.type === 'video' ? (
          hasContent ? (
            <VideoPlayer
              videoUrl={media.content?.videoUrl || media.url}
              title={media.title}
              source={media.source}
              duration={media.duration}
              cefrLevel={media.cefrLevel}
              categories={media.categories}
              transcript={media.content?.transcript}
              transcriptSegments={media.content?.transcriptSegments}
              onWordClick={(word, sentence) => handleWordClick(word, sentence, media.type)}
              isCompleted={isCompleted}
              isCompleting={isCompleting}
              onMarkComplete={handleCompleteMedia}
              sessionWordsPlanted={sessionWordsPlanted}
              sessionPoints={sessionPoints}
            />
          ) : (
            <EmptyState
              title="Content Not Available"
              description="We're sorry, but the content you are looking for is not available at this time."
            />
          )
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_260px] gap-6 items-start">
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <Badge variant="secondary" className="rounded-full">{media.cefrLevel}</Badge>
                {media.categories.map(category => (
                  <Badge
                    key={category}
                    className="rounded-full border-transparent bg-accent/15 text-accent hover:bg-accent/15"
                  >
                    {category}
                  </Badge>
                ))}
              </div>

              <h1 className="mb-3">{media.title}</h1>

              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-4">
                <div className="flex items-center gap-1.5">
                  <Newspaper className="w-4 h-4" />
                  {media.source}
                </div>
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4" />
                  {formatDate(media.createdAt)}
                </div>
                {readingTimeMinutes && (
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-4 h-4" />
                    {readingTimeMinutes} min read
                  </div>
                )}
              </div>

              {media.description && (
                <div className="mb-6">
                  <p className={showFullDescription ? '' : 'line-clamp-3'}>{media.description}</p>
                  {media.description.length > DESCRIPTION_PREVIEW_LENGTH && (
                    <Button
                      variant="link"
                      className="h-auto px-0"
                      onClick={() => setShowFullDescription(prev => !prev)}
                    >
                      {showFullDescription ? 'Show less' : 'Show more'}
                    </Button>
                  )}
                </div>
              )}

              {hasContent ? (
                <Card>
                  <CardContent className="pt-6">
                    <InteractiveMarkdownRenderer
                      content={media.content!.content!}
                      onWordClick={(word, sentence) => handleWordClick(word, sentence, media.type)}
                    />
                  </CardContent>
                </Card>
              ) : (
                <EmptyState
                  title="Content Not Available"
                  description="We're sorry, but the content you are looking for is not available at this time."
                />
              )}

              {hasContent && (
                <div className="mt-4 inline-flex items-center gap-2 text-sm text-muted-foreground bg-muted rounded-lg px-3 py-2">
                  <Sprout className="w-4 h-4 text-secondary" />
                  Tap any word to see its meaning and plant it in your garden
                </div>
              )}
            </div>

            <div className="lg:sticky lg:top-24">
              <Card className="p-4">
                <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-3">
                  This session
                </div>

                <div className="mb-3">
                  <div className="flex justify-between text-sm mb-1.5">
                    <span>Progress</span>
                    <span className="text-secondary">{readingProgress}%</span>
                  </div>
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-secondary rounded-full transition-all"
                      style={{ width: `${readingProgress}%` }}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between py-2 border-t">
                  <span className="text-sm text-muted-foreground">Words planted</span>
                  <span className="text-sm font-medium text-bloom">{sessionWordsPlanted} 🌱</span>
                </div>
                <div className="flex items-center justify-between py-2 border-t">
                  <span className="text-sm text-muted-foreground">Points earned</span>
                  <span className="text-sm font-medium text-accent">+{sessionPoints}</span>
                </div>

                {hasContent && (
                  <Button
                    onClick={handleCompleteMedia}
                    disabled={isCompleting || isCompleted}
                    className="w-full mt-3"
                  >
                    <CheckCircle className="w-4 h-4" />
                    {isCompleted
                      ? 'Article completed!'
                      : isCompleting
                        ? 'Marking as complete...'
                        : 'Mark as read'
                    }
                  </Button>
                )}
              </Card>

              <img
                src={teapot}
                alt=""
                className="w-40 mx-auto mt-[50%] select-none pointer-events-none hidden lg:block"
              />
            </div>
          </div>
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
        sourceSentence={encounteredSentence}
        sourceMediaType={encounteredMediaType}
      />
    </div>
  );
};

export default MediaPage;
