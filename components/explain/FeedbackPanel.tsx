'use client';

import { t } from '@/lib/i18n';
import { isExplainAnswer } from '@/types';
import type { FeedbackResult, ExplainQuestion, Language } from '@/types';
import MarkdownText from '@/components/common/MarkdownText';

interface FeedbackPanelProps {
  feedback: FeedbackResult;
  question: ExplainQuestion;
  language: Language;
}

const FeedbackPanel = ({ feedback, question, language }: FeedbackPanelProps) => {
  const ratingColor =
    feedback.rating <= 2
      ? 'text-red-600 dark:text-red-400 border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/30'
      : 'text-green-600 dark:text-green-400 border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/30';

  const ratingBgColor =
    feedback.rating <= 2
      ? 'bg-red-100 dark:bg-red-900/50'
      : 'bg-green-100 dark:bg-green-900/50';

  const modelAnswer = isExplainAnswer(question.answer, question.type)
    ? (language === 'ja' ? question.answer.model_answer_ja : question.answer.model_answer_en)
    : null;

  return (
    <div className="space-y-4">
      <div className={`rounded-lg border p-6 ${ratingColor}`}>
        <div className="mb-4 flex items-center gap-4">
          <h3 className="text-lg font-semibold">
            {t('explain.feedback', language)}
          </h3>
          <div className={`flex h-12 w-12 items-center justify-center rounded-full text-xl font-bold ${ratingBgColor}`}>
            {feedback.rating}
          </div>
          <span className="text-sm text-gray-500 dark:text-gray-400">/ 4</span>
        </div>

        <MarkdownText className="whitespace-pre-wrap text-gray-800 dark:text-gray-200">
          {feedback.feedback}
        </MarkdownText>
      </div>

      {modelAnswer && (
        <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
          <h4 className="mb-3 text-sm font-semibold text-gray-700 dark:text-gray-300">
            {language === 'ja' ? '模範解答' : 'Model Answer'}
          </h4>
          <MarkdownText className="whitespace-pre-wrap text-gray-700 dark:text-gray-300">
            {modelAnswer}
          </MarkdownText>
        </div>
      )}
    </div>
  );
};

export default FeedbackPanel;
