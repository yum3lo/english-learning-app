import ReactMarkdown from 'react-markdown';
import React from 'react';
import ClickableText from './ClickableText';

interface InteractiveMarkdownRendererProps {
  content: string;
  className?: string;
  onWordClick?: (word: string, sentence?: string) => void;
}

const InteractiveMarkdownRenderer = ({ 
  content, 
  className = '', 
  onWordClick 
}: InteractiveMarkdownRendererProps) => {

  const processChildren = (children: React.ReactNode): React.ReactNode => {
    if (typeof children === 'string') {
      return <ClickableText text={children} onWordClick={onWordClick} />;
    }
    
    if (React.isValidElement(children)) {
      // handling React elements recursively
      const childProps = children.props as any;
      if (childProps.children) {
        return React.cloneElement(children as any, {
          ...childProps,
          children: processChildren(childProps.children)
        });
      }
      return children;
    }
    
    if (Array.isArray(children)) {
      return children.map((child, index) => (
        <React.Fragment key={index}>
          {processChildren(child)}
        </React.Fragment>
      ));
    }
    
    return children;
  };

  return (
    <div className={`prose prose-slate max-w-none dark:prose-invert prose-quoteless ${className}`}>
      <ReactMarkdown
        components={{
          h1: ({ children }) => <h2>{processChildren(children)}</h2>,
          h2: ({ children }) => <h3>{processChildren(children)}</h3>,
          h3: ({ children }) => <h4>{processChildren(children)}</h4>,
          p: ({ children }) => <p>{processChildren(children)}</p>,
          ul: ({ children }) => <ul className="marker:text-primary">{children}</ul>,
          ol: ({ children }) => <ol>{children}</ol>,
          li: ({ children }) => <li>{processChildren(children)}</li>,
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-secondary pl-4 py-2 my-4 bg-muted/30 rounded-r-md not-italic">
              {processChildren(children)}
            </blockquote>
          ),
          code: ({ children }) => (
            <code className="bg-muted px-2 py-1 rounded text-sm font-mono text-foreground">{children}</code>
          ),
          pre: ({ children }) => (
            <pre className="bg-muted p-4 rounded-lg overflow-x-auto my-4">{children}</pre>
          ),
          strong: ({ children }) => <strong>{processChildren(children)}</strong>,
          em: ({ children }) => <em>{processChildren(children)}</em>,
          a: ({ children, href }) => (
            <a 
              href={href} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-primary no-underline hover:underline"
            >
              {children}
            </a>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};

export default InteractiveMarkdownRenderer;