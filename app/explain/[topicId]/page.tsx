'use client';

import { useParams } from 'next/navigation';

const ExplainPage = () => {
  const params = useParams<{ topicId: string }>();

  return (
    <div>
      <h1 className="text-2xl font-bold">口頭説明モード</h1>
      <p className="mt-2 text-gray-600 dark:text-gray-400">
        Topic ID: {params.topicId}
      </p>
      {/* TODO: ExplainSession コンポーネント */}
    </div>
  );
};

export default ExplainPage;
