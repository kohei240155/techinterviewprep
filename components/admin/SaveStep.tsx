'use client';

import Link from 'next/link';
import type { Language } from '@/types';

interface SaveStepProps {
  savedCount: number;
  onGenerateMore: () => void;
  language: Language;
}

const SaveStep = ({ savedCount, onGenerateMore, language }: SaveStepProps) => {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
        <svg
          className="h-8 w-8 text-green-600 dark:text-green-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      </div>

      <h3 className="mb-2 text-xl font-semibold text-gray-900 dark:text-gray-100">
        {language === 'ja' ? '保存完了' : 'Save Complete'}
      </h3>
      <p className="mb-8 text-sm text-gray-600 dark:text-gray-400">
        {language === 'ja'
          ? `${savedCount} 件の問題を保存しました。`
          : `${savedCount} questions have been saved.`}
      </p>

      <div className="flex gap-4">
        <button
          onClick={onGenerateMore}
          className="rounded-lg border border-primary-600 px-6 py-2.5 text-sm font-medium text-primary-600 transition-colors hover:bg-primary-50 dark:border-primary-400 dark:text-primary-400 dark:hover:bg-primary-900/20"
        >
          {language === 'ja' ? 'さらに生成する' : 'Generate More'}
        </button>
        <Link
          href="/admin/questions"
          className="rounded-lg bg-primary-600 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-700"
        >
          {language === 'ja' ? '問題管理へ' : 'Manage Questions'}
        </Link>
      </div>
    </div>
  );
};

export default SaveStep;
