import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpDown, Sprout, Trophy, CheckCircle, LogIn } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import ClickableText from './ClickableText';
import InteractiveMarkdownRenderer from './InteractiveMarkdownRenderer';
import { formatDuration } from '@/constants/categories';
import type { TranscriptSegment } from '@/data/mediaData';
import hummingbird from '@/assets/hummingbird.png';

declare global {
  interface Window {
    YT?: any;
    onYouTubeIframeAPIReady?: () => void;
  }
}

let youtubeApiPromise: Promise<void> | null = null;

// the YT iframe API is a global singleton script - loading it more than once is a no-op
// in the browser, but we still only want one <script> tag and one shared ready-promise
const loadYouTubeIframeApi = (): Promise<void> => {
  if (window.YT?.Player) return Promise.resolve();
  if (youtubeApiPromise) return youtubeApiPromise;

  youtubeApiPromise = new Promise((resolve) => {
    const previousCallback = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      previousCallback?.();
      resolve();
    };

    if (!document.querySelector('script[src="https://www.youtube.com/iframe_api"]')) {
      const script = document.createElement('script');
      script.src = 'https://www.youtube.com/iframe_api';
      document.head.appendChild(script);
    }
  });

  return youtubeApiPromise;
};

const CURRENT_TIME_POLL_MS = 500;
const DESCRIPTION_PREVIEW_LENGTH = 200;

interface VideoPlayerProps {
  videoUrl: string;
  title: string;
  description?: string;
  source?: string;
  duration?: string | number;
  categories?: string[];
  transcript?: string;
  transcriptSegments?: TranscriptSegment[];
  onWordClick?: (word: string, sentence?: string) => void;
  isCompleted?: boolean;
  isCompleting?: boolean;
  onMarkComplete?: () => void;
  showLoginToTrack?: boolean;
  sessionWordsPlanted?: number;
  sessionPoints?: number;
}

const VideoPlayer = ({
  videoUrl,
  title,
  description,
  source,
  duration,
  categories,
  transcript,
  transcriptSegments,
  onWordClick,
  isCompleted,
  isCompleting,
  onMarkComplete,
  showLoginToTrack,
  sessionWordsPlanted,
  sessionPoints,
}: VideoPlayerProps) => {
  const [currentTime, setCurrentTime] = useState(0);
  const [autoScroll, setAutoScroll] = useState(true);
  const [showFullDescription, setShowFullDescription] = useState(false);
  const playerContainerRef = useRef<HTMLDivElement | null>(null);
  const playerRef = useRef<any>(null);
  const activeSegmentRef = useRef<HTMLDivElement | null>(null);

  const getYouTubeId = (url: string) => {
    const match = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
    return match ? match[1] : null;
  };

  const videoId = getYouTubeId(videoUrl);
  const hasSegments = Boolean(transcriptSegments && transcriptSegments.length > 0);

  // onMarkComplete doubles as the "video ended" handler - kept in a ref so the player
  // effect below (keyed only on videoId) doesn't need to re-run when it changes identity
  const onMarkCompleteRef = useRef(onMarkComplete);
  onMarkCompleteRef.current = onMarkComplete;

  useEffect(() => {
    if (!videoId || !playerContainerRef.current) return;

    let cancelled = false;
    let pollId: number | undefined;

    loadYouTubeIframeApi().then(() => {
      if (cancelled || !playerContainerRef.current) return;

      playerRef.current = new window.YT.Player(playerContainerRef.current, {
        videoId,
        playerVars: { rel: 0 },
        events: {
          onReady: () => {
            pollId = window.setInterval(() => {
              const time = playerRef.current?.getCurrentTime?.();
              if (typeof time === 'number') setCurrentTime(time);
            }, CURRENT_TIME_POLL_MS);
          },
          onStateChange: (event: any) => {
            if (event.data === window.YT.PlayerState.ENDED) {
              onMarkCompleteRef.current?.();
            }
          },
        },
      });
    });

    return () => {
      cancelled = true;
      if (pollId) window.clearInterval(pollId);
      playerRef.current?.destroy?.();
      playerRef.current = null;
    };
  }, [videoId]);

  const activeSegmentIndex = useMemo(() => {
    if (!transcriptSegments?.length) return -1;
    let index = -1;
    for (let i = 0; i < transcriptSegments.length; i++) {
      if (transcriptSegments[i].start <= currentTime) index = i;
      else break;
    }
    return index;
  }, [transcriptSegments, currentTime]);

  useEffect(() => {
    if (autoScroll && activeSegmentRef.current) {
      activeSegmentRef.current.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }, [activeSegmentIndex, autoScroll]);

  const handleSegmentClick = useCallback((start: number) => {
    playerRef.current?.seekTo?.(start, true);
    playerRef.current?.playVideo?.();
  }, []);

  if (!videoId) return null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-4">
      <div>
        <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
          <div ref={playerContainerRef} className="w-full h-full" />
        </div>

        <div className="mt-3">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            {categories?.map(category => (
              <Badge key={category} variant="simple">
                {category}
              </Badge>
            ))}
          </div>
          <h1 className="mb-1">{title}</h1>
          {(source || duration) && (
            <div className="text-sm text-muted-foreground">
              {[source, duration ? formatDuration(duration) : undefined].filter(Boolean).join(' · ')}
            </div>
          )}

          {description && (
            <div className="mt-3">
              <p className={showFullDescription ? '' : 'line-clamp-3'}>{description}</p>
              {description.length > DESCRIPTION_PREVIEW_LENGTH && (
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

          {onMarkComplete ? (
            <Button
              onClick={onMarkComplete}
              disabled={isCompleting || isCompleted}
              size="sm"
              className="mt-3"
            >
              <CheckCircle className="w-4 h-4" />
              {isCompleted
                ? 'Video completed!'
                : isCompleting
                  ? 'Marking as complete...'
                  : 'Mark as complete'
              }
            </Button>
          ) : showLoginToTrack ? (
            <Button asChild variant="outline" size="sm" className="mt-3">
              <Link to="/login">
                <LogIn className="w-4 h-4" />
                Log in to mark as watched
              </Link>
            </Button>
          ) : null}
        </div>
      </div>

      <div className="flex flex-col gap-4">
        {hasSegments ? (
          <Card className="p-0 overflow-hidden">
            <div className="flex items-center justify-between px-3.5 py-3 border-b">
              <span className="text-base font-medium">Transcript</span>
              <button
                type="button"
                onClick={() => setAutoScroll(prev => !prev)}
                className={`flex items-center gap-1 text-sm ${autoScroll ? 'text-secondary' : 'text-muted-foreground'}`}
              >
                <ArrowUpDown className="w-4 h-4" />
                Auto-scroll
              </button>
            </div>

            <div className="flex items-center gap-1.5 text-sm text-muted-foreground bg-muted/50 px-3.5 py-2 border-b">
              <Sprout className="w-4 h-4 text-secondary" />
              Tap any word to plant it
            </div>

            <div className="max-h-[420px] overflow-y-auto p-1.5">
              {transcriptSegments!.map((segment, index) => {
                const isActive = index === activeSegmentIndex;
                return (
                  <div
                    key={`${segment.start}-${index}`}
                    ref={isActive ? activeSegmentRef : undefined}
                    onClick={() => handleSegmentClick(segment.start)}
                    className={`px-2.5 py-2 rounded-lg cursor-pointer transition-colors ${
                      isActive ? 'bg-secondary/15' : 'hover:bg-muted'
                    }`}
                  >
                    <div className={`font-mono text-[10px] mb-0.5 ${isActive ? 'text-secondary' : 'text-muted-foreground'}`}>
                      {formatDuration(segment.start)}{isActive ? ' · now playing' : ''}
                    </div>
                    <div className="text-sm leading-relaxed">
                      <ClickableText text={segment.text} onWordClick={onWordClick} />
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        ) : transcript ? (
          <Card className="p-0 overflow-hidden">
            <div className="px-3.5 py-3 border-b">
              <span className="text-sm font-medium">Transcript</span>
            </div>
            <CardContent className="max-h-[420px] overflow-y-auto pt-4">
              <InteractiveMarkdownRenderer content={transcript} onWordClick={onWordClick} />
            </CardContent>
          </Card>
        ) : null}

        {sessionWordsPlanted !== undefined && sessionPoints !== undefined && (
          <Card className="p-4">
            <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-3">
              This session
            </div>

            <div className="flex items-center justify-between py-2 border-t">
              <span className="text-sm text-muted-foreground">Words planted</span>
              <span className="text-sm font-medium text-secondary">
                {sessionWordsPlanted}
                <Sprout className="w-4 h-4 inline-block ml-1 mb-0.5 text-secondary" />
              </span>
            </div>

            <div className="flex items-center justify-between pt-2 border-t">
              <span className="text-sm text-muted-foreground">Points earned</span>
              <span className="text-sm font-medium text-accent">
                +{sessionPoints}
                <Trophy className="w-4 h-4 inline-block ml-1 mb-0.5 text-accent" />  
              </span>
            </div>
          </Card>
        )}

        <img src={hummingbird} alt="Hummingbird" className="w-[180px] h-auto mx-auto mt-[25%] select-none pointer-events-none hidden xl:block" />
      </div>
    </div>
  );
};

export default VideoPlayer;
