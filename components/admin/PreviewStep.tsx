'use client';

import { useState } from 'react';
import type { GeneratedQuestion } from '@/types';
import { useLanguage } from '@/hooks/useLanguage';
import QuestionEditor from './QuestionEditor';

interface PreviewStepProps {
  questions: GeneratedQuestion[];
  selectedIndices: number[];
  onToggleSelect: (index: number) => void;
  onQuestionChange: (index: number, question: GeneratedQuestion) => void;
  onSave: () => void;
  isLoading: boolean;
}

const PreviewStep = ({
  questions,
  selectedIndices,
  onToggleSelect,
  onQuestionChange,
  onSave,
  isLoading,
}: PreviewStepProps) => {
  const { language } = useLanguage();
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const allSelected = questions.length > 0 && selectedIndices.length === questions.length;

  const handleSelectAll = () => {
    if (allSelected) {
      selectedIndices.forEach((i) => onToggleSelect(i));
    } else {
      questions.forEach((_, i) => {
        if (!selectedIndices.includes(i)) {
          onToggleSelect(i);
        }
      });
    }
  };

  const typeLabels: Record<string, string> = {
    multiple: language === 'ja' ? '選択式' : 'MC',
    code: language === 'ja' ? 'コード' : 'Code',
    truefalse: 'T/F',
    explain: language === 'ja' ? '説明' : 'Explain',
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
            <input
              type="checkbox"
              checked={allSelected}
              onChange={handleSelectAll}
              className="rounded text-primary-600"
            />
            {language === 'ja'
              ? `全て選択 (${selectedIndices.length}/${questions.length})`
              : `Select All (${selectedIndices.length}/${questions.length})`}
          </label>
        </div>
      </div>

      <div className="space-y-3">
        {questions.map((q, idx) => {
          const isSelected = selectedIndices.includes(idx);
          const isExpanded = expandedIndex === idx;
          return (
            <div
              key={idx}
              className={`rounded-lg border p-4 transition-colors ${
                isSelected
                  ? 'border-primary-300 bg-primary-50 dark:border-primary-700 dark:bg-primary-900/20'
                  : 'border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800'
              }`}
            >
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => onToggleSelect(idx)}
                  className="mt-1 rounded text-primary-600"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="inline-block rounded bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                      {typeLabels[q.type]}
                    </span>
                    <span className="inline-block rounded bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                      {q.difficulty}
                    </span>
                  </div>
                  <p className="text-sm text-gray-800 dark:text-gray-200 line-clamp-2">
                    {language === 'ja' ? q.question_ja : q.question_en}
                  </p>
                  <button
                    onClick={() => setExpandedIndex(isExpanded ? null : idx)}
                    className="mt-2 text-xs text-primary-600 hover:text-primary-700 dark:text-primary-400"
                  >
                    {isExpanded
                      ? language === 'ja' ? '閉じる' : 'Collapse'
                      : language === 'ja' ? '編集する' : 'Edit'}
                  </button>
                </div>
              </div>
              {isExpanded && (
                <div className="mt-4 border-t border-gray-200 pt-4 dark:border-gray-700">
                  <QuestionEditor
                    question={q}
                    onChange={(updated) => onQuestionChange(idx, updated)}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      <button
        onClick={onSave}
        disabled={isLoading || selectedIndices.length === 0}
        className="w-full rounded-lg bg-primary-600 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isLoading
          ? language === 'ja' ? '保存中...' : 'Saving...'
          : language === 'ja'
            ? `選択した ${selectedIndices.length} 問を保存`
            : `Save ${selectedIndices.length} Selected Questions`}
      </button>
    </div>
  );
};

export default PreviewStep;
