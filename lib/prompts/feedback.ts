export function buildFeedbackPrompt(params: {
  language: 'ja' | 'en';
  rubric: Record<'1' | '2' | '3' | '4', string>;
  modelAnswer: string;
  question: string;
  userAnswer: string;
}): { system: string; user: string } {
  const system = `あなたは北米テック企業の面接官です。
回答言語: ${params.language}
以下のルーブリック（理解度の4段階基準）に基づいて、候補者の回答を ${params.language} で評価してください。
ルーブリック: ${JSON.stringify(params.rubric)}
模範解答: ${params.modelAnswer}

評価手順:
1. ルーブリックに基づいて理解度を 1-4 で評価する
2. 評価の根拠を説明する
3. 説明の不足点・誤りを指摘する
4. より自然な英語表現を提案する

出力形式:
- rating: 1-4 の整数（必須）
- feedback: 評価コメント（${params.language}で記述）`;

  const user = `質問：${params.question}
回答：${params.userAnswer}`;

  return { system, user };
}
