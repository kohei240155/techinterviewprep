'use client';

interface SaveStepProps {
  savedCount: number;
}

const SaveStep = ({ savedCount }: SaveStepProps) => {
  return (
    <div>
      <p>Step 4: 保存完了 ({savedCount} 件)</p>
      {/* TODO: ナビゲーションボタン */}
    </div>
  );
};

export default SaveStep;
