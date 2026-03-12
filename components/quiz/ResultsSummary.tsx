'use client';

import Link from 'next/link';
import type { SessionResult, Language, ProgressResult } from '@/types';
import { t } from '@/lib/i18n';

interface ResultsSummaryProps {
  result: SessionResult;
  topicId: string;
  onRetry: () => void;
  language: Language;
}

const formatTime = (ms: number): string => {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

const resultColorClass = (result: ProgressResult): string => {
  switch (result) {
    case 'correct':
      return 'text-success-600 dark:text-success-400';
    case 'wrong':
      return 'text-danger-600 dark:text-danger-400';
    case 'skipped':
      return 'text-gray-500 dark:text-gray-400';
  }
};

const resultBorderClass = (result: ProgressResult): string => {
  switch (result) {
    case 'correct':
      return 'border-l-success-500';
    case 'wrong':
      return 'border-l-danger-500';
    case 'skipped':
      return 'border-l-gray-400';
  }
};

const ResultsSummary = ({ result, topicId, onRetry, language }: ResultsSummaryProps) => {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h2 className="text-center text-2xl font-bold dark:text-gray-100">
        {t('quiz.results', language)}
      </h2>

      {/* Summary stats */}
      <div className="card p-6">
        <div className="text-center">
          <p className="text-5xl font-bold tracking-tight text-primary-600 dark:text-primary-400">
            {result.accuracy_percent}%
          </p>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {t('quiz.accuracy', language)}
          </p>
        </div>

        <div className="mt-6 grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-2xl font-semibold tracking-tight text-success-600 dark:text-success-400">
              {result.correct_count}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {t('quiz.correct', language)}
            </p>
          </div>
          <div>
            <p className="text-2xl font-semibold tracking-tight text-danger-600 dark:text-danger-400">
              {result.wrong_count}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {t('quiz.wrong', language)}
            </p>
          </div>
          <div>
            <p className="text-2xl font-semibold tracking-tight text-gray-500 dark:text-gray-400">
              {result.skipped_count}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {t('quiz.skipped', language)}
            </p>
          </div>
        </div>

        <div className="mt-4 text-center text-sm text-gray-500 dark:text-gray-400">
          {language === 'ja' ? '所要時間' : 'Time'}: {formatTime(result.total_time_ms)}
        </div>
      </div>

      {/* Per-question results */}
      <div className="space-y-2">
        {result.per_question.map((pq, index) => {
          const questionText = language === 'ja' ? pq.question_ja : pq.question_en;
          const resultLabel = t(
            pq.result === 'correct' ? 'quiz.correct' : pq.result === 'wrong' ? 'quiz.wrong' : 'quiz.skipped',
            language
          );

          return (
            <div
              key={pq.question_id}
              className={`rounded-r-xl border-l-4 bg-white p-3 shadow-card dark:bg-gray-900 ${resultBorderClass(pq.result)}`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <p className="text-sm dark:text-gray-200">
                    <span className="mr-2 font-medium text-gray-400">
                      {index + 1}.
                    </span>
                    {questionText.length > 80 ? `${questionText.slice(0, 80)}...` : questionText}
                  </p>
                </div>
                <span className={`shrink-0 text-sm font-medium ${resultColorClass(pq.result)}`}>
                  {resultLabel}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Action buttons */}
      <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
        <button
          type="button"
          onClick={onRetry}
          className="btn-primary px-6 py-2.5"
        >
          {t('quiz.retry', language)}
        </button>
        <Link
          href={`/topics/${topicId}`}
          className="btn-secondary px-6 py-2.5"
        >
          {t('quiz.backToTopic', language)}
        </Link>
      </div>
    </div>
  );
};

export default ResultsSummary;
