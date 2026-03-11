'use client';

import type { ExplainQuestion, Language } from '@/types';

interface PromptCardProps {
  question: ExplainQuestion;
  language: Language;
}

const PromptCard = ({ question, language }: PromptCardProps) => {
  const text = language === 'ja' ? question.question_ja : question.question_en;

  return (
    <div className="rounded-lg border border-gray-200 p-6 dark:border-gray-700">
      <p className="text-lg">{text}</p>
    </div>
  );
};

export default PromptCard;
