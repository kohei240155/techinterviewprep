interface CodeBlockProps {
  code: string;
  language?: string;
}

const CodeBlock = ({ code, language }: CodeBlockProps) => {
  return (
    <div className="my-4 overflow-hidden rounded-lg border border-gray-700">
      {language && (
        <div className="border-b border-gray-700 bg-gray-800 px-4 py-1.5 text-xs text-gray-400">
          {language}
        </div>
      )}
      <pre className="overflow-x-auto bg-gray-900 p-4 text-sm leading-relaxed text-gray-100">
        <code>{code}</code>
      </pre>
    </div>
  );
};

export default CodeBlock;
