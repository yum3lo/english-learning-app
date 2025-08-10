import { Volume2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PronunciationButtonProps {
  word: string;
  pronunciation?: string;
  showPronunciation?: boolean;
}

const PronunciationButton = ({ 
  word, 
  pronunciation, 
  showPronunciation = true
}: PronunciationButtonProps) => {
  const playPronunciation = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(word);
      utterance.rate = 0.8;
      utterance.lang = 'en-US';
      window.speechSynthesis.speak(utterance);
    }
  };

  return (
    <div className="flex items-center gap-2 justify-center">
      {showPronunciation && pronunciation && (
        <span className="text-sm font-mono text-muted-foreground break-words">
          {pronunciation}
        </span>
      )}
      <Button
        variant="ghostPrimary"
        size="sm"
        onClick={playPronunciation}
        className="h-8 w-8 p-0 flex-shrink-0"
        title="Play pronunciation"
      >
        <Volume2 className="h-4 w-4" />
      </Button>
    </div>
  );
};

export default PronunciationButton;
