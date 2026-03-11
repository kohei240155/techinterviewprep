'use client';

interface ChatPanelProps {
  topicContext: string;
  isOpen: boolean;
  onClose: () => void;
}

const ChatPanel = ({ topicContext, isOpen, onClose }: ChatPanelProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 w-full max-w-md border-l border-gray-200 bg-white p-4 shadow-lg dark:border-gray-700 dark:bg-gray-900">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">AI チャット</h3>
        <button onClick={onClose} className="text-gray-500 hover:text-gray-700">✕</button>
      </div>
      {/* TODO: チャット履歴・入力エリア */}
      <p className="mt-4 text-sm text-gray-500">Topic: {topicContext}</p>
    </div>
  );
};

export default ChatPanel;
