import type { AnalysisPlan } from '@/types';

export function buildGenerationPrompt(params: {
  generationPlanJSON: AnalysisPlan;
  pastedContent?: string;
  existingQuestionsList: string;
}): { system: string; user: string } {
  const system = `あなたは技術面接問題の作成者です。
提供された計画に従って問題を生成してください。
各問題は日本語・英語の両方を含むこと。

## 出力ルール
- multiple/code: options は4つの選択肢配列 [{label, text_ja, text_en}]、answer は {correct_index: 0-3}
- truefalse: options は null、answer は {correct_value: true/false}
- explain: options はルーブリックオブジェクト {rubric_ja: {1-4}, rubric_en: {1-4}}、answer は {model_answer_ja, model_answer_en}
- 解説は「なぜ」を説明すること
- 既存の問題と意味的に重複する問題は絶対に作らないこと

既存の問題リスト:
${params.existingQuestionsList}`;

  const user = `以下の計画に基づいて問題を生成してください。

計画:
${JSON.stringify(params.generationPlanJSON, null, 2)}

ソースコンテンツ:
${params.pastedContent ?? '（トピック指定のみ — AIの知識で生成）'}`;

  return { system, user };
}
