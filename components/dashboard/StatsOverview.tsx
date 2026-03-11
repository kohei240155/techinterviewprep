'use client';

import type { Language } from '@/types';
import { t } from '@/lib/i18n';

interface StatsOverviewProps {
  totalAnswered: number;
  correctCount: number;
  dueReviewCount: number;
  streakDays: number;
  language: Language;
}

const StatsOverview = ({
  totalAnswered,
  correctCount,
  dueReviewCount,
  streakDays,
  language,
}: StatsOverviewProps) => {
  const accuracyPercent = totalAnswered > 0
    ? Math.round((correctCount / totalAnswered) * 100)
    : 0;

  const cards = [
    {
      label: t('dashboard.totalAnswered', language),
      value: totalAnswered,
      bgClass: 'bg-blue-50 dark:bg-blue-950/30',
      borderClass: 'border-blue-200 dark:border-blue-800',
      textClass: 'text-blue-600 dark:text-blue-400',
    },
    {
      label: t('quiz.accuracy', language),
      value: `${accuracyPercent}%`,
      bgClass: 'bg-green-50 dark:bg-green-950/30',
      borderClass: 'border-green-200 dark:border-green-800',
      textClass: 'text-green-600 dark:text-green-400',
    },
    {
      label: t('dashboard.review', language),
      value: dueReviewCount,
      bgClass: 'bg-orange-50 dark:bg-orange-950/30',
      borderClass: 'border-orange-200 dark:border-orange-800',
      textClass: 'text-orange-600 dark:text-orange-400',
    },
    {
      label: t('dashboard.streak', language),
      value: streakDays,
      bgClass: 'bg-purple-50 dark:bg-purple-950/30',
      borderClass: 'border-purple-200 dark:border-purple-800',
      textClass: 'text-purple-600 dark:text-purple-400',
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <div
          key={card.label}
          className={`rounded-lg border p-4 ${card.bgClass} ${card.borderClass}`}
        >
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
            {card.label}
          </p>
          <p className={`mt-1 text-2xl font-bold ${card.textClass}`}>
            {card.value}
          </p>
        </div>
      ))}
    </div>
  );
};

export default StatsOverview;
