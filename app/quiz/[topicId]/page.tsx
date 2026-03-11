'use client';

import { useParams } from 'next/navigation';
import QuizSession from '@/components/quiz/QuizSession';

const QuizPage = () => {
  const params = useParams<{ topicId: string }>();

  return (
    <div className="container mx-auto px-4 py-8">
      <QuizSession topicId={params.topicId} />
    </div>
  );
};

export default QuizPage;
