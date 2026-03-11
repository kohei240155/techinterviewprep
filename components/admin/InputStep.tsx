'use client';

interface InputStepProps {
  onAnalyze: (topicId: string, content?: string) => void;
}

const InputStep = ({ onAnalyze }: InputStepProps) => {
  return (
    <div>
      {/* TODO: テキスト投入 or トピック選択 */}
      <p>Step 1: 入力</p>
      <button onClick={() => onAnalyze('')}>分析する</button>
    </div>
  );
};

export default InputStep;
