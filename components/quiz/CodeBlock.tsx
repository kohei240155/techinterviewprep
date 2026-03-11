interface CodeBlockProps {
  code: string;
  language?: string;
}

const CodeBlock = ({ code }: CodeBlockProps) => {
  return (
    <pre className="overflow-x-auto rounded-lg bg-gray-900 p-4 text-sm text-gray-100">
      <code>{code}</code>
    </pre>
  );
};

export default CodeBlock;
