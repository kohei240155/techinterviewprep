'use client';

import type { FeedbackResult } from '@/types';

interface FeedbackPanelProps {
  feedback: FeedbackResult;
  modelAnswer?: string;
}

const FeedbackPanel = ({ feedback, modelAnswer }: FeedbackPanelProps) => {
  return (
    <div className="rounded-lg border border-gray-200 p-6 dark:border-gray-700">
      <div className="mb-2 text-lg font-semibold">
        評価: {feedback.rating} / 4
      </div>
      <p className="whitespace-pre-wrap">{feedback.feedback}</p>
      {modelAnswer && (
        <details className="mt-4">
          <summary className="cursor-pointer text-primary-600">模範解答を表示</summary>
          <p className="mt-2 whitespace-pre-wrap">{modelAnswer}</p>
        </details>
      )}
    </div>
  );
};

export default FeedbackPanel;
