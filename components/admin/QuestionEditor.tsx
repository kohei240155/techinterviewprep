'use client';

import type {
  GeneratedQuestion,
  QuestionType,
  Difficulty,
  OptionChoice,
  MultipleAnswer,
  TrueFalseAnswer,
  ExplainAnswer,
  ExplainRubric,
} from '@/types';
import { useLanguage } from '@/hooks/useLanguage';

interface QuestionEditorProps {
  question: GeneratedQuestion;
  onChange: (question: GeneratedQuestion) => void;
}

const typeOptions: { value: QuestionType; label_ja: string; label_en: string }[] = [
  { value: 'multiple', label_ja: '選択式', label_en: 'Multiple Choice' },
  { value: 'code', label_ja: 'コードリーディング', label_en: 'Code Reading' },
  { value: 'truefalse', label_ja: 'True/False', label_en: 'True/False' },
  { value: 'explain', label_ja: '口頭説明', label_en: 'Explain' },
];

const difficultyOptions: { value: Difficulty; label_ja: string; label_en: string }[] = [
  { value: 'easy', label_ja: '易しい', label_en: 'Easy' },
  { value: 'medium', label_ja: '普通', label_en: 'Medium' },
  { value: 'hard', label_ja: '難しい', label_en: 'Hard' },
];

const buildDefaultOptions = (type: QuestionType): GeneratedQuestion['options'] => {
  if (type === 'multiple' || type === 'code') {
    return [
      { label: 'A', text_ja: '', text_en: '' },
      { label: 'B', text_ja: '', text_en: '' },
      { label: 'C', text_ja: '', text_en: '' },
      { label: 'D', text_ja: '', text_en: '' },
    ];
  }
  if (type === 'explain') {
    return {
      rubric_ja: { '1': '', '2': '', '3': '', '4': '' },
      rubric_en: { '1': '', '2': '', '3': '', '4': '' },
    };
  }
  return null;
};

const buildDefaultAnswer = (type: QuestionType): GeneratedQuestion['answer'] => {
  if (type === 'multiple' || type === 'code') return { correct_index: 0 };
  if (type === 'truefalse') return { correct_value: true };
  return { model_answer_ja: '', model_answer_en: '' };
};

const QuestionEditor = ({ question, onChange }: QuestionEditorProps) => {
  const { language } = useLanguage();

  const handleTypeChange = (newType: QuestionType) => {
    onChange({
      ...question,
      type: newType,
      options: buildDefaultOptions(newType),
      answer: buildDefaultAnswer(newType),
    });
  };

  const handleFieldChange = (field: keyof GeneratedQuestion, value: string) => {
    onChange({ ...question, [field]: value });
  };

  const handleOptionChange = (index: number, field: 'text_ja' | 'text_en', value: string) => {
    if (!Array.isArray(question.options)) return;
    const updated = [...question.options] as OptionChoice[];
    updated[index] = { ...updated[index], [field]: value };
    onChange({ ...question, options: updated });
  };

  const renderOptionsEditor = () => {
    if (question.type === 'multiple' || question.type === 'code') {
      const options = question.options as OptionChoice[];
      const answer = question.answer as MultipleAnswer;
      return (
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {language === 'ja' ? '選択肢' : 'Options'}
          </h4>
          {options?.map((opt, idx) => (
            <div key={idx} className="flex items-start gap-2">
              <div className="flex items-center gap-1 pt-2">
                <input
                  type="radio"
                  name={`correct-${question.question_ja}`}
                  checked={answer.correct_index === idx}
                  onChange={() => onChange({ ...question, answer: { correct_index: idx } })}
                  className="text-primary-600"
                />
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  {opt.label}
                </span>
              </div>
              <div className="flex-1 space-y-1">
                <input
                  type="text"
                  value={opt.text_ja}
                  onChange={(e) => handleOptionChange(idx, 'text_ja', e.target.value)}
                  placeholder="JA"
                  className="w-full rounded border border-gray-300 bg-white px-2 py-1 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
                />
                <input
                  type="text"
                  value={opt.text_en}
                  onChange={(e) => handleOptionChange(idx, 'text_en', e.target.value)}
                  placeholder="EN"
                  className="w-full rounded border border-gray-300 bg-white px-2 py-1 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
                />
              </div>
            </div>
          ))}
        </div>
      );
    }

    if (question.type === 'truefalse') {
      const answer = question.answer as TrueFalseAnswer;
      return (
        <div>
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {language === 'ja' ? '正解' : 'Correct Answer'}
          </h4>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
              <input
                type="radio"
                checked={answer.correct_value === true}
                onChange={() => onChange({ ...question, answer: { correct_value: true } })}
                className="text-primary-600"
              />
              True
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
              <input
                type="radio"
                checked={answer.correct_value === false}
                onChange={() => onChange({ ...question, answer: { correct_value: false } })}
                className="text-primary-600"
              />
              False
            </label>
          </div>
        </div>
      );
    }

    if (question.type === 'explain') {
      const answer = question.answer as ExplainAnswer;
      const rubric = question.options as ExplainRubric;
      return (
        <div className="space-y-4">
          <div>
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {language === 'ja' ? '模範解答' : 'Model Answer'}
            </h4>
            <textarea
              value={answer.model_answer_ja}
              onChange={(e) =>
                onChange({ ...question, answer: { ...answer, model_answer_ja: e.target.value } })
              }
              placeholder="JA"
              rows={3}
              className="w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 mb-2"
            />
            <textarea
              value={answer.model_answer_en}
              onChange={(e) =>
                onChange({ ...question, answer: { ...answer, model_answer_en: e.target.value } })
              }
              placeholder="EN"
              rows={3}
              className="w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
            />
          </div>
          {rubric && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {language === 'ja' ? 'ルーブリック' : 'Rubric'}
              </h4>
              {(['1', '2', '3', '4'] as const).map((level) => (
                <div key={level} className="mb-2">
                  <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                    Level {level}
                  </span>
                  <input
                    type="text"
                    value={rubric.rubric_ja[level]}
                    onChange={(e) => {
                      const newRubric = {
                        ...rubric,
                        rubric_ja: { ...rubric.rubric_ja, [level]: e.target.value },
                      };
                      onChange({ ...question, options: newRubric });
                    }}
                    placeholder="JA"
                    className="w-full rounded border border-gray-300 bg-white px-2 py-1 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 mb-1"
                  />
                  <input
                    type="text"
                    value={rubric.rubric_en[level]}
                    onChange={(e) => {
                      const newRubric = {
                        ...rubric,
                        rubric_en: { ...rubric.rubric_en, [level]: e.target.value },
                      };
                      onChange({ ...question, options: newRubric });
                    }}
                    placeholder="EN"
                    className="w-full rounded border border-gray-300 bg-white px-2 py-1 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }

    return null;
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-4">
        <div className="flex-1">
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
            {language === 'ja' ? 'タイプ' : 'Type'}
          </label>
          <select
            value={question.type}
            onChange={(e) => handleTypeChange(e.target.value as QuestionType)}
            className="w-full rounded border border-gray-300 bg-white px-2 py-1.5 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
          >
            {typeOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {language === 'ja' ? opt.label_ja : opt.label_en}
              </option>
            ))}
          </select>
        </div>
        <div className="flex-1">
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
            {language === 'ja' ? '難易度' : 'Difficulty'}
          </label>
          <select
            value={question.difficulty}
            onChange={(e) =>
              onChange({ ...question, difficulty: e.target.value as Difficulty })
            }
            className="w-full rounded border border-gray-300 bg-white px-2 py-1.5 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
          >
            {difficultyOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {language === 'ja' ? opt.label_ja : opt.label_en}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
          {language === 'ja' ? '問題文 (JA)' : 'Question (JA)'}
        </label>
        <textarea
          value={question.question_ja}
          onChange={(e) => handleFieldChange('question_ja', e.target.value)}
          rows={3}
          className="w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
          {language === 'ja' ? '問題文 (EN)' : 'Question (EN)'}
        </label>
        <textarea
          value={question.question_en}
          onChange={(e) => handleFieldChange('question_en', e.target.value)}
          rows={3}
          className="w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
        />
      </div>

      {renderOptionsEditor()}

      <div>
        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
          {language === 'ja' ? '解説 (JA)' : 'Explanation (JA)'}
        </label>
        <textarea
          value={question.explanation_ja}
          onChange={(e) => handleFieldChange('explanation_ja', e.target.value)}
          rows={2}
          className="w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
          {language === 'ja' ? '解説 (EN)' : 'Explanation (EN)'}
        </label>
        <textarea
          value={question.explanation_en}
          onChange={(e) => handleFieldChange('explanation_en', e.target.value)}
          rows={2}
          className="w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
        />
      </div>
    </div>
  );
};

export default QuestionEditor;
