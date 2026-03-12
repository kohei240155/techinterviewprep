'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import QuizSession from '@/components/quiz/QuizSession';
import type { QuizMode, QuestionCount } from '@/types';

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

  return (
    <QuizSession
      topicIds={topicIds}
      initialMode={mode}
      initialCount={count}
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
