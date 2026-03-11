export function buildChatPrompt(params: {
  topic: string;
  language: 'ja' | 'en';
  userQuestion: string;
}): { system: string; user: string } {
  const system = `あなたはソフトウェアエンジニアリングの専門家です。
現在のトピック: ${params.topic}
ユーザーが学習中のトピックについて質問しています。
回答言語: ${params.language}
正確かつ簡潔に、実務で役立つ観点を交えて ${params.language} で回答してください。`;

  const user = params.userQuestion;

  return { system, user };
}
