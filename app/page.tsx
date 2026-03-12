'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useLanguage } from '@/hooks/useLanguage';
import { useAuth } from '@/hooks/useAuth';
import { t } from '@/lib/i18n';
import { useCategories } from '@/hooks/queries/useCategories';
import { useQuestionCounts } from '@/hooks/queries/useQuestionCounts';
import { useReviewItems } from '@/hooks/queries/useReviewItems';
import { getTopicStyle } from '@/lib/topicStyles';
import Skeleton from '@/components/common/Skeleton';
import Sidebar from '@/components/layout/Sidebar';
import type { Category, Topic, Question, QuestionCount } from '@/types';

interface CategoryWithTopics extends Category {
  topics: Topic[];
}

const QUESTION_COUNTS: QuestionCount[] = [5, 10, 15, 20, 'all'];

const HomePage = () => {
  const { language } = useLanguage();
  const { user } = useAuth();
  const router = useRouter();
  const { data: categories, isLoading, error, refetch } = useCategories();
  const { data: questionCounts } = useQuestionCounts();
  const { data: reviewItems } = useReviewItems(user?.id);

  const [selectedTopicIds, setSelectedTopicIds] = useState<Set<string>>(new Set());
  const [sessionMode, setSessionMode] = useState<'normal' | 'review'>('normal');
  const [questionCount, setQuestionCount] = useState<QuestionCount>(10);

  const sortedCategories = (categories as CategoryWithTopics[] | undefined)
    ?.slice()
    .sort((a, b) => a.sort_order - b.sort_order);

  // Review counts per topic
  const reviewCountsByTopic = useMemo(() => {
    const counts: Record<string, number> = {};
    if (!reviewItems) return counts;
    for (const item of reviewItems) {
      const q = item.questions as unknown as Question | null;
      if (q) {
        counts[q.topic_id] = (counts[q.topic_id] || 0) + 1;
      }
    }
    return counts;
  }, [reviewItems]);

  const toggleTopic = (topicId: string) => {
    setSelectedTopicIds((prev) => {
      const next = new Set(prev);
      if (next.has(topicId)) {
        next.delete(topicId);
      } else {
        next.add(topicId);
      }
      return next;
    });
  };

  const toggleCategory = (categoryTopics: Topic[]) => {
    const activeTopics = categoryTopics.filter((t) => !t.deleted_at);
    const allSelected = activeTopics.every((t) => selectedTopicIds.has(t.id));
    setSelectedTopicIds((prev) => {
      const next = new Set(prev);
      for (const topic of activeTopics) {
        if (allSelected) {
          next.delete(topic.id);
        } else {
          next.add(topic.id);
        }
      }
      return next;
    });
  };

  const getCategoryCheckState = (categoryTopics: Topic[]): 'none' | 'some' | 'all' => {
    const activeTopics = categoryTopics.filter((t) => !t.deleted_at);
    if (activeTopics.length === 0) return 'none';
    const selectedCount = activeTopics.filter((t) => selectedTopicIds.has(t.id)).length;
    if (selectedCount === 0) return 'none';
    if (selectedCount === activeTopics.length) return 'all';
    return 'some';
  };

  const selectedReviewCount = useMemo(() => {
    if (selectedTopicIds.size === 0) return 0;
    let count = 0;
    for (const topicId of selectedTopicIds) {
      count += reviewCountsByTopic[topicId] ?? 0;
    }
    return count;
  }, [selectedTopicIds, reviewCountsByTopic]);

  const handleStartQuiz = () => {
    const topicIdsStr = Array.from(selectedTopicIds).join(',');
    if (sessionMode === 'review') {
      router.push(`/quiz/session?topics=${topicIdsStr}&mode=review`);
    } else {
      const countStr = questionCount === 'all' ? 'all' : String(questionCount);
      router.push(`/quiz/session?topics=${topicIdsStr}&mode=new&count=${countStr}`);
    }
  };

  const canStart = selectedTopicIds.size > 0 && (
    sessionMode === 'normal' || (sessionMode === 'review' && user && selectedReviewCount > 0)
  );

  if (isLoading) {
    return (
      <div className="flex flex-col gap-8 lg:flex-row">
        <Sidebar currentPath="/" />
        <section className="flex-1">
          <h1 className="text-4xl font-black tracking-tight md:text-5xl">{t('home.title', language)}</h1>
          <p className="mt-2 text-lg text-slate-500">{t('home.subtitle', language)}</p>
          <div className="mt-8 space-y-8">
            {[1, 2, 3].map((i) => (
              <div key={i}>
                <Skeleton variant="text" width="200px" />
                <div className="mt-4 space-y-2">
                  {[1, 2, 3].map((j) => (
                    <Skeleton key={j} variant="row" />
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
            <p className="text-red-600 dark:text-red-400">{t('common.error', language)}</p>
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
      <section className="flex-1 pb-28">
        {/* Hero */}
        <div>
          <h1 className="text-4xl font-black tracking-tight md:text-5xl">
            {t('home.title', language)}
          </h1>
          <p className="mt-2 text-lg text-slate-500">{t('home.subtitle', language)}</p>
          <p className="mt-1 text-sm text-slate-400">{t('home.subtitle2', language)}</p>
        </div>

        {/* Mode selector */}
        <div className="mt-8 flex items-center gap-3">
          <label className="text-sm font-medium text-slate-600 dark:text-slate-400">
            {language === 'ja' ? 'モード' : 'Mode'}
          </label>
          <select
            value={sessionMode}
            onChange={(e) => setSessionMode(e.target.value as 'normal' | 'review')}
            className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
          >
            <option value="normal">{t('home.practiceMode', language)}</option>
            <option value="review">
              {t('home.reviewMode', language)}
            </option>
          </select>
          {sessionMode === 'review' && !user && (
            <Link href="/login" className="text-sm font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400">
              {t('common.login', language)}
            </Link>
          )}
        </div>

        {/* Topic list */}
        <div className="mt-6 space-y-8">
          {sortedCategories?.map((category) => {
            const sortedTopics = category.topics
              ?.filter((topic: Topic) => !topic.deleted_at)
              .sort((a: Topic, b: Topic) => a.sort_order - b.sort_order);
            const checkState = getCategoryCheckState(category.topics ?? []);

            return (
              <section key={category.id}>
                <div className="flex items-center gap-3">
                  <CategoryCheckbox
                    checkState={checkState}
                    onChange={() => toggleCategory(category.topics ?? [])}
                  />
                  <span className="h-8 w-1.5 rounded-full bg-primary-600" />
                  <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200">
                    {language === 'ja' ? category.name_ja : category.name_en}
                  </h2>
                </div>
                <div className="mt-3 space-y-1">
                  {sortedTopics?.map((topic: Topic) => {
                    const style = getTopicStyle(topic.name_en);
                    const count = sessionMode === 'review'
                      ? (reviewCountsByTopic[topic.id] ?? 0)
                      : (questionCounts?.[topic.id] ?? 0);
                    const isSelected = selectedTopicIds.has(topic.id);

                    return (
                      <label
                        key={topic.id}
                        className={`flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 transition-colors ${
                          isSelected
                            ? 'bg-primary-50 dark:bg-primary-900/20'
                            : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleTopic(topic.id)}
                          className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500 dark:border-gray-600"
                        />
                        <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${style.bgClass}`}>
                          <span className={`material-symbols-outlined text-base ${style.textClass}`}>
                            {style.icon}
                          </span>
                        </div>
                        <span className="flex-1 text-sm font-medium text-gray-900 dark:text-gray-100">
                          {language === 'ja' ? topic.name_ja : topic.name_en}
                        </span>
                        {count > 0 && (
                          <span className={`badge text-xs ${sessionMode === 'review' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300' : ''}`}>
                            {t('home.questionCount', language).replace('{count}', String(count))}
                          </span>
                        )}
                      </label>
                    );
                  })}
                </div>
                {(!sortedTopics || sortedTopics.length === 0) && (
                  <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
                    {language === 'ja' ? 'トピックがまだありません' : 'No topics yet'}
                  </p>
                )}
              </section>
            );
          })}
        </div>
      </section>

      {/* Bottom fixed bar */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-gray-200 bg-white/95 backdrop-blur dark:border-gray-700 dark:bg-gray-900/95">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3">
          <div className="text-sm text-slate-600 dark:text-slate-400">
            {t('home.selectedCount', language).replace('{count}', String(selectedTopicIds.size))}
            {sessionMode === 'review' && selectedTopicIds.size > 0 && (
              <span className="ml-2 text-orange-600 dark:text-orange-400">
                ({language === 'ja' ? `復習${selectedReviewCount}問` : `${selectedReviewCount} due`})
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            {sessionMode === 'normal' && (
              <select
                value={questionCount === 'all' ? 'all' : String(questionCount)}
                onChange={(e) => {
                  const v = e.target.value;
                  setQuestionCount(v === 'all' ? 'all' : (Number(v) as QuestionCount));
                }}
                className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
              >
                {QUESTION_COUNTS.map((c) => (
                  <option key={c} value={c === 'all' ? 'all' : String(c)}>
                    {c === 'all' ? (language === 'ja' ? '全問' : 'All') : `${c}${language === 'ja' ? '問' : ''}`}
                  </option>
                ))}
              </select>
            )}
            <button
              onClick={handleStartQuiz}
              disabled={!canStart}
              className={`rounded-lg px-6 py-2 text-sm font-semibold text-white transition-colors ${
                canStart
                  ? 'bg-primary-600 hover:bg-primary-700 active:scale-[0.98]'
                  : 'cursor-not-allowed bg-gray-400'
              }`}
            >
              {sessionMode === 'review' ? t('home.startReview', language) : t('home.startQuiz', language)}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

/** Checkbox with indeterminate support for category headers */
const CategoryCheckbox = ({
  checkState,
  onChange,
}: {
  checkState: 'none' | 'some' | 'all';
  onChange: () => void;
}) => {
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (ref.current) {
      ref.current.indeterminate = checkState === 'some';
    }
  }, [checkState]);

  return (
    <input
      ref={ref}
      type="checkbox"
      checked={checkState === 'all'}
      onChange={onChange}
      className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500 dark:border-gray-600"
    />
  );
};

export default HomePage;
