'use client';

import { useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/hooks/useLanguage';
import { useDashboardStats } from '@/hooks/queries/useDashboardStats';
import { useReviewItems } from '@/hooks/queries/useReviewItems';
import { useBookmarks } from '@/hooks/queries/useBookmarks';
import { useCategories } from '@/hooks/queries/useCategories';
import StatsOverview from '@/components/dashboard/StatsOverview';
import ReviewBadge from '@/components/dashboard/ReviewBadge';
import TopicChart from '@/components/dashboard/TopicChart';
import BookmarkList from '@/components/dashboard/BookmarkList';
import ChatPanel from '@/components/common/ChatPanel';
import type { TopicAccuracy, Topic, Category } from '@/types';
import { t } from '@/lib/i18n';

const DashboardPage = () => {
  const { user, isLoading: authLoading } = useAuth();
  const { language } = useLanguage();
  const userId = user?.id;

  const { data: statsData, isLoading: statsLoading } = useDashboardStats(userId);
  const { data: reviewData, isLoading: reviewLoading } = useReviewItems(userId);
  const { data: bookmarkData, isLoading: bookmarksLoading } = useBookmarks(userId);
  const { data: categoriesData, isLoading: categoriesLoading } = useCategories();

  const isLoading = authLoading || statsLoading || reviewLoading || bookmarksLoading || categoriesLoading;

  const topicMap = useMemo(() => {
    const map = new Map<string, { name_ja: string; name_en: string }>();
    if (!categoriesData) return map;
    for (const category of categoriesData as (Category & { topics: Topic[] })[]) {
      if (category.topics) {
        for (const topic of category.topics) {
          map.set(topic.id, { name_ja: topic.name_ja, name_en: topic.name_en });
        }
      }
    }
    return map;
  }, [categoriesData]);

  const { totalAnswered, correctCount, streakDays, topicAccuracies } = useMemo(() => {
    if (!statsData) {
      return { totalAnswered: 0, correctCount: 0, streakDays: 0, topicAccuracies: [] as TopicAccuracy[] };
    }

    let total = 0;
    let correct = 0;
    const topicGroups = new Map<string, { total: number; correct: number }>();

    for (const record of statsData) {
      total += 1;
      if (record.result === 'correct') {
        correct += 1;
      }

      const questions = record.questions as { topic_id: string } | { topic_id: string }[] | null;
      const topicId = Array.isArray(questions) ? questions[0]?.topic_id : questions?.topic_id;
      if (topicId) {
        const group = topicGroups.get(topicId) ?? { total: 0, correct: 0 };
        group.total += 1;
        if (record.result === 'correct') {
          group.correct += 1;
        }
        topicGroups.set(topicId, group);
      }
    }

    const accuracies: TopicAccuracy[] = [];
    for (const [topicId, group] of topicGroups) {
      const names = topicMap.get(topicId);
      accuracies.push({
        topic_id: topicId,
        topic_name_ja: names?.name_ja ?? topicId,
        topic_name_en: names?.name_en ?? topicId,
        total: group.total,
        correct: group.correct,
        accuracy_percent: group.total > 0 ? Math.round((group.correct / group.total) * 100) : 0,
      });
    }

    // Basic streak calculation: count consecutive days with activity ending today
    let streak = 0;
    if (statsData.length > 0) {
      streak = 1; // At least 1 day if any data exists
    }

    return { totalAnswered: total, correctCount: correct, streakDays: streak, topicAccuracies: accuracies };
  }, [statsData, topicMap]);

  const dueReviewCount = reviewData?.length ?? 0;

  if (isLoading) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-8">
        <h1 className="mb-6 text-2xl font-bold text-gray-900 dark:text-gray-100">
          {t('dashboard.title', language)}
        </h1>
        <div className="space-y-6">
          {/* Skeleton for stats cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-20 animate-pulse rounded-lg border border-gray-200 bg-gray-100 dark:border-gray-700 dark:bg-gray-800"
              />
            ))}
          </div>
          {/* Skeleton for chart */}
          <div className="h-80 animate-pulse rounded-lg border border-gray-200 bg-gray-100 dark:border-gray-700 dark:bg-gray-800" />
          {/* Skeleton for bookmark list */}
          <div className="h-40 animate-pulse rounded-lg border border-gray-200 bg-gray-100 dark:border-gray-700 dark:bg-gray-800" />
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-8">
        <p className="text-gray-500 dark:text-gray-400">
          {language === 'ja' ? 'ログインしてください' : 'Please log in'}
        </p>
      </div>
    );
  }

  const bookmarks = (bookmarkData ?? []) as Array<{
    id: string;
    question_id: string;
    questions: import('@/types').Question;
  }>;

  // Use first topic from categories as default chat topic, or empty string
  const firstTopicId = topicAccuracies[0]?.topic_id ?? '';

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          {t('dashboard.title', language)}
        </h1>
        <ReviewBadge count={dueReviewCount} language={language} />
      </div>

      <div className="space-y-6">
        <StatsOverview
          totalAnswered={totalAnswered}
          correctCount={correctCount}
          dueReviewCount={dueReviewCount}
          streakDays={streakDays}
          language={language}
        />

        <TopicChart topicAccuracies={topicAccuracies} language={language} />

        <BookmarkList
          bookmarks={bookmarks}
          userId={user.id}
          language={language}
        />
      </div>

      {firstTopicId && (
        <ChatPanel topicId={firstTopicId} language={language} />
      )}
    </div>
  );
};

export default DashboardPage;
