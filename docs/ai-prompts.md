# TechInterviewPrep AIプロンプト設計書

> `lib/prompts/` のテンプレート関数仕様 | 仕様書 v1.2 セクション7 準拠 | 2026年3月

---

## 1. ファイル構成

すべてのプロンプトは `lib/prompts/` にテンプレート関数として配置する。各関数は `{system: string, user: string}` を返す。

```
lib/prompts/
  analysis.ts      — buildAnalysisPrompt()     コンテンツ分析（Claude API）
  generation.ts    — buildGenerationPrompt()    問題生成（Claude API）
  feedback.ts      — buildFeedbackPrompt()      口頭説明フィードバック（Grok API）
  chat.ts          — buildChatPrompt()          AIチャット（Grok API）
  schemas.ts       — Zod スキーマ（AI出力バリデーション）
```

### AIプロバイダー対応表

| 機能 | プロバイダー | API | モデル |
|---|---|---|---|
| コンテンツ分析 | Anthropic | Claude API | claude-sonnet（コスト効率重視） |
| 問題生成 | Anthropic | Claude API | claude-sonnet |
| 口頭説明フィードバック | xAI | Grok API | grok |
| AIチャット | xAI | Grok API | grok |
| 音声文字起こし | OpenAI | Whisper API | whisper-1 |

---

## 2. 各プロンプト仕様

### 2-1. コンテンツ分析 (Analysis) — Claude API

管理者が投入したテキストまたは指定したトピックを分析し、問題生成の計画（タイプ・難易度・問題数）を提案する。

#### テンプレート関数

```typescript
function buildAnalysisPrompt(params: {
  topicName_ja: string;
  topicName_en: string;
  categoryName_en: string;
  pastedContent?: string;
  existingQuestionsSummary: string;
}): { system: string; user: string }
```

#### 変数テーブル

| Variable | Source | Type | 説明 |
|---|---|---|---|
| `topicName_ja` | `topics.name_ja` | `string` | トピック名（日本語） |
| `topicName_en` | `topics.name_en` | `string` | トピック名（英語） |
| `categoryName_en` | `categories.name_en` | `string` | カテゴリ名（英語） |
| `pastedContent` | ユーザー入力（任意） | `string \| undefined` | 貼り付けたコンテンツ |
| `existingQuestionsSummary` | DB クエリ → フォーマット済み文字列 | `string` | 既存問題の要約（重複回避用） |

#### System Prompt（テンプレート）

```
あなたは北米ソフトウェアエンジニア面接の問題設計の専門家です。
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

出力は必ずJSON形式。
```

#### User Prompt — テキスト投入バリアント

```
以下のコンテンツを分析し、問題生成の計画を提案してください。

トピック: ${topicName_en} (${topicName_ja})
カテゴリ: ${categoryName_en}

コンテンツ:
${pastedContent}

既存の問題（重複回避用）:
${existingQuestionsSummary}
```

#### User Prompt — トピック指定バリアント

`pastedContent` が未指定の場合に使用する。

```
以下のトピックについて、北米エンジニア面接で問われる内容を中心に問題生成の計画を提案してください。

トピック: ${topicName_en} (${topicName_ja})
カテゴリ: ${categoryName_en}

既存の問題（重複回避用）:
${existingQuestionsSummary}
```

#### 出力スキーマ — `AnalysisPlanSchema`

```typescript
import { z } from 'zod';

const QuestionPlanSchema = z.object({
  type: z.enum(['multiple', 'code', 'truefalse', 'explain']),
  difficulty: z.enum(['easy', 'medium', 'hard']),
  count: z.number().int().min(1),
  rationale: z.string(),
});

const AnalysisPlanSchema = z.object({
  topic_summary: z.string(),
  interview_relevance: z.enum(['high', 'medium', 'low']),
  interview_relevance_reason: z.string(),
  questions: z.array(QuestionPlanSchema),
  total_count: z.number().int().min(5).max(15),
  notes: z.string(),
});

type AnalysisPlan = z.infer<typeof AnalysisPlanSchema>;
```

#### トークンバジェット

| 区分 | 上限 | 備考 |
|---|---|---|
| Input | ~4,000 tokens | System + User（コンテンツ + 既存問題要約） |
| Output | ~1,000 tokens | JSON 形式の分析計画 |
| Model | claude-sonnet | コスト効率重視（分析タスクに十分な精度） |

---

### 2-2. 問題生成 (Generation) — Claude API

分析で確定した計画に基づいて、実際の問題を日英バイリンガルで生成する。

#### テンプレート関数

```typescript
function buildGenerationPrompt(params: {
  generationPlanJSON: AnalysisPlan;
  pastedContent?: string;
  existingQuestionsList: string;
}): { system: string; user: string }
```

#### 変数テーブル

| Variable | Source | Type | 説明 |
|---|---|---|---|
| `generationPlanJSON` | AnalysisPlan（管理者が編集した可能性あり） | `AnalysisPlan` | 問題生成計画 |
| `pastedContent` | ユーザー入力（任意） | `string \| undefined` | ソースコンテンツ |
| `existingQuestionsList` | DB クエリ → フォーマット済みリスト | `string` | 既存問題の一覧（重複回避用） |

#### System Prompt（テンプレート）

```
あなたは技術面接問題の作成者です。
提供された計画に従って問題を生成してください。
各問題は日本語・英語の両方を含むこと。

## 出力ルール
- multiple/code: options は4つの選択肢配列 [{label, text_ja, text_en}]、answer は {correct_index: 0-3}
- truefalse: options は null、answer は {correct_value: true/false}
- explain: options はルーブリックオブジェクト {rubric_ja: {1-4}, rubric_en: {1-4}}、answer は {model_answer_ja, model_answer_en}
- 解説は「なぜ」を説明すること
- 既存の問題と意味的に重複する問題は絶対に作らないこと

既存の問題リスト:
${existingQuestionsList}
```

#### User Prompt

```
以下の計画に基づいて問題を生成してください。

計画:
${JSON.stringify(generationPlanJSON, null, 2)}

ソースコンテンツ:
${pastedContent ?? '（トピック指定のみ — AIの知識で生成）'}
```

#### 出力スキーマ — `GeneratedQuestionsSchema`

問題タイプごとに `options` と `answer` の構造が異なるため、discriminated union で検証する。

```typescript
import { z } from 'zod';

// --- options スキーマ ---
const ChoiceOptionSchema = z.object({
  label: z.enum(['A', 'B', 'C', 'D']),
  text_ja: z.string(),
  text_en: z.string(),
});

const RubricSchema = z.object({
  rubric_ja: z.record(z.enum(['1', '2', '3', '4']), z.string()),
  rubric_en: z.record(z.enum(['1', '2', '3', '4']), z.string()),
});

// --- answer スキーマ ---
const MultipleAnswerSchema = z.object({
  correct_index: z.number().int().min(0).max(3),
});

const TrueFalseAnswerSchema = z.object({
  correct_value: z.boolean(),
});

const ExplainAnswerSchema = z.object({
  model_answer_ja: z.string(),
  model_answer_en: z.string(),
});

// --- 問題タイプ別 discriminated union ---
const MultipleQuestionSchema = z.object({
  type: z.literal('multiple'),
  difficulty: z.enum(['easy', 'medium', 'hard']),
  question_ja: z.string(),
  question_en: z.string(),
  options: z.array(ChoiceOptionSchema).length(4),
  answer: MultipleAnswerSchema,
  explanation_ja: z.string(),
  explanation_en: z.string(),
});

const CodeQuestionSchema = z.object({
  type: z.literal('code'),
  difficulty: z.enum(['easy', 'medium', 'hard']),
  question_ja: z.string(),
  question_en: z.string(),
  options: z.array(ChoiceOptionSchema).length(4),
  answer: MultipleAnswerSchema,
  explanation_ja: z.string(),
  explanation_en: z.string(),
});

const TrueFalseQuestionSchema = z.object({
  type: z.literal('truefalse'),
  difficulty: z.enum(['easy', 'medium', 'hard']),
  question_ja: z.string(),
  question_en: z.string(),
  options: z.null(),
  answer: TrueFalseAnswerSchema,
  explanation_ja: z.string(),
  explanation_en: z.string(),
});

const ExplainQuestionSchema = z.object({
  type: z.literal('explain'),
  difficulty: z.enum(['easy', 'medium', 'hard']),
  question_ja: z.string(),
  question_en: z.string(),
  options: RubricSchema,
  answer: ExplainAnswerSchema,
  explanation_ja: z.string(),
  explanation_en: z.string(),
});

const GeneratedQuestionSchema = z.discriminatedUnion('type', [
  MultipleQuestionSchema,
  CodeQuestionSchema,
  TrueFalseQuestionSchema,
  ExplainQuestionSchema,
]);

const GeneratedQuestionsSchema = z.object({
  questions: z.array(GeneratedQuestionSchema).min(5).max(15),
});

type GeneratedQuestions = z.infer<typeof GeneratedQuestionsSchema>;
```

#### トークンバジェット

| 区分 | 上限 | 備考 |
|---|---|---|
| Input | ~8,000 tokens | System（既存問題リスト含む）+ User（計画JSON + ソースコンテンツ） |
| Output | ~4,000 tokens | 5-15問の問題を日英で生成 |
| Model | claude-sonnet | 高品質な問題生成が必要だがコストも考慮 |

---

### 2-3. 口頭説明フィードバック (Feedback) — Grok API

ユーザーの口頭説明回答をルーブリック（理解度の4段階基準）に基づいて評価し、フィードバックを返す。

#### テンプレート関数

```typescript
function buildFeedbackPrompt(params: {
  language: 'ja' | 'en';
  rubric: Record<'1' | '2' | '3' | '4', string>;
  modelAnswer: string;
  question: string;
  userAnswer: string;
}): { system: string; user: string }
```

#### 変数テーブル

| Variable | Source | Type | 説明 |
|---|---|---|---|
| `language` | ユーザー設定（localStorage） | `'ja' \| 'en'` | 回答言語 |
| `rubric` | `questions.options.rubric_ja` or `rubric_en` | `Record<'1'\|'2'\|'3'\|'4', string>` | 言語に応じたルーブリック |
| `modelAnswer` | `questions.answer.model_answer_ja` or `model_answer_en` | `string` | 言語に応じた模範解答 |
| `question` | `questions.question_ja` or `question_en` | `string` | 言語に応じた問題文 |
| `userAnswer` | ユーザー入力（テキスト or Whisper文字起こし） | `string` | ユーザーの回答 |

> **言語の選択ロジック**: `language === 'ja'` なら `rubric_ja` / `model_answer_ja` / `question_ja`、`'en'` なら `rubric_en` / `model_answer_en` / `question_en` を使用する。

#### System Prompt（テンプレート）

```
あなたは北米テック企業の面接官です。
回答言語: ${language}
以下のルーブリック（理解度の4段階基準）に基づいて、候補者の回答を ${language} で評価してください。
ルーブリック: ${JSON.stringify(rubric)}
模範解答: ${modelAnswer}

評価手順:
1. ルーブリックに基づいて理解度を 1-4 で評価する
2. 評価の根拠を説明する
3. 説明の不足点・誤りを指摘する
4. より自然な英語表現を提案する

出力形式:
- rating: 1-4 の整数（必須）
- feedback: 評価コメント（${language}で記述）
```

#### User Prompt

```
質問：${question}
回答：${userAnswer}
```

#### 出力スキーマ — `FeedbackSchema`

```typescript
const FeedbackSchema = z.object({
  rating: z.number().int().min(1).max(4),
  feedback: z.string(),
});

type Feedback = z.infer<typeof FeedbackSchema>;
```

> **FSRS 連携**: `rating` はそのまま FSRS の rating 値として使用する。`result` は `rating >= 3` なら `'correct'`、`rating <= 2` なら `'wrong'` に判定する。

#### トークンバジェット

| 区分 | 上限 | 備考 |
|---|---|---|
| Input | ~2,000 tokens | System（ルーブリック + 模範解答）+ User（質問 + 回答） |
| Output | ~500 tokens | rating + feedback テキスト |
| Model | grok | xAI Grok API |

---

### 2-4. AIチャット (Chat) — Grok API

学習中にトピックについて自由に質問できるチャット機能。クイズ画面・口頭説明画面のチャットパネルから利用する。

#### テンプレート関数

```typescript
function buildChatPrompt(params: {
  topic: string;
  language: 'ja' | 'en';
  userQuestion: string;
}): { system: string; user: string }
```

#### 変数テーブル

| Variable | Source | Type | 説明 |
|---|---|---|---|
| `topic` | `topics.name_en` (`topics.name_ja`) | `string` | 現在のトピック名 |
| `language` | ユーザー設定（localStorage） | `'ja' \| 'en'` | 回答言語 |
| `userQuestion` | ユーザー入力 | `string` | ユーザーの質問テキスト |

#### System Prompt（テンプレート）

```
あなたはソフトウェアエンジニアリングの専門家です。
現在のトピック: ${topic}
ユーザーが学習中のトピックについて質問しています。
回答言語: ${language}
正確かつ簡潔に、実務で役立つ観点を交えて ${language} で回答してください。
```

#### User Prompt

```
${userQuestion}
```

#### トークンバジェット

| 区分 | 上限 | 備考 |
|---|---|---|
| Input | ~1,000 tokens + メッセージ履歴 | System + 直近のチャット履歴 + 最新の質問 |
| Output | ~500 tokens | 回答テキスト |
| Model | grok | xAI Grok API |

> **チャット履歴**: セッション中のみ保持（DB保存なし）。入力トークン上限を超えないよう、古いメッセージから順に削除する。

---

## 3. 構造化出力の強制

### Claude API（Analysis / Generation）— `zodOutputFormat` + `messages.parse()`

Anthropic SDK の **Structured Outputs** 機能を使用する。`zodOutputFormat` ヘルパーで Zod スキーマを JSON Schema に変換し、`output_config.format` に渡す。レスポンスは `parsed_output` プロパティで型安全に取得できる。

```typescript
import Anthropic from '@anthropic-ai/sdk';
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod';

const client = new Anthropic();

// Analysis の例
const message = await client.messages.parse({
  model: 'claude-sonnet-4-5',
  max_tokens: 4000,
  system: systemPrompt,
  messages: [{ role: 'user', content: userPrompt }],
  output_config: {
    format: zodOutputFormat(AnalysisPlanSchema),
  },
});

// parsed_output は AnalysisPlan 型として取得される（Zod バリデーション済み）
const plan = message.parsed_output;  // type: AnalysisPlan

// Generation の例
const genMessage = await client.messages.parse({
  model: 'claude-sonnet-4-5',
  max_tokens: 8000,
  system: systemPrompt,
  messages: [{ role: 'user', content: userPrompt }],
  output_config: {
    format: zodOutputFormat(GeneratedQuestionsSchema),
  },
});

const questions = genMessage.parsed_output;  // type: GeneratedQuestions
```

> **注意**: `zodOutputFormat` は内部的に Zod スキーマを JSON Schema に変換し、Claude がスキーマ準拠の JSON のみを出力するよう制約する。手動の `JSON.parse` + `extractJSON` は不要。

### Grok API（Feedback / Chat）— `zodResponseFormat` + `chat.completions.parse()`

Grok は OpenAI 互換 API を提供するため、OpenAI SDK の **Structured Outputs** 機能をそのまま使用できる。`zodResponseFormat` で Zod スキーマを渡し、`response_format` に設定する。

```typescript
import OpenAI from 'openai';
import { zodResponseFormat } from 'openai/helpers/zod';

const grok = new OpenAI({
  apiKey: process.env.XAI_API_KEY,
  baseURL: 'https://api.x.ai/v1',
});

// Feedback の例
const completion = await grok.chat.completions.parse({
  model: 'grok-3',
  messages: [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt },
  ],
  response_format: zodResponseFormat(FeedbackSchema, 'feedback'),
});

const feedback = completion.choices[0]?.message.parsed;  // type: Feedback
// feedback.rating  → 1-4
// feedback.feedback → string

// Chat の例（自由テキスト — 構造化出力不要）
const chatCompletion = await grok.chat.completions.create({
  model: 'grok-3',
  messages: [
    { role: 'system', content: systemPrompt },
    ...chatHistory,
    { role: 'user', content: userQuestion },
  ],
});

const reply = chatCompletion.choices[0]?.message.content;
```

> **注意**: Chat エンドポイントは自由テキスト応答のため `zodResponseFormat` は不要。Feedback のみ構造化出力を使用する。
```

---

## 4. 既存問題コンテキスト構築

分析・生成プロンプトに渡す既存問題の情報を構築する関数。

### `buildExistingQuestionsContext`

```typescript
interface QuestionSummary {
  id: string;
  type: 'multiple' | 'code' | 'truefalse' | 'explain';
  difficulty: 'easy' | 'medium' | 'hard';
  question_en: string;
}

function buildExistingQuestionsContext(questions: QuestionSummary[]): string {
  if (questions.length === 0) return 'なし';

  // トークン上限（~2,000 tokens ≒ 約8,000文字）を超える場合は古い問題から削除
  const TOKEN_CHAR_LIMIT = 8000;
  let result = '';

  for (let i = 0; i < questions.length; i++) {
    const q = questions[i];
    const line = `${i + 1}. [${q.type}/${q.difficulty}] ${q.question_en}\n`;

    if ((result + line).length > TOKEN_CHAR_LIMIT) break;
    result += line;
  }

  return result;
}
```

### データ取得クエリ

```sql
SELECT id, type, difficulty, question_en
FROM questions
WHERE topic_id = $1
  AND deleted_at IS NULL
ORDER BY created_at ASC;
```

### フォーマット例

```
1. [multiple/easy] What is a closure?
2. [multiple/medium] What is the difference between var, let, and const?
3. [code/medium] What does the following code output?
4. [truefalse/easy] Arrow functions have their own 'this' binding.
5. [explain/hard] Explain the event loop in JavaScript.
```

> **トークン制限**: 合計が ~2,000 tokens を超える場合、`created_at` が古い問題（リストの先頭）から順に削除する。分析プロンプトでは `existingQuestionsSummary`、生成プロンプトでは `existingQuestionsList` として渡す（同じ関数の出力を使用）。

---

## 5. エラー時のフォールバック

### 5-1. 構造化出力のパース失敗

`zodOutputFormat` (Claude) / `zodResponseFormat` (Grok) を使用するため、通常はスキーマ準拠の JSON が返される。ただし、API エラーやネットワーク問題でパースに失敗する可能性がある。

```typescript
async function callWithStructuredOutput<T>(
  callAI: () => Promise<{ parsed_output: T | null }>,
): Promise<T> {
  const result = await callAI();

  // 構造化出力が正常に返された場合
  if (result.parsed_output !== null) {
    return result.parsed_output;
  }

  // parsed_output が null の場合（モデルが拒否した等）
  throw new Error('AI did not return structured output');
}
```

> **注意**: `zodOutputFormat` / `zodResponseFormat` を使用する場合、SDK 側で Zod バリデーションが自動実行されるため、手動の `JSON.parse` + `extractJSON` は不要。以下のフォールバックは構造化出力がサポートされない環境や、API エラー時のリカバリー用。

### 5-2. 不正な JSON の抽出（フォールバック）

構造化出力が利用できない場合のフォールバック。AI がマークダウンコードブロックやテキスト付きで JSON を返す場合の対応。

```typescript
function extractJSON(text: string): unknown {
  // コードブロック内の JSON を抽出
  const codeBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeBlockMatch) {
    return JSON.parse(codeBlockMatch[1].trim());
  }

  // オブジェクトまたは配列を抽出
  const jsonMatch = text.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
  if (jsonMatch) {
    return JSON.parse(jsonMatch[1]);
  }

  // そのまま JSON として解析
  return JSON.parse(text);
}
```

### 5-3. API タイムアウト

```typescript
// タイムアウト時はユーザーフレンドリーなエラーを返す
throw new Error('AIの応答に時間がかかっています。しばらく待ってから再度お試しください。');
```

### 5-4. レート制限 (429)

```typescript
async function callWithRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
): Promise<T> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      if (error?.status === 429 && attempt < maxRetries) {
        const delay = Math.pow(2, attempt) * 1000; // 1s, 2s, 4s
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      throw error;
    }
  }
  throw new Error('Max retries exceeded');
}
```

### エラー対応まとめ

| エラー種別 | 対応 | リトライ |
|---|---|---|
| 構造化出力パース失敗 | `parsed_output` が null → エラー返却 | — |
| 不正な JSON（フォールバック） | `extractJSON()` で抽出 → バリデーション | — |
| API タイムアウト | ユーザーフレンドリーなエラー表示 | 手動リトライを案内 |
| レート制限 (429) | 指数バックオフ（1s → 2s → 4s） | 最大3回 |
| ネットワークエラー | エラー表示 + リトライ案内 | 手動リトライを案内 |
