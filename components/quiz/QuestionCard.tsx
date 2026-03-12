'use client';

import { useState } from 'react';
import type { Question, Language, ProgressResult } from '@/types';
import { isOptionChoices, isMultipleAnswer, isTrueFalseAnswer } from '@/types';
import { t } from '@/lib/i18n';
import OptionButton from './OptionButton';
import CodeBlock from './CodeBlock';

interface QuestionCardProps {
  question: Question;
  language: Language;
  phase: 'playing' | 'review';
  selectedIndex: number | null;
  onAnswer: (selectedIndex: number | null, result: ProgressResult) => void;
}

const CODE_BLOCK_REGEX = /```(\w+)?\n([\s\S]*?)```/;

const extractCodeBlock = (text: string): { text: string; code: string | null; lang: string | null } => {
  const match = text.match(CODE_BLOCK_REGEX);
  if (!match) return { text, code: null, lang: null };
  return {
    text: text.replace(CODE_BLOCK_REGEX, '').trim(),
    code: match[2].trim(),
    lang: match[1] || null,
  };
};

const QuestionCard = ({ question, language, phase, selectedIndex, onAnswer }: QuestionCardProps) => {
  const [localSelected, setLocalSelected] = useState<number | null>(null);
  const isAnswered = phase === 'review';
  const effectiveSelected = isAnswered ? selectedIndex : localSelected;

  const questionText = language === 'ja' ? question.question_ja : question.question_en;
  const explanationText = language === 'ja' ? question.explanation_ja : question.explanation_en;

  const { text: displayText, code, lang } = extractCodeBlock(questionText);

  const handleMultipleSelect = (index: number): void => {
    if (isAnswered) return;
    setLocalSelected(index);

    if (isMultipleAnswer(question.answer, question.type)) {
      const result: ProgressResult = index === question.answer.correct_index ? 'correct' : 'wrong';
      onAnswer(index, result);
    }
  };

  const handleTrueFalseSelect = (value: boolean | null): void => {
    if (isAnswered) return;

    if (value === null) {
      setLocalSelected(2);
      onAnswer(null, 'skipped');
      return;
    }

    const index = value ? 0 : 1;
    setLocalSelected(index);

    if (isTrueFalseAnswer(question.answer, question.type)) {
      const result: ProgressResult = value === question.answer.correct_value ? 'correct' : 'wrong';
      onAnswer(index, result);
    }
  };

  const renderMultipleChoice = (): React.ReactNode => {
    if (!isOptionChoices(question.options, question.type)) return null;

    return (
      <div className="mt-6 space-y-3">
        {question.options.map((option, index) => {
          const optionText = language === 'ja' ? option.text_ja : option.text_en;
          const isCorrectOption = isMultipleAnswer(question.answer, question.type)
            ? index === question.answer.correct_index
            : false;

          return (
            <OptionButton
              key={index}
              label={option.label}
              text={optionText}
              isSelected={effectiveSelected === index}
              isCorrect={isCorrectOption}
              isRevealed={isAnswered}
              disabled={isAnswered}
              onClick={() => handleMultipleSelect(index)}
            />
          );
        })}
      </div>
    );
  };

  const renderTrueFalse = (): React.ReactNode => {
    const correctValue = isTrueFalseAnswer(question.answer, question.type)
      ? question.answer.correct_value
      : null;

    return (
      <div className="mt-6 space-y-3">
        <OptionButton
          label="T"
          text="True"
          isSelected={effectiveSelected === 0}
          isCorrect={correctValue === true}
          isRevealed={isAnswered}
          disabled={isAnswered}
          onClick={() => handleTrueFalseSelect(true)}
        />
        <OptionButton
          label="F"
          text="False"
          isSelected={effectiveSelected === 1}
          isCorrect={correctValue === false}
          isRevealed={isAnswered}
          disabled={isAnswered}
          onClick={() => handleTrueFalseSelect(false)}
        />
        <button
          type="button"
          onClick={() => handleTrueFalseSelect(null)}
          disabled={isAnswered}
          className={`w-full rounded-xl border-2 border-dashed p-3 text-center text-sm transition-all duration-200 ${
            effectiveSelected === 2
              ? 'border-gray-400 bg-gray-100 dark:border-gray-500 dark:bg-gray-800'
              : 'border-gray-300 text-gray-500 hover:border-gray-400 dark:border-gray-600 dark:text-gray-400'
          } ${isAnswered ? 'cursor-not-allowed' : 'cursor-pointer'}`}
        >
          {t('quiz.idk', language)}
        </button>
      </div>
    );
  };

  return (
    <div className="card p-6 sm:p-8">
      <div className="mb-2 flex items-center gap-2">
        <span className="badge bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300">
          {question.type}
        </span>
        <span className={`badge ${
          question.difficulty === 'easy'
            ? 'bg-success-100 text-success-600 dark:bg-success-900/30 dark:text-success-400'
            : question.difficulty === 'medium'
            ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300'
            : 'bg-danger-100 text-danger-600 dark:bg-danger-900/30 dark:text-danger-400'
        }`}>
          {t(`difficulty.${question.difficulty}`, language)}
        </span>
      </div>

      <p className="text-lg leading-relaxed dark:text-gray-100">{displayText}</p>

      {code && <CodeBlock code={code} language={lang ?? undefined} />}

      {(question.type === 'multiple' || question.type === 'code') && renderMultipleChoice()}
      {question.type === 'truefalse' && renderTrueFalse()}

      {isAnswered && explanationText && (
        <div className="mt-6 rounded-xl border border-primary-200 bg-primary-50 p-4 dark:border-primary-800 dark:bg-primary-900/20">
          <h4 className="mb-2 font-semibold text-primary-700 dark:text-primary-300">
            {language === 'ja' ? '解説' : 'Explanation'}
          </h4>
          <p className="text-sm leading-relaxed text-primary-900 dark:text-primary-100">
            {explanationText}
          </p>
        </div>
      )}
    </div>
  );
};

export default QuestionCard;
