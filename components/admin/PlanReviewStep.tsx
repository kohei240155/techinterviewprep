'use client';

import { useState } from 'react';
import type { AnalysisPlan } from '@/types';
import { useLanguage } from '@/hooks/useLanguage';

interface PlanReviewStepProps {
  plan: AnalysisPlan;
  editedPlan: AnalysisPlan;
  onPlanChange: (plan: AnalysisPlan) => void;
  onGenerate: () => void;
  isLoading: boolean;
}

const relevanceColors: Record<string, string> = {
  high: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  low: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
};

const PlanReviewStep = ({
  plan,
  editedPlan,
  onPlanChange,
  onGenerate,
  isLoading,
}: PlanReviewStepProps) => {
  const { language } = useLanguage();
  const [isEditing, setIsEditing] = useState(false);

  const currentPlan = isEditing ? editedPlan : plan;

  const handleCountChange = (index: number, newCount: number) => {
    const updatedQuestions = [...editedPlan.questions];
    updatedQuestions[index] = { ...updatedQuestions[index], count: Math.max(1, newCount) };
    const totalCount = updatedQuestions.reduce((sum, q) => sum + q.count, 0);
    onPlanChange({ ...editedPlan, questions: updatedQuestions, total_count: totalCount });
  };

  const typeLabels: Record<string, string> = {
    multiple: language === 'ja' ? '選択式' : 'Multiple Choice',
    code: language === 'ja' ? 'コードリーディング' : 'Code Reading',
    truefalse: language === 'ja' ? 'True/False' : 'True/False',
    explain: language === 'ja' ? '口頭説明' : 'Explain',
  };

  const difficultyLabels: Record<string, string> = {
    easy: language === 'ja' ? '易しい' : 'Easy',
    medium: language === 'ja' ? '普通' : 'Medium',
    hard: language === 'ja' ? '難しい' : 'Hard',
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
          {language === 'ja' ? 'トピック概要' : 'Topic Summary'}
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">{currentPlan.topic_summary}</p>
      </div>

      <div className="flex items-center gap-3">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {language === 'ja' ? '面接関連度:' : 'Interview Relevance:'}
        </span>
        <span
          className={`inline-block rounded-full px-3 py-1 text-xs font-medium ${relevanceColors[currentPlan.interview_relevance]}`}
        >
          {currentPlan.interview_relevance.toUpperCase()}
        </span>
      </div>
      <p className="text-sm text-gray-500 dark:text-gray-400">
        {currentPlan.interview_relevance_reason}
      </p>

      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            {language === 'ja' ? '問題計画' : 'Question Plan'}
          </h3>
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400"
          >
            {isEditing
              ? language === 'ja' ? '編集終了' : 'Done Editing'
              : language === 'ja' ? '編集する' : 'Edit'}
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="py-2 pr-4 text-left font-medium text-gray-600 dark:text-gray-400">
                  {language === 'ja' ? 'タイプ' : 'Type'}
                </th>
                <th className="py-2 pr-4 text-left font-medium text-gray-600 dark:text-gray-400">
                  {language === 'ja' ? '難易度' : 'Difficulty'}
                </th>
                <th className="py-2 pr-4 text-left font-medium text-gray-600 dark:text-gray-400">
                  {language === 'ja' ? '数' : 'Count'}
                </th>
                <th className="py-2 text-left font-medium text-gray-600 dark:text-gray-400">
                  {language === 'ja' ? '理由' : 'Rationale'}
                </th>
              </tr>
            </thead>
            <tbody>
              {currentPlan.questions.map((q, idx) => (
                <tr key={idx} className="border-b border-gray-100 dark:border-gray-800">
                  <td className="py-2 pr-4 text-gray-800 dark:text-gray-200">
                    {typeLabels[q.type] ?? q.type}
                  </td>
                  <td className="py-2 pr-4 text-gray-800 dark:text-gray-200">
                    {difficultyLabels[q.difficulty] ?? q.difficulty}
                  </td>
                  <td className="py-2 pr-4">
                    {isEditing ? (
                      <input
                        type="number"
                        min={1}
                        max={10}
                        value={editedPlan.questions[idx]?.count ?? q.count}
                        onChange={(e) => handleCountChange(idx, parseInt(e.target.value, 10) || 1)}
                        className="w-16 rounded border border-gray-300 bg-white px-2 py-1 text-center text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
                      />
                    ) : (
                      <span className="text-gray-800 dark:text-gray-200">{q.count}</span>
                    )}
                  </td>
                  <td className="py-2 text-gray-600 dark:text-gray-400">{q.rationale}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="font-medium">
                <td className="py-2 pr-4 text-gray-800 dark:text-gray-200" colSpan={2}>
                  {language === 'ja' ? '合計' : 'Total'}
                </td>
                <td className="py-2 pr-4 text-gray-800 dark:text-gray-200">
                  {currentPlan.total_count}
                </td>
                <td />
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {currentPlan.notes && (
        <div className="rounded-lg bg-gray-50 p-4 dark:bg-gray-800">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            {language === 'ja' ? 'メモ' : 'Notes'}
          </h4>
          <p className="text-sm text-gray-600 dark:text-gray-400">{currentPlan.notes}</p>
        </div>
      )}

      <button
        onClick={onGenerate}
        disabled={isLoading}
        className="w-full rounded-lg bg-primary-600 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isLoading
          ? language === 'ja' ? '生成中...' : 'Generating...'
          : language === 'ja' ? '問題を生成する' : 'Generate Questions'}
      </button>
    </div>
  );
};

export default PlanReviewStep;
