'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/hooks/useLanguage';
import { t } from '@/lib/i18n';
import { useQuestions } from '@/hooks/queries/useQuestions';
import Skeleton from '@/components/common/Skeleton';
import type { Question, QuestionType, Difficulty } from '@/types';

const typeLabels: Record<QuestionType, { ja: string; en: string }> = {
  multiple: { ja: '選択式', en: 'Multiple Choice' },
  code: { ja: 'コードリーディング', en: 'Code Reading' },
  truefalse: { ja: 'True/False', en: 'True/False' },
  explain: { ja: '口頭説明', en: 'Explanation' },
};

const typeColors: Record<QuestionType, string> = {
  multiple: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  code: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
  truefalse: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  explain: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
};

const difficultyColors: Record<Difficulty, string> = {
  easy: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300',
  medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
  hard: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
};

const TopicDetailPage = () => {
  const params = useParams();
  const topicId = params.topicId as string;
  const { user } = useAuth();
  const { language } = useLanguage();
  const { data: questions, isLoading, error, refetch } = useQuestions(topicId);

  if (isLoading) {
    return (
      <div>
        <Skeleton variant="text" width="300px" height="32px" />
        <div className="mt-6 space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} variant="row" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center dark:border-red-800 dark:bg-red-900/20">
        <p className="text-red-600 dark:text-red-400">
          {t('common.error', language)}
        </p>
        <button
          onClick={() => refetch()}
          className="mt-4 rounded-md bg-red-600 px-4 py-2 text-sm text-white hover:bg-red-700"
        >
          {t('common.retry', language)}
        </button>
      </div>
    );
  }

  const typedQuestions = (questions as Question[] | undefined) ?? [];

  const typeCounts = typedQuestions.reduce<Record<QuestionType, number>>(
    (acc, q) => {
      acc[q.type] = (acc[q.type] || 0) + 1;
      return acc;
    },
    { multiple: 0, code: 0, truefalse: 0, explain: 0 }
  );

  const difficultyCounts = typedQuestions.reduce<Record<Difficulty, number>>(
    (acc, q) => {
      acc[q.difficulty] = (acc[q.difficulty] || 0) + 1;
      return acc;
    },
    { easy: 0, medium: 0, hard: 0 }
  );

  const hasQuizQuestions = typeCounts.multiple > 0 || typeCounts.code > 0 || typeCounts.truefalse > 0;
  const hasExplainQuestions = typeCounts.explain > 0;

  return (
    <div>
      <Link
        href="/"
        className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
      >
        &larr; {t('home.title', language)}
      </Link>

      <h1 className="mt-4 text-2xl font-bold">
        {t('topic.detail', language)}
      </h1>

      <div className="mt-6 rounded-lg border border-gray-200 p-6 dark:border-gray-700">
        <h2 className="text-lg font-semibold">
          {t('topic.questions', language)}: {typedQuestions.length}
        </h2>

        {/* Type breakdown */}
        <div className="mt-4">
          <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">
            {language === 'ja' ? '種別' : 'By Type'}
          </h3>
          <div className="mt-2 flex flex-wrap gap-2">
            {(Object.keys(typeCounts) as QuestionType[])
              .filter((type) => typeCounts[type] > 0)
              .map((type) => (
                <span
                  key={type}
                  className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${typeColors[type]}`}
                >
                  {language === 'ja' ? typeLabels[type].ja : typeLabels[type].en}: {typeCounts[type]}
                </span>
              ))}
          </div>
        </div>

        {/* Difficulty breakdown */}
        <div className="mt-4">
          <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">
            {language === 'ja' ? '難易度' : 'By Difficulty'}
          </h3>
          <div className="mt-2 flex flex-wrap gap-2">
            {(Object.keys(difficultyCounts) as Difficulty[])
              .filter((diff) => difficultyCounts[diff] > 0)
              .map((diff) => (
                <span
                  key={diff}
                  className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${difficultyColors[diff]}`}
                >
                  {t(`difficulty.${diff}`, language)}: {difficultyCounts[diff]}
                </span>
              ))}
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="mt-6 flex flex-wrap gap-4">
        {hasQuizQuestions && (
          <Link
            href={`/quiz/${topicId}`}
            className="rounded-md bg-blue-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
          >
            {t('quiz.start', language)}
          </Link>
        )}
        {hasExplainQuestions && (
          <Link
            href={`/explain/${topicId}`}
            className="rounded-md bg-orange-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-orange-700"
          >
            {t('explain.start', language)}
          </Link>
        )}
      </div>

      {typedQuestions.length === 0 && (
        <p className="mt-6 text-gray-500 dark:text-gray-400">
          {language === 'ja'
            ? 'このトピックにはまだ問題がありません'
            : 'No questions available for this topic yet'}
        </p>
      )}
    </div>
  );
};

export default TopicDetailPage;
