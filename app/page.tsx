'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useLanguage } from '@/hooks/useLanguage';
import { t } from '@/lib/i18n';
import { useCategories } from '@/hooks/queries/useCategories';
import { getTopicStyle } from '@/lib/topicStyles';
import Skeleton from '@/components/common/Skeleton';
import Sidebar from '@/components/layout/Sidebar';
import type { Category, Topic } from '@/types';

interface CategoryWithTopics extends Category {
  topics: Topic[];
}

const HomePage = () => {
  const { language } = useLanguage();
  const { data: categories, isLoading, error, refetch } = useCategories();
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const sortedCategories = (categories as CategoryWithTopics[] | undefined)
    ?.slice()
    .sort((a, b) => a.sort_order - b.sort_order);

  const filteredCategories = activeCategory
    ? sortedCategories?.filter((c) => c.id === activeCategory)
    : sortedCategories;

  if (isLoading) {
    return (
      <div className="flex flex-col gap-8 lg:flex-row">
        <Sidebar currentPath="/" />
        <section className="flex-1">
          <h1 className="text-4xl font-black tracking-tight md:text-5xl">{t('home.title', language)}</h1>
          <p className="mt-2 text-lg text-slate-500">
            {t('home.subtitle', language)}
          </p>
          <div className="mt-8 space-y-8">
            {[1, 2, 3].map((i) => (
              <div key={i}>
                <Skeleton variant="text" width="200px" />
                <div className="mt-4 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                  {[1, 2, 3].map((j) => (
                    <Skeleton key={j} variant="card" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col gap-8 lg:flex-row">
        <Sidebar currentPath="/" />
        <section className="flex-1">
          <h1 className="text-4xl font-black tracking-tight md:text-5xl">{t('home.title', language)}</h1>
          <div className="mt-8 card p-6 text-center border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20">
            <p className="text-red-600 dark:text-red-400">
              {t('common.error', language)}
            </p>
            <button
              onClick={() => refetch()}
              className="mt-4 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 active:scale-[0.98]"
            >
              {t('common.retry', language)}
            </button>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 lg:flex-row">
      <Sidebar currentPath="/" />
      <section className="flex-1">
        {/* Hero */}
        <div>
          <h1 className="text-4xl font-black tracking-tight md:text-5xl">
            {t('home.title', language)}
          </h1>
          <p className="mt-2 text-lg text-slate-500">
            {t('home.subtitle', language)}
          </p>
          <p className="mt-1 text-sm text-slate-400">
            {t('home.subtitle2', language)}
          </p>
          <Link
            href="/dashboard"
            className="btn-primary mt-4 gap-2"
          >
            <span className="material-symbols-outlined text-lg">trending_up</span>
            {t('home.viewProgress', language)}
          </Link>
        </div>

        {/* Category tabs */}
        {sortedCategories && sortedCategories.length > 1 && (
          <div className="mt-8 flex gap-1 overflow-x-auto border-b border-gray-200 dark:border-gray-700/60">
            <button
              onClick={() => setActiveCategory(null)}
              className={`shrink-0 border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
                activeCategory === null
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              {language === 'ja' ? 'すべて' : 'All'}
            </button>
            {sortedCategories.map((category) => (
              <button
                key={category.id}
                onClick={() => setActiveCategory(category.id)}
                className={`shrink-0 border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
                  activeCategory === category.id
                    ? 'border-primary-600 text-primary-600'
                    : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
              >
                {language === 'ja' ? category.name_ja : category.name_en}
              </button>
            ))}
          </div>
        )}

        {/* Topic cards by category */}
        <div className="mt-8 space-y-10">
          {filteredCategories?.map((category) => {
            const sortedTopics = category.topics
              ?.filter((topic: Topic) => !topic.deleted_at)
              .sort((a: Topic, b: Topic) => a.sort_order - b.sort_order);

            return (
              <section key={category.id}>
                <div className="flex items-center gap-3">
                  <span className="h-8 w-1.5 rounded-full bg-primary-600" />
                  <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200">
                    {language === 'ja' ? category.name_ja : category.name_en}
                  </h2>
                </div>
                <div className="mt-4 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                  {sortedTopics?.map((topic: Topic) => {
                    const style = getTopicStyle(topic.name_en);
                    return (
                      <Link
                        key={topic.id}
                        href={`/topics/${topic.id}`}
                        className="card-interactive group p-5"
                      >
                        <div className="flex items-start gap-4">
                          <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${style.bgClass}`}>
                            <span className={`material-symbols-outlined text-xl ${style.textClass}`}>
                              {style.icon}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-gray-900 group-hover:text-primary-600 dark:text-gray-100 dark:group-hover:text-primary-400">
                              {language === 'ja' ? topic.name_ja : topic.name_en}
                            </h3>
                          </div>
                        </div>
                        <div className="mt-3 flex items-center justify-end">
                          <span className="material-symbols-outlined text-lg text-slate-400 transition-transform group-hover:translate-x-1 group-hover:text-primary-600 dark:group-hover:text-primary-400">
                            arrow_forward
                          </span>
                        </div>
                      </Link>
                    );
                  })}
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
      </section>
    </div>
  );
};

export default HomePage;
