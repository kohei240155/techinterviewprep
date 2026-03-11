const TopicDetailPage = async ({
  params,
}: {
  params: Promise<{ topicId: string }>;
}) => {
  const { topicId } = await params;

  return (
    <div>
      <h1 className="text-2xl font-bold">トピック詳細</h1>
      <p className="mt-2 text-gray-600 dark:text-gray-400">
        Topic ID: {topicId}
      </p>
      {/* TODO: トピック詳細・問題一覧・学習開始ボタン */}
    </div>
  );
};

export default TopicDetailPage;
