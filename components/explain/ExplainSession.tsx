'use client';

interface ExplainSessionProps {
  topicId: string;
}

const ExplainSession = ({ topicId }: ExplainSessionProps) => {
  return (
    <div>
      {/* TODO: 口頭説明セッション全体制御 */}
      <p>Explain session for topic: {topicId}</p>
    </div>
  );
};

export default ExplainSession;
