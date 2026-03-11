'use client';

import Link from 'next/link';
import { useLanguage } from '@/hooks/useLanguage';
import { t } from '@/lib/i18n';
import { useCategories } from '@/hooks/queries/useCategories';
import Skeleton from '@/components/common/Skeleton';
import type { Category, Topic } from '@/types';

interface CategoryWithTopics extends Category {
  topics: Topic[];
}

const HomePage = () => {
  const { language } = useLanguage();
  const { data: categories, isLoading, error, refetch } = useCategories();

  if (isLoading) {
    return (
      <div>
        <h1 className="text-3xl font-bold">{t('home.title', language)}</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          {t('home.subtitle', language)}
        </p>
        <div className="mt-8 space-y-8">
          {[1, 2, 3].map((i) => (
            <div key={i}>
              <Skeleton variant="text" width="200px" />
              <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3].map((j) => (
                  <Skeleton key={j} variant="card" />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <h1 className="text-3xl font-bold">{t('home.title', language)}</h1>
        <div className="mt-8 rounded-lg border border-red-200 bg-red-50 p-6 text-center dark:border-red-800 dark:bg-red-900/20">
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
      </div>
    );
  }

  const sortedCategories = (categories as CategoryWithTopics[] | undefined)
    ?.slice()
    .sort((a, b) => a.sort_order - b.sort_order);

  return (
    <div>
      <h1 className="text-3xl font-bold">{t('home.title', language)}</h1>
      <p className="mt-2 text-gray-600 dark:text-gray-400">
        {t('home.subtitle', language)}
      </p>

      <div className="mt-8 space-y-10">
        {sortedCategories?.map((category) => {
          const sortedTopics = category.topics
            ?.filter((topic: Topic) => !topic.deleted_at)
            .sort((a: Topic, b: Topic) => a.sort_order - b.sort_order);

          return (
            <section key={category.id}>
              <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
                {language === 'ja' ? category.name_ja : category.name_en}
              </h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {sortedTopics?.map((topic: Topic) => (
                  <Link
                    key={topic.id}
                    href={`/topics/${topic.id}`}
                    className="group rounded-lg border border-gray-200 p-4 transition-colors hover:border-blue-400 hover:bg-blue-50 dark:border-gray-700 dark:hover:border-blue-600 dark:hover:bg-blue-900/20"
                  >
                    <h3 className="font-medium text-gray-900 group-hover:text-blue-600 dark:text-gray-100 dark:group-hover:text-blue-400">
                      {language === 'ja' ? topic.name_ja : topic.name_en}
                    </h3>
                  </Link>
                ))}
              </div>
              {(!sortedTopics || sortedTopics.length === 0) && (
                <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
                  {language === 'ja'
                    ? 'トピックがまだありません'
                    : 'No topics yet'}
                </p>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
};

export default HomePage;
