'use client';

import { t } from '@/lib/i18n';
import { isExplainRubric } from '@/types';
import type { ExplainQuestion, Language } from '@/types';

interface PromptCardProps {
  question: ExplainQuestion;
  language: Language;
}

const PromptCard = ({ question, language }: PromptCardProps) => {
  const questionText = language === 'ja' ? question.question_ja : question.question_en;
  const difficultyLabel = t(
    `difficulty.${question.difficulty}` as 'difficulty.easy' | 'difficulty.medium' | 'difficulty.hard',
    language
  );

  const difficultyColor =
    question.difficulty === 'easy'
      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      : question.difficulty === 'medium'
        ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
        : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';

  const rubric = isExplainRubric(question.options, question.type)
    ? (language === 'ja' ? question.options.rubric_ja : question.options.rubric_en)
    : null;

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          {language === 'ja' ? '問題' : 'Question'}
        </h3>
        <span className={`rounded-full px-3 py-1 text-xs font-medium ${difficultyColor}`}>
          {difficultyLabel}
        </span>
      </div>

      <p className="mb-6 whitespace-pre-wrap text-gray-800 dark:text-gray-200">{questionText}</p>

      {rubric && (
        <div className="mt-4 rounded-md border border-gray-100 bg-gray-50 p-4 dark:border-gray-600 dark:bg-gray-700">
          <h4 className="mb-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
            {language === 'ja' ? '評価基準 (ルーブリック)' : 'Rubric (Rating Criteria)'}
          </h4>
          <ol className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
            {(['1', '2', '3', '4'] as const).map((key) => (
              <li key={key} className="flex gap-2">
                <span className="font-medium text-gray-700 dark:text-gray-300">{key}.</span>
                <span>{rubric[key]}</span>
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
};

export default PromptCard;
