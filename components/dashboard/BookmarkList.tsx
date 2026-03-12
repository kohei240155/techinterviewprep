'use client';

import Link from 'next/link';
import type { Question, Language } from '@/types';
import { useBookmarkToggle } from '@/hooks/queries/useBookmarks';
import { t } from '@/lib/i18n';

interface BookmarkItem {
  id: string;
  question_id: string;
  questions: Question;
}

interface BookmarkListProps {
  bookmarks: BookmarkItem[];
  userId: string;
  language: Language;
}

const difficultyColor: Record<string, string> = {
  easy: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  medium: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  hard: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};

const typeLabel: Record<string, string> = {
  multiple: 'Multiple',
  code: 'Code',
  truefalse: 'T/F',
  explain: 'Explain',
};

const BookmarkList = ({ bookmarks, userId, language }: BookmarkListProps) => {
  const bookmarkToggle = useBookmarkToggle();

  const handleRemove = (questionId: string) => {
    bookmarkToggle.mutate({
      userId,
      questionId,
      isBookmarked: true,
    });
  };

  return (
    <div className="rounded-lg border border-gray-200 p-6 dark:border-gray-700">
      <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100">
        {t('quiz.bookmark', language)}
      </h3>
      {bookmarks.length === 0 ? (
        <p className="text-gray-500 dark:text-gray-400">
          {language === 'ja' ? 'ブックマークはありません' : 'No bookmarks'}
        </p>
      ) : (
        <ul className="space-y-3">
          {bookmarks.map((bm) => {
            const q = bm.questions;
            return (
              <li
                key={bm.id}
                className="flex items-start justify-between gap-3 rounded-md border border-gray-100 p-3 dark:border-gray-800"
              >
                <div className="min-w-0 flex-1">
                  <Link
                    href={`/topics/${q.topic_id}`}
                    className="text-sm font-medium text-gray-900 hover:text-primary-600 dark:text-gray-100 dark:hover:text-primary-400"
                  >
                    {language === 'ja' ? q.question_ja : q.question_en}
                  </Link>
                  <div className="mt-1 flex gap-2">
                    <span className="badge bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400">
                      {typeLabel[q.type] ?? q.type}
                    </span>
                    <span
                      className={`inline-flex rounded px-2 py-0.5 text-xs font-medium ${difficultyColor[q.difficulty] ?? ''}`}
                    >
                      {q.difficulty}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemove(q.id)}
                  disabled={bookmarkToggle.isPending}
                  className="shrink-0 rounded p-1 text-gray-400 transition-colors hover:text-red-500 disabled:opacity-50"
                  aria-label={language === 'ja' ? 'ブックマークを解除' : 'Remove bookmark'}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="h-5 w-5"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

export default BookmarkList;
