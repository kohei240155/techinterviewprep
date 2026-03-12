'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import QuizSession from '@/components/quiz/QuizSession';
import type { QuizMode, QuestionCount, Difficulty, QuizQuestionType } from '@/types';

const VALID_COUNTS: QuestionCount[] = [5, 10, 15, 20, 'all'];

const QuizSessionContent = () => {
  const searchParams = useSearchParams();

  const topicsParam = searchParams.get('topics') ?? '';
  const topicIds = topicsParam ? topicsParam.split(',').filter(Boolean) : [];
  const mode = (searchParams.get('mode') ?? 'new') as QuizMode;
  const countParam = searchParams.get('count');
  const count: QuestionCount = countParam === 'all'
    ? 'all'
    : VALID_COUNTS.includes(Number(countParam) as QuestionCount)
      ? (Number(countParam) as QuestionCount)
      : 10;

  const VALID_DIFFICULTIES: Difficulty[] = ['easy', 'medium', 'hard'];
  const VALID_TYPES: QuizQuestionType[] = ['multiple', 'code', 'truefalse'];

  const difficultyParam = searchParams.get('difficulty');
  const difficulties = difficultyParam
    ? difficultyParam.split(',').filter((d): d is Difficulty => VALID_DIFFICULTIES.includes(d as Difficulty))
    : undefined;

  const typesParam = searchParams.get('types');
  const questionTypes = typesParam
    ? typesParam.split(',').filter((t): t is QuizQuestionType => VALID_TYPES.includes(t as QuizQuestionType))
    : undefined;

  const unansweredOnly = searchParams.get('unanswered') === '1';

  return (
    <QuizSession
      topicIds={topicIds}
      initialMode={mode}
      initialCount={count}
      difficulties={difficulties}
      questionTypes={questionTypes}
      unansweredOnly={unansweredOnly}
      skipSetup
    />
  );
};

const QuizSessionPage = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <Suspense fallback={<div className="flex justify-center py-12"><p className="text-gray-500">Loading...</p></div>}>
        <QuizSessionContent />
      </Suspense>
    </div>
  );
};

export default QuizSessionPage;
