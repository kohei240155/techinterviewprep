'use client';

import { useParams } from 'next/navigation';
import ExplainSession from '@/components/explain/ExplainSession';

const ExplainPage = () => {
  const params = useParams<{ topicId: string }>();

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <ExplainSession topicId={params.topicId} />
    </div>
  );
};

export default ExplainPage;
