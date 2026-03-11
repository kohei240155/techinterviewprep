'use client';

import type { AnalysisPlan } from '@/types';

interface PlanReviewStepProps {
  plan: AnalysisPlan;
  onGenerate: (editedPlan: AnalysisPlan) => void;
}

const PlanReviewStep = ({ plan, onGenerate }: PlanReviewStepProps) => {
  return (
    <div>
      {/* TODO: AI 分析結果レビュー・編集 */}
      <p>Step 2: 計画レビュー</p>
      <p>問題数: {plan.total_count}</p>
      <button onClick={() => onGenerate(plan)}>生成する</button>
    </div>
  );
};

export default PlanReviewStep;
