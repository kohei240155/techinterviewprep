'use client';

import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/hooks/useLanguage';
import GenerateWizard from '@/components/admin/GenerateWizard';

const GeneratePage = () => {
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
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">
        {language === 'ja' ? '問題生成' : 'Generate Questions'}
      </h1>
      <GenerateWizard />
    </div>
  );
};

export default GeneratePage;
