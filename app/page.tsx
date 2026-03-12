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
import ExplainQuestionList from '@/components/explain/ExplainQuestionList';
import { useProgress } from '@/hooks/queries/useProgress';
import type { Category, Topic, Question, QuestionCount, Difficulty, QuizQuestionType } from '@/types';

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

  const ALL_DIFFICULTIES: Difficulty[] = ['easy', 'medium', 'hard'];
  const ALL_TYPES: QuizQuestionType[] = ['multiple', 'code', 'truefalse'];

  const [activeTab, setActiveTab] = useState<'quiz' | 'explain'>('quiz');
  const [expandedTopicId, setExpandedTopicId] = useState<string | null>(null);
  const [selectedTopicIds, setSelectedTopicIds] = useState<Set<string>>(new Set());
  const [sessionMode, setSessionMode] = useState<'normal' | 'review'>('normal');
  const [questionCount, setQuestionCount] = useState<QuestionCount>(10);
  const [optionsExpanded, setOptionsExpanded] = useState(false);
  const [selectedDifficulties, setSelectedDifficulties] = useState<Set<Difficulty>>(new Set(ALL_DIFFICULTIES));
  const [selectedTypes, setSelectedTypes] = useState<Set<QuizQuestionType>>(new Set(ALL_TYPES));
  const [unansweredOnly, setUnansweredOnly] = useState(false);

  const { data: progressData } = useProgress(user?.id);

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

  const toggleDifficulty = (d: Difficulty) => {
    setSelectedDifficulties((prev) => {
      const next = new Set(prev);
      if (next.has(d)) {
        if (next.size > 1) next.delete(d);
      } else {
        next.add(d);
      }
      return next;
    });
  };

  const toggleType = (type: QuizQuestionType) => {
    setSelectedTypes((prev) => {
      const next = new Set(prev);
      if (next.has(type)) {
        if (next.size > 1) next.delete(type);
      } else {
        next.add(type);
      }
      return next;
    });
  };

  const handleStartQuiz = () => {
    const topicIdsStr = Array.from(selectedTopicIds).join(',');
    if (sessionMode === 'review') {
      router.push(`/quiz/session?topics=${topicIdsStr}&mode=review`);
    } else {
      const countStr = questionCount === 'all' ? 'all' : String(questionCount);
      const params = new URLSearchParams();
      params.set('topics', topicIdsStr);
      params.set('mode', 'new');
      params.set('count', countStr);
      if (selectedDifficulties.size < ALL_DIFFICULTIES.length) {
        params.set('difficulty', Array.from(selectedDifficulties).join(','));
      }
      if (selectedTypes.size < ALL_TYPES.length) {
        params.set('types', Array.from(selectedTypes).join(','));
      }
      if (unansweredOnly) {
        params.set('unanswered', '1');
      }
      router.push(`/quiz/session?${params.toString()}`);
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

        {/* Tab bar */}
        <div className="mt-6 flex border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setActiveTab('quiz')}
            className={`px-4 py-2.5 text-sm font-semibold transition-colors ${
              activeTab === 'quiz'
                ? 'border-b-2 border-primary-600 text-primary-600 dark:text-primary-400 dark:border-primary-400'
                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            {t('home.tabQuiz', language)}
          </button>
          <button
            onClick={() => setActiveTab('explain')}
            className={`px-4 py-2.5 text-sm font-semibold transition-colors ${
              activeTab === 'explain'
                ? 'border-b-2 border-primary-600 text-primary-600 dark:text-primary-400 dark:border-primary-400'
                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            {t('home.tabExplain', language)}
          </button>
        </div>

        {/* Quiz tab */}
        {activeTab === 'quiz' && (
          <>
            {/* Mode selector */}
            <div className="mt-6 flex items-center gap-3">
              <label className="text-sm font-medium text-slate-600 dark:text-slate-400">
                {language === 'ja' ? 'モード' : 'Mode'}
              </label>
              <select
                value={sessionMode}
                onChange={(e) => {
                  const mode = e.target.value as 'normal' | 'review';
                  setSessionMode(mode);
                  if (mode === 'review') setUnansweredOnly(false);
                }}
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

            {/* Options (Normal mode only) */}
            {sessionMode === 'normal' && (
              <div className="mt-4">
                <button
                  type="button"
                  onClick={() => setOptionsExpanded((v) => !v)}
                  className="flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
                >
                  <span className="material-symbols-outlined text-base">tune</span>
                  {t('home.options', language)}
                  <span className="material-symbols-outlined text-base">
                    {optionsExpanded ? 'expand_less' : 'expand_more'}
                  </span>
                </button>
                {optionsExpanded && (
                  <div className="card mt-2 space-y-4 p-4">
                    {/* Difficulty */}
                    <div>
                      <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                        {t('home.difficulty', language)}
                      </label>
                      <div className="flex flex-wrap gap-3">
                        {ALL_DIFFICULTIES.map((d) => (
                          <label key={d} className="flex items-center gap-1.5 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={selectedDifficulties.has(d)}
                              onChange={() => toggleDifficulty(d)}
                              className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500 dark:border-gray-600"
                            />
                            <span className="text-sm text-gray-700 dark:text-gray-300">
                              {t(`difficulty.${d}`, language)}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>
                    {/* Question type */}
                    <div>
                      <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                        {t('home.questionType', language)}
                      </label>
                      <div className="flex flex-wrap gap-3">
                        {ALL_TYPES.map((type) => (
                          <label key={type} className="flex items-center gap-1.5 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={selectedTypes.has(type)}
                              onChange={() => toggleType(type)}
                              className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500 dark:border-gray-600"
                            />
                            <span className="text-sm text-gray-700 dark:text-gray-300">
                              {t(`type.${type}`, language)}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>
                    {/* Unanswered only */}
                    <div>
                      <label className={`flex items-center gap-1.5 ${user ? 'cursor-pointer' : 'cursor-not-allowed opacity-60'}`}>
                        <input
                          type="checkbox"
                          checked={unansweredOnly}
                          onChange={(e) => setUnansweredOnly(e.target.checked)}
                          disabled={!user}
                          className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500 dark:border-gray-600"
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300">
                          {t('home.unansweredOnly', language)}
                        </span>
                        {!user && (
                          <span className="text-xs text-slate-400 dark:text-slate-500">
                            ({t('home.loginRequired', language)})
                          </span>
                        )}
                      </label>
                    </div>
                  </div>
                )}
              </div>
            )}

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
                          : (questionCounts?.quiz[topic.id] ?? 0);
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
          </>
        )}

        {/* Explain tab */}
        {activeTab === 'explain' && (
          <div className="mt-6 space-y-10">
            {sortedCategories?.map((category) => {
              const sortedTopics = category.topics
                ?.filter((topic: Topic) => !topic.deleted_at)
                .sort((a: Topic, b: Topic) => a.sort_order - b.sort_order);

              if (!sortedTopics || sortedTopics.length === 0) return null;

              return (
                <section key={category.id}>
                  {/* Category header */}
                  <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center gap-3">
                      <span className="h-8 w-1.5 rounded-full bg-primary-600" />
                      <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200">
                        {language === 'ja' ? category.name_ja : category.name_en}
                      </h2>
                    </div>
                    <span className="text-xs font-semibold uppercase tracking-wider text-primary-500 dark:text-primary-400">
                      {sortedTopics.length} {language === 'ja' ? 'モジュール' : 'MODULES'}
                    </span>
                  </div>

                  {/* Topic cards grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {sortedTopics.map((topic: Topic) => {
                      const style = getTopicStyle(topic.name_en);
                      const count = questionCounts?.explain[topic.id] ?? 0;
                      const isExpanded = expandedTopicId === topic.id;

                      return (
                        <button
                          key={topic.id}
                          type="button"
                          onClick={() => setExpandedTopicId(isExpanded ? null : topic.id)}
                          className={`card-interactive flex flex-col items-start p-5 text-left transition-all ${
                            isExpanded
                              ? 'ring-2 ring-primary-500 dark:ring-primary-400'
                              : ''
                          }`}
                        >
                          {/* Top row: icon + count badge */}
                          <div className="flex w-full items-start justify-between">
                            <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${style.bgClass}`}>
                              <span className={`material-symbols-outlined text-xl ${style.textClass}`}>
                                {style.icon}
                              </span>
                            </div>
                            {count > 0 && (
                              <span className="badge text-xs">
                                {t('home.questionCount', language).replace('{count}', String(count))}
                              </span>
                            )}
                          </div>

                          {/* Title */}
                          <h3 className="mt-4 text-base font-bold text-gray-900 dark:text-gray-100 leading-snug">
                            {language === 'ja' ? topic.name_ja : topic.name_en}
                          </h3>
                        </button>
                      );
                    })}
                  </div>

                  {/* Expanded question list (below the grid, within the category) */}
                  {sortedTopics.some((topic) => expandedTopicId === topic.id) && (
                    <div className="mt-4 card p-4">
                      <div className="mb-2 flex items-center justify-between">
                        <h3 className="text-sm font-bold text-gray-800 dark:text-gray-200">
                          {language === 'ja'
                            ? (sortedTopics.find((t) => t.id === expandedTopicId)?.name_ja ?? '')
                            : (sortedTopics.find((t) => t.id === expandedTopicId)?.name_en ?? '')}
                        </h3>
                        <button
                          type="button"
                          onClick={() => setExpandedTopicId(null)}
                          className="flex h-7 w-7 items-center justify-center rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
                        >
                          <span className="material-symbols-outlined text-lg text-gray-500">close</span>
                        </button>
                      </div>
                      <ExplainQuestionList topicId={expandedTopicId!} />
                    </div>
                  )}
                </section>
              );
            })}
          </div>
        )}
      </section>

      {/* Bottom fixed bar — only visible on Quiz tab */}
      {activeTab === 'quiz' && (
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
      )}
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
