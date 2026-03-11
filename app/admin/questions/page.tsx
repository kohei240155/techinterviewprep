'use client';

import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/hooks/useLanguage';
import QuestionList from '@/components/admin/QuestionList';

const QuestionsPage = () => {
  const { user, isAdmin, isLoading } = useAuth();
  const { language } = useLanguage();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {language === 'ja' ? '読み込み中...' : 'Loading...'}
        </p>
      </div>
    );
  }

  if (!user || !isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <p className="text-sm text-red-600 dark:text-red-400">
          {language === 'ja' ? '管理者権限が必要です' : 'Admin access required'}
        </p>
      </div>
    );
  }

  return (
    <div className="py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          {language === 'ja' ? '問題管理' : 'Manage Questions'}
        </h1>
        <Link
          href="/admin/generate"
          className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-700"
        >
          {language === 'ja' ? '問題を生成' : 'Generate Questions'}
        </Link>
      </div>
      <QuestionList />
    </div>
  );
};

export default QuestionsPage;
