'use client';

import { useParams } from 'next/navigation';

const QuizPage = () => {
  const params = useParams<{ topicId: string }>();

  return (
    <div>
      <h1 className="text-2xl font-bold">クイズモード</h1>
      <p className="mt-2 text-gray-600 dark:text-gray-400">
        Topic ID: {params.topicId}
      </p>
      {/* TODO: QuizSession コンポーネント */}
    </div>
  );
};

export default QuizPage;
