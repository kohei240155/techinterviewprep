'use client';

import type { Question } from '@/types';

interface QuestionListProps {
  questions: Question[];
}

const QuestionList = ({ questions }: QuestionListProps) => {
  return (
    <div>
      {/* TODO: 問題一覧テーブル（検索・フィルタ・ページネーション） */}
      <p>{questions.length} 件の問題</p>
    </div>
  );
};

export default QuestionList;
