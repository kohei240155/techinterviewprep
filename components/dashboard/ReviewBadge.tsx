'use client';

import Link from 'next/link';
import type { Language } from '@/types';
import { t } from '@/lib/i18n';

interface ReviewBadgeProps {
  count: number;
  language: Language;
}

const ReviewBadge = ({ count, language }: ReviewBadgeProps) => {
  if (count === 0) return null;

  const label = language === 'ja'
    ? `${count} 問の復習が必要です`
    : `${count} review${count > 1 ? 's' : ''} due`;

  return (
    <Link
      href="/dashboard"
      className="inline-flex items-center gap-2 rounded-full bg-orange-100 px-4 py-2 text-sm font-medium text-orange-700 transition-colors hover:bg-orange-200 dark:bg-orange-900/30 dark:text-orange-400 dark:hover:bg-orange-900/50"
    >
      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-orange-500 text-xs font-bold text-white">
        {count}
      </span>
      {t('dashboard.review', language)}
      <span className="sr-only">{label}</span>
    </Link>
  );
};

export default ReviewBadge;
