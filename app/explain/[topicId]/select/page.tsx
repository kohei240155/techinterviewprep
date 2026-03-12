'use client';

import { useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useQuestions } from '@/hooks/queries/useQuestions';
import { useLanguage } from '@/hooks/useLanguage';
import { t } from '@/lib/i18n';
import type { ExplainQuestion } from '@/types';

const ExplainSelectPage = () => {
  const params = useParams<{ topicId: string }>();
  const router = useRouter();
  const { language } = useLanguage();
  const { data: questions, isLoading, error } = useQuestions(params.topicId);

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const explainQuestions = useMemo(
    () =>
      (questions ?? []).filter(
        (q): q is ExplainQuestion => q.type === 'explain'
      ),
    [questions]
  );

  const allSelected = explainQuestions.length > 0 && selectedIds.size === explainQuestions.length;

  const toggleAll = () => {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(explainQuestions.map((q) => q.id)));
    }
  };

  const toggleQuestion = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleStart = () => {
    if (selectedIds.size === 0) return;
    const idsStr = Array.from(selectedIds).join(',');
    router.push(`/explain/${params.topicId}?questions=${idsStr}`);
  };

  const difficultyColor = (d: string) => {
    switch (d) {
      case 'easy':
        return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300';
      case 'medium':
        return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300';
      case 'hard':
        return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300';
      default:
        return '';
    }
  };

  if (isLoading) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8">
        <p className="text-gray-500 dark:text-gray-400">{t('common.loading', language)}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8">
        <p className="text-red-500">{t('common.error', language)}</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 pb-28">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link
          href="/"
          className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          <span className="material-symbols-outlined text-xl text-gray-600 dark:text-gray-400">
            arrow_back
          </span>
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          {t('explain.selectQuestions', language)}
        </h1>
      </div>

      {explainQuestions.length === 0 ? (
        <p className="text-gray-500 dark:text-gray-400">
          {language === 'ja'
            ? '口頭説明の問題がありません。'
            : 'No explanation questions available.'}
        </p>
      ) : (
        <>
          {/* Select all toggle */}
          <label className="mb-4 flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-800/50">
            <input
              type="checkbox"
              checked={allSelected}
              onChange={toggleAll}
              className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500 dark:border-gray-600"
            />
            <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              {language === 'ja' ? '全て選択' : 'Select All'}
            </span>
          </label>

          {/* Question list */}
          <div className="space-y-1">
            {explainQuestions.map((q) => {
              const isSelected = selectedIds.has(q.id);
              return (
                <label
                  key={q.id}
                  className={`flex cursor-pointer items-center gap-3 rounded-xl px-3 py-3 transition-colors ${
                    isSelected
                      ? 'bg-primary-50 dark:bg-primary-900/20'
                      : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleQuestion(q.id)}
                    className="h-4 w-4 shrink-0 rounded border-gray-300 text-primary-600 focus:ring-primary-500 dark:border-gray-600"
                  />
                  <span className="flex-1 text-sm text-gray-900 dark:text-gray-100">
                    {language === 'ja' ? q.question_ja : q.question_en}
                  </span>
                  <span className={`badge text-xs ${difficultyColor(q.difficulty)}`}>
                    {t(`difficulty.${q.difficulty}` as 'difficulty.easy' | 'difficulty.medium' | 'difficulty.hard', language)}
                  </span>
                </label>
              );
            })}
          </div>
        </>
      )}

      {/* Bottom bar */}
      {explainQuestions.length > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-gray-200 bg-white/95 backdrop-blur dark:border-gray-700 dark:bg-gray-900/95">
          <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-4 py-3">
            <span className="text-sm text-slate-600 dark:text-slate-400">
              {t('explain.selectedCount', language).replace('{count}', String(selectedIds.size))}
            </span>
            <button
              onClick={handleStart}
              disabled={selectedIds.size === 0}
              className={`rounded-lg px-6 py-2 text-sm font-semibold text-white transition-colors ${
                selectedIds.size > 0
                  ? 'bg-primary-600 hover:bg-primary-700 active:scale-[0.98]'
                  : 'cursor-not-allowed bg-gray-400'
              }`}
            >
              {t('explain.startSession', language)}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExplainSelectPage;
