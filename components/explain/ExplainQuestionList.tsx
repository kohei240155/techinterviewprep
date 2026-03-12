'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useQuestions } from '@/hooks/queries/useQuestions';
import { useLanguage } from '@/hooks/useLanguage';
import { t } from '@/lib/i18n';
import type { ExplainQuestion } from '@/types';

interface ExplainQuestionListProps {
  topicId: string;
}

const ExplainQuestionList = ({ topicId }: ExplainQuestionListProps) => {
  const router = useRouter();
  const { language } = useLanguage();
  const { data: questions, isLoading } = useQuestions(topicId);
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
    router.push(`/explain/${topicId}?questions=${idsStr}`);
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
      <div className="py-4 text-center text-sm text-gray-500 dark:text-gray-400">
        {t('common.loading', language)}
      </div>
    );
  }

  if (explainQuestions.length === 0) {
    return (
      <div className="py-4 text-center text-sm text-gray-500 dark:text-gray-400">
        {language === 'ja' ? '口頭説明の問題がありません' : 'No explanation questions available'}
      </div>
    );
  }

  return (
    <div>
      {/* Select all + start button header */}
      <div className="flex items-center justify-between px-1 py-2">
        <label className="flex cursor-pointer items-center gap-2">
          <input
            type="checkbox"
            checked={allSelected}
            onChange={toggleAll}
            className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500 dark:border-gray-600"
          />
          <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">
            {language === 'ja' ? '全て選択' : 'Select All'}
          </span>
        </label>
        <div className="flex items-center gap-3">
          {selectedIds.size > 0 && (
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {t('explain.selectedCount', language).replace('{count}', String(selectedIds.size))}
            </span>
          )}
          <button
            onClick={handleStart}
            disabled={selectedIds.size === 0}
            className={`rounded-lg px-4 py-1.5 text-xs font-semibold text-white transition-colors ${
              selectedIds.size > 0
                ? 'bg-primary-600 hover:bg-primary-700 active:scale-[0.98]'
                : 'cursor-not-allowed bg-gray-300 dark:bg-gray-600'
            }`}
          >
            {t('explain.startSession', language)}
          </button>
        </div>
      </div>

      {/* Question list */}
      <div className="space-y-0.5">
        {explainQuestions.map((q) => {
          const isSelected = selectedIds.has(q.id);
          return (
            <label
              key={q.id}
              className={`flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 transition-colors ${
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
              <span className="flex-1 text-sm text-gray-800 dark:text-gray-200">
                {language === 'ja' ? q.question_ja : q.question_en}
              </span>
              <span className={`badge text-xs ${difficultyColor(q.difficulty)}`}>
                {t(`difficulty.${q.difficulty}` as 'difficulty.easy' | 'difficulty.medium' | 'difficulty.hard', language)}
              </span>
            </label>
          );
        })}
      </div>
    </div>
  );
};

export default ExplainQuestionList;
