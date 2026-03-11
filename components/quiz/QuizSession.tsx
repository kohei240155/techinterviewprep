'use client';

interface QuizSessionProps {
  topicId: string;
}

const QuizSession = ({ topicId }: QuizSessionProps) => {
  return (
    <div>
      {/* TODO: クイズセッション全体制御 */}
      <p>Quiz session for topic: {topicId}</p>
    </div>
  );
};

export default QuizSession;
