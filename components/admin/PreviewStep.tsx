'use client';

import type { GeneratedQuestion } from '@/types';

interface PreviewStepProps {
  questions: GeneratedQuestion[];
  onSave: (selectedIndices: number[]) => void;
}

const PreviewStep = ({ questions, onSave }: PreviewStepProps) => {
  return (
    <div>
      {/* TODO: 生成問題プレビュー・編集 */}
      <p>Step 3: プレビュー ({questions.length} 問)</p>
      <button onClick={() => onSave(questions.map((_, i) => i))}>保存する</button>
    </div>
  );
};

export default PreviewStep;
