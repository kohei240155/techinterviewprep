'use client';

import type { Question, Language } from '@/types';

interface QuestionCardProps {
  question: Question;
  language: Language;
}

const QuestionCard = ({ question, language }: QuestionCardProps) => {
  const text = language === 'ja' ? question.question_ja : question.question_en;

  return (
    <div className="rounded-lg border border-gray-200 p-6 dark:border-gray-700">
      <p className="text-lg">{text}</p>
    </div>
  );
};

export default QuestionCard;
