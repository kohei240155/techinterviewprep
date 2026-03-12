import CodeBlock from '@/components/quiz/CodeBlock';

interface MarkdownTextProps {
  children: string;
  className?: string;
}

const CODE_BLOCK_REGEX = /```(\w+)?\n([\s\S]*?)```/g;

const renderInline = (text: string): React.ReactNode[] => {
  const parts: React.ReactNode[] = [];
  // Process inline code and bold
  const inlineRegex = /(`[^`]+`|\*\*[^*]+\*\*)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = inlineRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    const token = match[0];
    if (token.startsWith('`')) {
      parts.push(
        <code key={match.index} className="rounded bg-gray-200 px-1.5 py-0.5 text-sm font-mono text-primary-700 dark:bg-gray-700 dark:text-primary-300">
          {token.slice(1, -1)}
        </code>
      );
    } else {
      parts.push(<strong key={match.index}>{token.slice(2, -2)}</strong>);
    }
    lastIndex = match.index + token.length;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts;
};

const renderTextSegment = (text: string, baseKey: string): React.ReactNode => {
  // Split by double newline into paragraphs
  const paragraphs = text.split(/\n\n+/);

  return paragraphs.map((paragraph, pIdx) => {
    // Split single newlines into lines with <br/>
    const lines = paragraph.split('\n');
    const content = lines.flatMap((line, lIdx) => {
      const inlined = renderInline(line);
      if (lIdx < lines.length - 1) {
        return [...inlined, <br key={`${baseKey}-br-${pIdx}-${lIdx}`} />];
      }
      return inlined;
    });

    return (
      <p key={`${baseKey}-p-${pIdx}`} className={pIdx > 0 ? 'mt-2' : undefined}>
        {content}
      </p>
    );
  });
};

const MarkdownText = ({ children, className }: MarkdownTextProps) => {
  const text = children;

  // Split by code blocks
  const segments: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  const regex = new RegExp(CODE_BLOCK_REGEX);

  while ((match = regex.exec(text)) !== null) {
    // Text before the code block
    if (match.index > lastIndex) {
      const before = text.slice(lastIndex, match.index).trim();
      if (before) {
        segments.push(
          <span key={`text-${lastIndex}`}>
            {renderTextSegment(before, `seg-${lastIndex}`)}
          </span>
        );
      }
    }

    // Code block
    segments.push(
      <CodeBlock
        key={`code-${match.index}`}
        code={match[2].trim()}
        language={match[1] || undefined}
      />
    );

    lastIndex = match.index + match[0].length;
  }

  // Remaining text after last code block
  const remaining = text.slice(lastIndex).trim();
  if (remaining) {
    segments.push(
      <span key={`text-${lastIndex}`}>
        {renderTextSegment(remaining, `seg-${lastIndex}`)}
      </span>
    );
  }

  return <div className={className}>{segments}</div>;
};

export default MarkdownText;
