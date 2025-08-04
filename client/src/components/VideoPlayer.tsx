import { useState } from 'react';
import { FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import MarkdownRenderer from './MarkdownRenderer';

interface VideoPlayerProps {
  videoUrl: string;
  title: string;
  transcript?: string;
}

const VideoPlayer = ({ videoUrl, title, transcript }: VideoPlayerProps) => {
  const [showTranscript, setShowTranscript] = useState(false);
  
  // extract youtube video id for embedding
  const getYouTubeId = (url: string) => {
    const match = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
    return match ? match[1] : null;
  };

  const videoId = getYouTubeId(videoUrl);
  const embedUrl = videoId ? `https://www.youtube.com/embed/${videoId}` : videoUrl;

  return (
    <div className="space-y-4">
      <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
        <iframe
          src={embedUrl}
          title={title}
          className="w-full h-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
      
      {transcript && (
        <div className="space-y-2">
          <div className='text-center'>
            <Button
              variant="outline"
              onClick={() => setShowTranscript(!showTranscript)}
              className="w-[50%]"
              size="lg"
            >
              <FileText className="w-4 h-4" />
              {showTranscript ? 'Hide Transcript' : 'Show Transcript'}
            </Button>
          </div>
          
          {showTranscript && (
            <Card>
              <CardContent className='mt-8'>
                <MarkdownRenderer content={transcript} />
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
};

export default VideoPlayer;
