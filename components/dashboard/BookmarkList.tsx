'use client';

import type { Question } from '@/types';

interface BookmarkListProps {
  bookmarks: Question[];
}

const BookmarkList = ({ bookmarks }: BookmarkListProps) => {
  return (
    <div className="rounded-lg border border-gray-200 p-6 dark:border-gray-700">
      <h3 className="mb-4 text-lg font-semibold">ブックマーク</h3>
      {bookmarks.length === 0 ? (
        <p className="text-gray-500">ブックマークはありません</p>
      ) : (
        <ul className="space-y-2">
          {bookmarks.map((q) => (
            <li key={q.id} className="text-sm">{q.question_ja}</li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default BookmarkList;
