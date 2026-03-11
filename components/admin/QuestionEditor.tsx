'use client';

import type { GeneratedQuestion } from '@/types';

interface QuestionEditorProps {
  question: GeneratedQuestion;
  onChange: (updated: GeneratedQuestion) => void;
  onDelete: () => void;
}

const QuestionEditor = ({ question, onChange, onDelete }: QuestionEditorProps) => {
  return (
    <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
      {/* TODO: 問題フィールドの編集フォーム */}
      <p className="text-sm">[{question.type}/{question.difficulty}]</p>
      <p>{question.question_ja}</p>
      <button onClick={onDelete} className="mt-2 text-sm text-danger-600">削除</button>
      <button onClick={() => onChange(question)} className="mt-2 ml-2 text-sm text-primary-600">更新</button>
    </div>
  );
};

export default QuestionEditor;
