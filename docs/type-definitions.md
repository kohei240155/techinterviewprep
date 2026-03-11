# TechInterviewPrep — TypeScript 型定義書

> 仕様書 v1.2 / DB設計書 準拠 | 2026年3月

---

## 1. DBテーブル型 (Database Row Types)

DB設計書セクション2の各テーブル定義に1:1対応するインターフェース。
Supabase クライアントの `Tables` 型として使用する。

```ts
// ---------- users ----------
interface User {
  id: string;                  // uuid PK — auth.users.id と同値
  display_name: string;        // NOT NULL DEFAULT ''
  avatar_url: string;          // NOT NULL DEFAULT ''
  created_at: string;          // timestamptz NOT NULL — ISO 8601 文字列
  updated_at: string | null;   // nullable
  deleted_at: string | null;   // 論理削除日時
}

// ---------- categories ----------
interface Category {
  id: string;                  // uuid PK
  name_ja: string;             // NOT NULL UNIQUE
  name_en: string;             // NOT NULL DEFAULT ''
  sort_order: number;          // int NOT NULL DEFAULT 0
  created_at: string;          // timestamptz NOT NULL
  updated_at: string | null;
  deleted_at: string | null;
}

// ---------- topics ----------
interface Topic {
  id: string;                  // uuid PK
  category_id: string;         // uuid FK → categories.id
  name_ja: string;             // NOT NULL
  name_en: string;             // NOT NULL DEFAULT ''
  sort_order: number;          // int NOT NULL DEFAULT 0
  created_at: string;          // timestamptz NOT NULL
  updated_at: string | null;
  deleted_at: string | null;
}

// ---------- questions ----------
interface Question {
  id: string;                  // uuid PK
  topic_id: string;            // uuid FK → topics.id
  type: QuestionType;          // 'multiple' | 'code' | 'truefalse' | 'explain'
  difficulty: Difficulty;      // 'easy' | 'medium' | 'hard'
  question_ja: string;         // NOT NULL
  question_en: string;         // NOT NULL DEFAULT ''
  options: QuestionOptions;    // jsonb nullable — 型は type に依存（セクション2参照）
  answer: QuestionAnswer;      // jsonb NOT NULL — 型は type に依存（セクション2参照）
  explanation_ja: string;      // NOT NULL DEFAULT ''
  explanation_en: string;      // NOT NULL DEFAULT ''
  created_at: string;          // timestamptz NOT NULL
  updated_at: string | null;
  deleted_at: string | null;
}

// ---------- progress ----------
interface Progress {
  id: string;                  // uuid PK
  user_id: string;             // uuid FK → users.id
  question_id: string;         // uuid FK → questions.id
  result: ProgressResult;      // 'correct' | 'wrong' | 'skipped'
  answered_at: string;         // timestamptz NOT NULL
  stability: number | null;    // real — FSRS 安定性
  difficulty_fsrs: number | null; // real — FSRS 難易度（questions.difficulty との名前衝突回避）
  due_date: string | null;     // timestamptz — 次回復習日
  rating: number | null;       // int 1-4 — クイズ: 正解=3,不正解=1 / 説明: AI評価1-4
  reps: number;                // int NOT NULL DEFAULT 0
  lapses: number;              // int NOT NULL DEFAULT 0
  state: FSRSState;            // int NOT NULL DEFAULT 0 — 0=New,1=Learning,2=Review,3=Relearning
  last_review: string | null;  // timestamptz
  updated_at: string | null;
  deleted_at: string | null;
}

type ProgressResult = 'correct' | 'wrong' | 'skipped';

// ---------- bookmarks ----------
interface Bookmark {
  id: string;                  // uuid PK
  user_id: string;             // uuid FK → users.id
  question_id: string;         // uuid FK → questions.id
  created_at: string;          // timestamptz NOT NULL
}
```

> **注記**: Supabase JS クライアントは `timestamptz` を ISO 8601 文字列として返すため、
> タイムスタンプ型は `string` で定義する。フロントエンドで `new Date(value)` に変換して使用する。

---

## 2. JSONB判別共用体型 (Discriminated Union Types for JSONB)

`questions.options` と `questions.answer` は問題タイプ (`type`) によって構造が異なる。
判別共用体 (Discriminated Union) で型安全にアクセスする。

### 2-1. QuestionOptions

```ts
// --- 共通: 選択肢の1項目 ---
interface OptionChoice {
  label: string;     // "A" | "B" | "C" | "D"
  text_ja: string;   // 選択肢テキスト（日本語）
  text_en: string;   // 選択肢テキスト（英語）
}

// --- explain 用ルーブリック ---
interface ExplainRubric {
  rubric_ja: Record<'1' | '2' | '3' | '4', string>;
  rubric_en: Record<'1' | '2' | '3' | '4', string>;
}

// --- QuestionOptions 判別共用体 ---
// type = 'multiple' | 'code' → OptionChoice[] (4要素)
// type = 'truefalse'         → null
// type = 'explain'           → ExplainRubric
type QuestionOptions = OptionChoice[] | ExplainRubric | null;
```

**使用パターン（型ガード）:**

```ts
function isOptionChoices(
  options: QuestionOptions,
  type: QuestionType
): options is OptionChoice[] {
  return type === 'multiple' || type === 'code';
}

function isExplainRubric(
  options: QuestionOptions,
  type: QuestionType
): options is ExplainRubric {
  return type === 'explain';
}
```

### 2-2. QuestionAnswer

```ts
// --- multiple / code 用 ---
interface MultipleAnswer {
  correct_index: number;  // 0-3（選択肢配列のインデックス）
}

// --- truefalse 用 ---
interface TrueFalseAnswer {
  correct_value: boolean;
}

// --- explain 用 ---
interface ExplainAnswer {
  model_answer_ja: string;
  model_answer_en: string;
}

// --- QuestionAnswer 判別共用体 ---
type QuestionAnswer = MultipleAnswer | TrueFalseAnswer | ExplainAnswer;
```

**使用パターン（型ガード）:**

```ts
function isMultipleAnswer(
  answer: QuestionAnswer,
  type: QuestionType
): answer is MultipleAnswer {
  return type === 'multiple' || type === 'code';
}

function isTrueFalseAnswer(
  answer: QuestionAnswer,
  type: QuestionType
): answer is TrueFalseAnswer {
  return type === 'truefalse';
}

function isExplainAnswer(
  answer: QuestionAnswer,
  type: QuestionType
): answer is ExplainAnswer {
  return type === 'explain';
}
```

### 2-3. 型付き Question ヘルパー

question の `type` フィールドで options/answer の型を絞り込むジェネリック型。

```ts
interface MultipleQuestion extends Omit<Question, 'type' | 'options' | 'answer'> {
  type: 'multiple' | 'code';
  options: OptionChoice[];
  answer: MultipleAnswer;
}

interface TrueFalseQuestion extends Omit<Question, 'type' | 'options' | 'answer'> {
  type: 'truefalse';
  options: null;
  answer: TrueFalseAnswer;
}

interface ExplainQuestion extends Omit<Question, 'type' | 'options' | 'answer'> {
  type: 'explain';
  options: ExplainRubric;
  answer: ExplainAnswer;
}

type TypedQuestion = MultipleQuestion | TrueFalseQuestion | ExplainQuestion;
```

---

## 3. API型 (API Request/Response Types)

各 Route Handler のリクエスト / レスポンス型と、Zod バリデーションスキーマ。

### 3-1. `POST /api/ai/analyze` — コンテンツ分析 (Admin only)

```ts
// --- Request ---
interface AnalyzeRequest {
  topic_id: string;                        // 対象トピックの uuid
  content?: string;                        // テキスト投入の場合のペーストテキスト（トピック指定のみの場合は省略）
  existing_questions_summary?: string;      // 重複回避用の既存問題サマリー
}

// --- Response ---
interface AnalyzeResponse {
  plan: AnalysisPlan;  // セクション4で定義
}

// --- Zod Schema ---
import { z } from 'zod';

const analyzeRequestSchema = z.object({
  topic_id: z.string().uuid(),
  content: z.string().optional(),
  existing_questions_summary: z.string().optional(),
});
```

### 3-2. `POST /api/ai/generate` — 問題生成 (Admin only)

```ts
// --- Request ---
interface GenerateRequest {
  topic_id: string;                   // 対象トピックの uuid
  plan: AnalysisPlan;                 // Step 1 の出力（管理者が編集済み）
  content?: string;                   // ソースコンテンツ
  existing_questions: string;         // 重複チェック用の既存問題リスト
}

// --- Response ---
interface GenerateResponse {
  questions: GeneratedQuestion[];     // セクション4で定義
}

// --- Zod Schema ---
const generateRequestSchema = z.object({
  topic_id: z.string().uuid(),
  plan: z.object({
    topic_summary: z.string(),
    interview_relevance: z.enum(['high', 'medium', 'low']),
    interview_relevance_reason: z.string(),
    questions: z.array(z.object({
      type: z.enum(['multiple', 'code', 'truefalse', 'explain']),
      difficulty: z.enum(['easy', 'medium', 'hard']),
      count: z.number().int().min(1),
      rationale: z.string(),
    })),
    total_count: z.number().int().min(5).max(15),
    notes: z.string(),
  }),
  content: z.string().optional(),
  existing_questions: z.string(),
});
```

### 3-3. `POST /api/ai/feedback` — 口頭説明フィードバック (Guest ok)

```ts
// --- Request ---
interface FeedbackRequest {
  question_id: string;          // 問題の uuid
  user_answer: string;          // ユーザーの回答テキスト
  language: Language;           // 'ja' | 'en'
}

// --- Response ---
interface AIFeedbackResponse {
  rating: 1 | 2 | 3 | 4;      // ルーブリックに基づく理解度評価
  feedback: string;             // 評価コメント（language で指定した言語）
}

// --- Zod Schema ---
const feedbackRequestSchema = z.object({
  question_id: z.string().uuid(),
  user_answer: z.string().min(1),
  language: z.enum(['ja', 'en']),
});
```

### 3-4. `POST /api/ai/chat` — AIチャット質問 (Guest ok)

```ts
// --- Request ---
interface ChatRequest {
  topic_id: string;              // 現在のトピック uuid
  message: string;               // ユーザーの質問テキスト
  language: Language;            // 'ja' | 'en'
  history: ChatMessage[];        // これまでのチャット履歴
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

// --- Response ---
interface ChatResponse {
  reply: string;                 // AIの回答テキスト
}

// --- Zod Schema ---
const chatMessageSchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string(),
});

const chatRequestSchema = z.object({
  topic_id: z.string().uuid(),
  message: z.string().min(1),
  language: z.enum(['ja', 'en']),
  history: z.array(chatMessageSchema),
});
```

### 3-5. `POST /api/ai/transcribe` — 音声文字起こし (Guest ok)

```ts
// --- Request ---
// multipart/form-data で送信
interface TranscribeRequest {
  audio: File;                   // 音声ファイル（Blob / File）
  language: Language;            // 'ja' | 'en'
}

// --- Response ---
interface TranscribeResponse {
  text: string;                  // 文字起こし結果
}

// --- Zod Schema ---
// Note: multipart/form-data のため、サーバー側で FormData から手動パース
const transcribeRequestSchema = z.object({
  audio: z.instanceof(Blob),
  language: z.enum(['ja', 'en']),
});
```

### 3-6. `POST /api/admin/questions` — 問題一括保存 (Admin only)

```ts
// --- Request ---
interface BulkSaveQuestionsRequest {
  topic_id: string;
  questions: Array<{
    type: QuestionType;
    difficulty: Difficulty;
    question_ja: string;
    question_en: string;
    options: QuestionOptions;
    answer: QuestionAnswer;
    explanation_ja: string;
    explanation_en: string;
  }>;
}

// --- Response ---
interface BulkSaveQuestionsResponse {
  inserted_count: number;
  question_ids: string[];        // 挿入された問題の uuid 配列
}

// --- Zod Schema ---
const optionChoiceSchema = z.object({
  label: z.string(),
  text_ja: z.string(),
  text_en: z.string(),
});

const explainRubricSchema = z.object({
  rubric_ja: z.record(z.enum(['1', '2', '3', '4']), z.string()),
  rubric_en: z.record(z.enum(['1', '2', '3', '4']), z.string()),
});

const multipleAnswerSchema = z.object({
  correct_index: z.number().int().min(0).max(3),
});

const trueFalseAnswerSchema = z.object({
  correct_value: z.boolean(),
});

const explainAnswerSchema = z.object({
  model_answer_ja: z.string(),
  model_answer_en: z.string(),
});

const bulkSaveQuestionsRequestSchema = z.object({
  topic_id: z.string().uuid(),
  questions: z.array(z.object({
    type: z.enum(['multiple', 'code', 'truefalse', 'explain']),
    difficulty: z.enum(['easy', 'medium', 'hard']),
    question_ja: z.string().min(1),
    question_en: z.string(),
    options: z.union([
      z.array(optionChoiceSchema).length(4),
      explainRubricSchema,
      z.null(),
    ]),
    answer: z.union([
      multipleAnswerSchema,
      trueFalseAnswerSchema,
      explainAnswerSchema,
    ]),
    explanation_ja: z.string(),
    explanation_en: z.string(),
  })),
});
```

### 3-7. `PUT /api/admin/questions/[id]` — 問題個別更新 (Admin only)

```ts
// --- Request ---
interface UpdateQuestionRequest {
  type?: QuestionType;
  difficulty?: Difficulty;
  question_ja?: string;
  question_en?: string;
  options?: QuestionOptions;
  answer?: QuestionAnswer;
  explanation_ja?: string;
  explanation_en?: string;
}

// --- Response ---
interface UpdateQuestionResponse {
  question: Question;            // 更新後の問題オブジェクト
}

// --- Zod Schema ---
const updateQuestionRequestSchema = z.object({
  type: z.enum(['multiple', 'code', 'truefalse', 'explain']).optional(),
  difficulty: z.enum(['easy', 'medium', 'hard']).optional(),
  question_ja: z.string().min(1).optional(),
  question_en: z.string().optional(),
  options: z.union([
    z.array(optionChoiceSchema).length(4),
    explainRubricSchema,
    z.null(),
  ]).optional(),
  answer: z.union([
    multipleAnswerSchema,
    trueFalseAnswerSchema,
    explainAnswerSchema,
  ]).optional(),
  explanation_ja: z.string().optional(),
  explanation_en: z.string().optional(),
});
```

### 3-8. `DELETE /api/admin/questions/[id]` — 問題削除 (Admin only)

```ts
// --- Request ---
// パスパラメータ [id] のみ。リクエストボディなし。

// --- Response ---
// 成功時: HTTP 204 No Content
// 失敗時: ApiError（セクション7参照）
```

---

## 4. AIスキーマ型 (AI Schema Types)

AI（Claude / Grok）の出力を型安全にパースするための型と Zod スキーマ。

### 4-1. AnalysisPlan — Step 1 出力（コンテンツ分析）

```ts
interface AnalysisPlanQuestion {
  type: QuestionType;          // 'multiple' | 'code' | 'truefalse' | 'explain'
  difficulty: Difficulty;      // 'easy' | 'medium' | 'hard'
  count: number;               // この type × difficulty の問題数
  rationale: string;           // この構成にした理由
}

interface AnalysisPlan {
  topic_summary: string;                          // コンテンツの要約
  interview_relevance: 'high' | 'medium' | 'low'; // 面接関連度
  interview_relevance_reason: string;             // 面接関連度の理由
  questions: AnalysisPlanQuestion[];              // 問題構成の提案
  total_count: number;                            // 問題の合計数（5-15）
  notes: string;                                  // 補足事項
}

// --- Zod Schema ---
const analysisPlanQuestionSchema = z.object({
  type: z.enum(['multiple', 'code', 'truefalse', 'explain']),
  difficulty: z.enum(['easy', 'medium', 'hard']),
  count: z.number().int().min(1),
  rationale: z.string(),
});

const analysisPlanSchema = z.object({
  topic_summary: z.string(),
  interview_relevance: z.enum(['high', 'medium', 'low']),
  interview_relevance_reason: z.string(),
  questions: z.array(analysisPlanQuestionSchema).min(1),
  total_count: z.number().int().min(5).max(15),
  notes: z.string(),
});
```

### 4-2. GeneratedQuestion / GeneratedQuestions — Step 2 出力（問題生成）

```ts
interface GeneratedQuestion {
  type: QuestionType;
  difficulty: Difficulty;
  question_ja: string;
  question_en: string;
  options: QuestionOptions;       // OptionChoice[] | ExplainRubric | null
  answer: QuestionAnswer;         // MultipleAnswer | TrueFalseAnswer | ExplainAnswer
  explanation_ja: string;
  explanation_en: string;
}

interface GeneratedQuestions {
  questions: GeneratedQuestion[];
}

// --- Zod Schema ---
const generatedQuestionSchema = z.object({
  type: z.enum(['multiple', 'code', 'truefalse', 'explain']),
  difficulty: z.enum(['easy', 'medium', 'hard']),
  question_ja: z.string().min(1),
  question_en: z.string().min(1),
  options: z.union([
    z.array(optionChoiceSchema).length(4),
    explainRubricSchema,
    z.null(),
  ]),
  answer: z.union([
    multipleAnswerSchema,
    trueFalseAnswerSchema,
    explainAnswerSchema,
  ]),
  explanation_ja: z.string().min(1),
  explanation_en: z.string().min(1),
});

const generatedQuestionsSchema = z.object({
  questions: z.array(generatedQuestionSchema).min(1),
});
```

### 4-3. FeedbackResult — Grok フィードバック出力

```ts
interface FeedbackResult {
  rating: 1 | 2 | 3 | 4;      // ルーブリックに基づく理解度評価
  feedback: string;             // 評価コメント（ユーザー設定の言語）
}

// --- Zod Schema ---
const feedbackResultSchema = z.object({
  rating: z.number().int().min(1).max(4) as z.ZodType<1 | 2 | 3 | 4>,
  feedback: z.string().min(1),
});
```

> **判定ルール**: `rating >= 3` → `result = 'correct'` / `rating <= 2` → `result = 'wrong'`

---

## 5. フロントエンド型 (Frontend Types)

### 5-1. リテラル型・列挙型

```ts
type Language = 'ja' | 'en';
type QuestionType = 'multiple' | 'code' | 'truefalse' | 'explain';
type Difficulty = 'easy' | 'medium' | 'hard';
type QuizMode = 'new' | 'review';
type QuestionCount = 5 | 10 | 15 | 20 | 'all';
```

### 5-2. QuizSessionState — クイズモードのセッション状態

```ts
interface QuizAnswer {
  question_id: string;
  selected_index: number | null;     // 選択した選択肢のインデックス（0-3）、skipped なら null
  result: ProgressResult;            // 'correct' | 'wrong' | 'skipped'
  time_spent_ms: number;             // この問題にかかった時間（ミリ秒）
}

interface QuizSessionState {
  topic_id: string;
  mode: QuizMode;                    // 'new' | 'review'
  questions: Question[];             // 出題される問題の配列
  current_index: number;             // 現在表示中の問題インデックス（0始まり）
  answers: QuizAnswer[];             // 回答済みの結果配列
  status: 'idle' | 'in_progress' | 'reviewing' | 'completed';
  started_at: Date;                  // セッション開始時刻
  total_time_ms: number;             // 経過時間（ミリ秒）
  result: SessionResult | null;      // 完了後に算出
}
```

### 5-3. ExplainSessionState — 口頭説明モードのセッション状態

```ts
interface ExplainUserAnswer {
  question_id: string;
  user_answer: string;                   // ユーザーの回答テキスト
  feedback: FeedbackResult | null;       // AI フィードバック（取得前は null）
  result: ProgressResult;                // rating >= 3 → 'correct' / rating <= 2 → 'wrong'
  time_spent_ms: number;
}

interface ExplainSessionState {
  topic_id: string;
  questions: ExplainQuestion[];          // type = 'explain' の問題のみ
  current_index: number;
  answers: ExplainUserAnswer[];
  status: 'idle' | 'in_progress' | 'awaiting_feedback' | 'reviewing' | 'completed';
  started_at: Date;
  total_time_ms: number;
  result: SessionResult | null;
}
```

### 5-4. SessionResult — インライン結果表示

`/results` ルートは廃止済み。クイズ / 口頭説明ページ内でインライン表示する。

```ts
interface PerQuestionResult {
  question_id: string;
  question_ja: string;
  question_en: string;
  type: QuestionType;
  difficulty: Difficulty;
  result: ProgressResult;                // 'correct' | 'wrong' | 'skipped'
  time_spent_ms: number;
  // クイズ用
  selected_index?: number | null;
  correct_index?: number;
  // 口頭説明用
  user_answer?: string;
  feedback?: FeedbackResult | null;
}

interface SessionResult {
  topic_id: string;
  total_questions: number;
  correct_count: number;
  wrong_count: number;
  skipped_count: number;
  accuracy_percent: number;              // 正答率 (0-100)
  total_time_ms: number;                 // セッション全体の所要時間
  per_question: PerQuestionResult[];     // 問題ごとの結果
}
```

### 5-5. Admin 問題生成ウィザード状態型

```ts
type GenerateWizardStep = 'input' | 'plan_review' | 'generating' | 'preview' | 'saving' | 'done';

interface GenerateWizardState {
  step: GenerateWizardStep;

  // Step: input
  input_mode: 'text' | 'topic';         // テキスト投入 or トピック指定
  topic_id: string;
  content: string;                       // テキスト投入の場合のペーストテキスト

  // Step: plan_review
  plan: AnalysisPlan | null;             // AI 分析の出力
  edited_plan: AnalysisPlan | null;      // 管理者が編集後の計画

  // Step: preview
  generated_questions: GeneratedQuestion[];  // 生成された問題リスト
  selected_question_indices: number[];       // 保存対象として選択された問題のインデックス

  // UI state
  is_loading: boolean;
  error: string | null;
}
```

### 5-6. ダッシュボード関連型

```ts
interface TopicAccuracy {
  topic_id: string;
  topic_name_ja: string;
  topic_name_en: string;
  total: number;
  correct: number;
  accuracy_percent: number;
}

interface DashboardData {
  due_review_count: number;              // 復習が必要な問題数
  streak_days: number;                   // 連続学習日数
  topic_accuracies: TopicAccuracy[];     // トピック別正答率（Recharts 用データ）
  bookmarked_questions: Question[];      // ブックマーク済み問題のピックアップ
  weak_topics: Topic[];                  // 弱点トピック（正答率が低い順）
}
```

---

## 6. FSRS型 (FSRS Types)

`ts-fsrs` ライブラリの Card 型と progress テーブルカラムのマッピング。

### 6-1. 定数型

```ts
// FSRS Rating — ts-fsrs の Rating enum に対応
type FSRSRating = 1 | 2 | 3 | 4;
// 1 = Again（不正解/忘却）
// 2 = Hard
// 3 = Good（正解）
// 4 = Easy

// FSRS State — ts-fsrs の State enum に対応
type FSRSState = 0 | 1 | 2 | 3;
// 0 = New
// 1 = Learning
// 2 = Review
// 3 = Relearning
```

### 6-2. FSRSCard — progress テーブルとのマッピング

```ts
// ts-fsrs の Card 型に対応するフィールド
interface FSRSCard {
  due: Date;                    // progress.due_date
  stability: number;            // progress.stability
  difficulty: number;           // progress.difficulty_fsrs
  elapsed_days: number;         // 前回レビューからの経過日数（算出値）
  scheduled_days: number;       // 次回レビューまでの予定日数（算出値）
  reps: number;                 // progress.reps
  lapses: number;               // progress.lapses
  state: FSRSState;             // progress.state
  last_review: Date;            // progress.last_review
}
```

### 6-3. 変換ヘルパー型

```ts
// progress レコード → ts-fsrs Card 変換
type ProgressToFSRSCard = (progress: Progress) => FSRSCard;

// ts-fsrs Card → progress 更新用データ変換
interface FSRSUpdateData {
  stability: number;
  difficulty_fsrs: number;
  due_date: string;             // ISO 8601
  reps: number;
  lapses: number;
  state: FSRSState;
  last_review: string;          // ISO 8601
}

type FSRSCardToUpdateData = (card: FSRSCard) => FSRSUpdateData;
```

### 6-4. クイズ/口頭説明 → FSRS rating マッピング

```ts
// クイズモード: 自動マッピング
// 正解 → Good(3) / 不正解・スキップ → Again(1)
function quizResultToRating(result: ProgressResult): FSRSRating {
  return result === 'correct' ? 3 : 1;
}

// 口頭説明モード: AI評価をそのまま使用
// rating 1-4 がそのまま FSRS Rating として使用される
// result 判定: rating >= 3 → 'correct' / rating <= 2 → 'wrong'
function feedbackRatingToResult(rating: FSRSRating): ProgressResult {
  return rating >= 3 ? 'correct' : 'wrong';
}
```

---

## 7. 標準エラー型 (Standard Error Types)

全 API エンドポイント共通のエラーレスポンス形式。

```ts
interface ApiError {
  error: string;      // 人間が読めるエラーメッセージ
  code: string;       // 機械判定用のエラーコード（例: 'UNAUTHORIZED', 'VALIDATION_ERROR'）
  status: number;     // HTTP ステータスコード
}

// --- 想定されるエラーコード一覧 ---
type ApiErrorCode =
  | 'UNAUTHORIZED'             // 401 — 認証されていない
  | 'FORBIDDEN'                // 403 — 管理者権限が必要
  | 'NOT_FOUND'                // 404 — リソースが見つからない
  | 'VALIDATION_ERROR'         // 400 — リクエストバリデーション失敗
  | 'AI_SERVICE_ERROR'         // 502 — AI API（Claude / Grok / Whisper）呼び出し失敗
  | 'RATE_LIMIT_EXCEEDED'      // 429 — レート制限超過
  | 'INTERNAL_SERVER_ERROR';   // 500 — サーバー内部エラー

// --- Zod Schema ---
const apiErrorSchema = z.object({
  error: z.string(),
  code: z.string(),
  status: z.number().int(),
});
```

**使用例（Route Handler）:**

```ts
function createApiError(
  status: number,
  code: ApiErrorCode,
  error: string
): NextResponse<ApiError> {
  return NextResponse.json({ error, code, status }, { status });
}

// 使用
return createApiError(401, 'UNAUTHORIZED', 'Authentication required');
return createApiError(400, 'VALIDATION_ERROR', 'Invalid question_id format');
```

---

## 付録: ルート一覧と使用する主要型

| ルート | 主要型 |
|---|---|
| `/` | `Category`, `Topic`, `DashboardData` (ログイン時) |
| `/login` | — |
| `/topics/[topicId]` | `Topic`, `Question`, `Progress`, `Bookmark` |
| `/quiz/[topicId]` | `QuizSessionState`, `QuizAnswer`, `SessionResult`, `ChatRequest/Response` |
| `/explain/[topicId]` | `ExplainSessionState`, `ExplainUserAnswer`, `FeedbackResult`, `ChatRequest/Response` |
| `/dashboard` | `DashboardData`, `TopicAccuracy`, `Progress`, `Bookmark` |
| `/admin` | — |
| `/admin/generate` | `GenerateWizardState`, `AnalysisPlan`, `GeneratedQuestion` |
| `/admin/questions` | `Question`, `UpdateQuestionRequest`, `BulkSaveQuestionsRequest` |
