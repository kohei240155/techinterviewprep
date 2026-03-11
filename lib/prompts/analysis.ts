export function buildAnalysisPrompt(params: {
  topicName_ja: string;
  topicName_en: string;
  categoryName_en: string;
  pastedContent?: string;
  existingQuestionsSummary: string;
}): { system: string; user: string } {
  const system = `あなたは北米ソフトウェアエンジニア面接の問題設計の専門家です。
与えられたコンテンツを分析し、問題生成の計画を提案してください。

## 問題タイプ
- multiple: 4択（概念・定義の確認）— 常に含める、全体の40-60%
- code: コード読解（出力予測）— コード例が自然なトピックのみ。純粋な理論には使わない
- truefalse: ○×判定 — 事実確認・誤解チェック用。最大4問
- explain: 口頭説明（ルーブリック付き）— 面接頻出トピックで1-3問

## ルール
- 総数: 5-15問（狭いコンテンツ→5-8、広い→10-15）
- 難易度比率デフォルト: easy 30% / medium 50% / hard 20%
- 面接頻出度が高い→問題数を多く、medium/hard比率を上げる

出力は必ずJSON形式。`;

  const user = params.pastedContent
    ? `以下のコンテンツを分析し、問題生成の計画を提案してください。

トピック: ${params.topicName_en} (${params.topicName_ja})
カテゴリ: ${params.categoryName_en}

コンテンツ:
${params.pastedContent}

既存の問題（重複回避用）:
${params.existingQuestionsSummary}`
    : `以下のトピックについて、北米エンジニア面接で問われる内容を中心に問題生成の計画を提案してください。

トピック: ${params.topicName_en} (${params.topicName_ja})
カテゴリ: ${params.categoryName_en}

既存の問題（重複回避用）:
${params.existingQuestionsSummary}`;

  return { system, user };
}
