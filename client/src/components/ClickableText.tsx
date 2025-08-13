interface ClickableTextProps {
  text: string;
  onWordClick?: (word: string) => void;
  className?: string;
}

const ClickableText = ({ text, onWordClick, className = '' }: ClickableTextProps) => {
  const handleWordClick = (word: string) => {
    if (!onWordClick) return;
    
    const cleanWord = word.replace(/[^\w]/g, '').toLowerCase();
    if (cleanWord.length > 2) {
      onWordClick(cleanWord);
    }
  };

  if (!onWordClick) {
    return <span className={className}>{text}</span>;
  }

  return (
    <span className={className}>
      {text.split(/(\b\w{3,}\b)/).map((part, index) => {
        if (/\b\w{3,}\b/.test(part)) {
          return (
            <span 
              key={index}
              className="cursor-pointer hover:bg-primary/10 hover:text-primary transition-colors duration-150 rounded px-0.5"
              onClick={(e) => {
                e.stopPropagation();
                handleWordClick(part);
              }}
            >
              {part}
            </span>
          );
        }
        return part;
      })}
    </span>
  );
};

export default ClickableText;
