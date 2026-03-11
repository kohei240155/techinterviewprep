'use client';

import { t } from '@/lib/i18n';
import type { SessionResult, Language } from '@/types';

interface ResultsSummaryProps {
  result: SessionResult;
  topicId: string;
  onRetry: () => void;
  language: Language;
}

const ResultsSummary = ({ result, topicId, onRetry, language }: ResultsSummaryProps) => {
  const averageRating =
    result.per_question.reduce((sum, q) => {
      const rating = q.feedback?.rating ?? 0;
      return sum + rating;
    }, 0) / result.total_questions;

  const totalSeconds = Math.round(result.total_time_ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return (
    <div className="space-y-6 rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
      <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
        {t('quiz.results', language)}
      </h2>

      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-lg bg-blue-50 p-4 text-center dark:bg-blue-900/30">
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {averageRating.toFixed(1)}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {language === 'ja' ? '平均評価' : 'Avg. Rating'}
          </p>
        </div>
        <div className="rounded-lg bg-green-50 p-4 text-center dark:bg-green-900/30">
          <p className="text-2xl font-bold text-green-600 dark:text-green-400">
            {result.correct_count}/{result.total_questions}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {t('quiz.correct', language)}
          </p>
        </div>
        <div className="rounded-lg bg-gray-50 p-4 text-center dark:bg-gray-700">
          <p className="text-2xl font-bold text-gray-700 dark:text-gray-300">
            {minutes}:{seconds.toString().padStart(2, '0')}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {language === 'ja' ? '合計時間' : 'Total Time'}
          </p>
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="font-semibold text-gray-800 dark:text-gray-200">
          {language === 'ja' ? '問題別結果' : 'Per Question'}
        </h3>
        {result.per_question.map((q, index) => {
          const rating = q.feedback?.rating ?? 0;
          const ratingColor =
            rating <= 2
              ? 'text-red-600 dark:text-red-400'
              : 'text-green-600 dark:text-green-400';

          return (
            <div
              key={q.question_id}
              className="flex items-center justify-between rounded-md border border-gray-100 p-3 dark:border-gray-600"
            >
              <span className="text-sm text-gray-700 dark:text-gray-300">
                {index + 1}. {language === 'ja' ? q.question_ja : q.question_en}
              </span>
              <span className={`font-bold ${ratingColor}`}>
                {rating}/4
              </span>
            </div>
          );
        })}
      </div>

      <div className="flex gap-4">
        <a
          href={`/topics/${topicId}`}
          className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-center text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
        >
          {t('quiz.backToTopic', language)}
        </a>
        <button
          type="button"
          onClick={onRetry}
          className="flex-1 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
        >
          {t('quiz.retry', language)}
        </button>
      </div>
    </div>
  );
};

export default ResultsSummary;
