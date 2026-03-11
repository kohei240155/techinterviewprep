'use client';

import type { SessionResult } from '@/types';

interface ResultsSummaryProps {
  results: SessionResult;
}

const QuizResultsSummary = ({ results }: ResultsSummaryProps) => {
  return (
    <div className="rounded-lg border border-gray-200 p-6 dark:border-gray-700">
      <h2 className="text-xl font-bold">セッション結果</h2>
      <p className="mt-2">正答率: {results.accuracy_percent}%</p>
      <p>正解: {results.correct_count} / {results.total_questions}</p>
      {/* TODO: 詳細な結果表示 */}
    </div>
  );
};

export default QuizResultsSummary;
