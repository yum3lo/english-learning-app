interface ClickableTextProps {
  text: string;
  onWordClick?: (word: string, sentence?: string) => void;
  className?: string;
}

const ClickableText = ({ text, onWordClick, className = '' }: ClickableTextProps) => {
  const getSurroundingSentence = (fullText: string, index: number) => {
    if (!fullText) return '';
    const before = fullText.slice(0, index);
    const after = fullText.slice(index);

    const startMatch = before.match(/([\.!?]\s|\n|^)([^\n]*)$/);
    const endMatch = after.match(/^([^\n]*?)([\.!?]\s|\n|$)/);

    const start = startMatch ? startMatch[2] || '' : before;
    const end = endMatch ? endMatch[1] || '' : after;

    const sentence = (start + end).trim();
    return sentence;
  };

  const handleWordClick = (word: string, offsetIndex: number) => {
    if (!onWordClick) return;

    const cleanWord = word.replace(/[^\w]/g, '').toLowerCase();
    if (cleanWord.length <= 2) return;

    const sentence = getSurroundingSentence(text, offsetIndex);
    onWordClick(cleanWord, sentence || undefined);
  };

  if (!onWordClick) {
    return <span className={className}>{text}</span>;
  }

  const parts: Array<React.ReactNode> = [];
  const regex = /\b\w{3,}\b/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    const matchStart = match.index;
    const matchText = match[0];
    if (matchStart > lastIndex) {
      parts.push(text.slice(lastIndex, matchStart));
    }
    const key = `${matchText}-${matchStart}`;
    parts.push(
      <span
        key={key}
        className="cursor-pointer hover:bg-primary/10 hover:text-primary transition-colors duration-150 rounded px-0.5"
        onClick={(e) => {
          e.stopPropagation();
          handleWordClick(matchText, matchStart);
        }}
      >
        {matchText}
      </span>
    );
    lastIndex = matchStart + matchText.length;
  }

  if (lastIndex < text.length) parts.push(text.slice(lastIndex));

  return <span className={className}>{parts}</span>;
};

export default ClickableText;