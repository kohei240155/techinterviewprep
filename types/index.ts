// =============================================================
// TechInterviewPrep — TypeScript 型定義
// =============================================================

import { z } from 'zod';

// -------------------------------------------------------------
// 1. リテラル型・列挙型
// -------------------------------------------------------------

export type Language = 'ja' | 'en';
export type QuestionType = 'multiple' | 'code' | 'truefalse' | 'explain';
export type Difficulty = 'easy' | 'medium' | 'hard';
export type QuizMode = 'new' | 'review';
export type QuestionCount = 5 | 10 | 15 | 20 | 'all';
export type ProgressResult = 'correct' | 'wrong' | 'skipped';
export type FSRSRating = 1 | 2 | 3 | 4;
export type FSRSState = 0 | 1 | 2 | 3;

// -------------------------------------------------------------
// 2. DB テーブル型
// -------------------------------------------------------------

export interface User {
  id: string;
  display_name: string;
  avatar_url: string;
  created_at: string;
  updated_at: string | null;
  deleted_at: string | null;
}

export interface Category {
  id: string;
  name_ja: string;
  name_en: string;
  sort_order: number;
  created_at: string;
  updated_at: string | null;
  deleted_at: string | null;
}

export interface Topic {
  id: string;
  category_id: string;
  name_ja: string;
  name_en: string;
  sort_order: number;
  created_at: string;
  updated_at: string | null;
  deleted_at: string | null;
}

export interface Question {
  id: string;
  topic_id: string;
  type: QuestionType;
  difficulty: Difficulty;
  question_ja: string;
  question_en: string;
  options: QuestionOptions;
  answer: QuestionAnswer;
  explanation_ja: string;
  explanation_en: string;
  created_at: string;
  updated_at: string | null;
  deleted_at: string | null;
}

export interface Progress {
  id: string;
  user_id: string;
  question_id: string;
  result: ProgressResult;
  answered_at: string;
  stability: number | null;
  difficulty_fsrs: number | null;
  due_date: string | null;
  rating: number | null;
  reps: number;
  lapses: number;
  state: FSRSState;
  last_review: string | null;
  updated_at: string | null;
  deleted_at: string | null;
}

export interface Bookmark {
  id: string;
  user_id: string;
  question_id: string;
  created_at: string;
}

// -------------------------------------------------------------
// 3. JSONB 判別共用体型
// -------------------------------------------------------------

// --- QuestionOptions ---

export interface OptionChoice {
  label: string;
  text_ja: string;
  text_en: string;
}

export interface ExplainRubric {
  rubric_ja: Record<'1' | '2' | '3' | '4', string>;
  rubric_en: Record<'1' | '2' | '3' | '4', string>;
}

export type QuestionOptions = OptionChoice[] | ExplainRubric | null;

// --- QuestionAnswer ---

export interface MultipleAnswer {
  correct_index: number;
}

export interface TrueFalseAnswer {
  correct_value: boolean;
}

export interface ExplainAnswer {
  model_answer_ja: string;
  model_answer_en: string;
}

export type QuestionAnswer = MultipleAnswer | TrueFalseAnswer | ExplainAnswer;

// --- 型ガード ---

export function isOptionChoices(
  options: QuestionOptions,
  type: QuestionType
): options is OptionChoice[] {
  return type === 'multiple' || type === 'code';
}

export function isExplainRubric(
  options: QuestionOptions,
  type: QuestionType
): options is ExplainRubric {
  return type === 'explain';
}

export function isMultipleAnswer(
  answer: QuestionAnswer,
  type: QuestionType
): answer is MultipleAnswer {
  return type === 'multiple' || type === 'code';
}

export function isTrueFalseAnswer(
  answer: QuestionAnswer,
  type: QuestionType
): answer is TrueFalseAnswer {
  return type === 'truefalse';
}

export function isExplainAnswer(
  answer: QuestionAnswer,
  type: QuestionType
): answer is ExplainAnswer {
  return type === 'explain';
}

// --- 型付き Question ヘルパー ---

export interface MultipleQuestion extends Omit<Question, 'type' | 'options' | 'answer'> {
  type: 'multiple' | 'code';
  options: OptionChoice[];
  answer: MultipleAnswer;
}

export interface TrueFalseQuestion extends Omit<Question, 'type' | 'options' | 'answer'> {
  type: 'truefalse';
  options: null;
  answer: TrueFalseAnswer;
}

export interface ExplainQuestion extends Omit<Question, 'type' | 'options' | 'answer'> {
  type: 'explain';
  options: ExplainRubric;
  answer: ExplainAnswer;
}

export type TypedQuestion = MultipleQuestion | TrueFalseQuestion | ExplainQuestion;

// -------------------------------------------------------------
// 4. API 型
// -------------------------------------------------------------

// --- POST /api/ai/analyze ---

export interface AnalyzeRequest {
  topic_id: string;
  content?: string;
  existing_questions_summary?: string;
}

export interface AnalyzeResponse {
  plan: AnalysisPlan;
}

// --- POST /api/ai/generate ---

export interface GenerateRequest {
  topic_id: string;
  plan: AnalysisPlan;
  content?: string;
  existing_questions: string;
}

export interface GenerateResponse {
  questions: GeneratedQuestion[];
}

// --- POST /api/ai/feedback ---

export interface FeedbackRequest {
  question_id: string;
  user_answer: string;
  language: Language;
}

export interface AIFeedbackResponse {
  rating: 1 | 2 | 3 | 4;
  feedback: string;
}

// --- POST /api/ai/chat ---

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ChatRequest {
  topic_id: string;
  message: string;
  language: Language;
  history: ChatMessage[];
}

export interface ChatResponse {
  reply: string;
}

// --- POST /api/ai/transcribe ---

export interface TranscribeResponse {
  text: string;
}

// --- POST /api/admin/questions ---

export interface BulkSaveQuestionsRequest {
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

export interface BulkSaveQuestionsResponse {
  inserted_count: number;
  question_ids: string[];
}

// --- PUT /api/admin/questions/[id] ---

export interface UpdateQuestionRequest {
  type?: QuestionType;
  difficulty?: Difficulty;
  question_ja?: string;
  question_en?: string;
  options?: QuestionOptions;
  answer?: QuestionAnswer;
  explanation_ja?: string;
  explanation_en?: string;
}

export interface UpdateQuestionResponse {
  question: Question;
}

// -------------------------------------------------------------
// 5. AI スキーマ型
// -------------------------------------------------------------

export interface AnalysisPlanQuestion {
  type: QuestionType;
  difficulty: Difficulty;
  count: number;
  rationale: string;
}

export interface AnalysisPlan {
  topic_summary: string;
  interview_relevance: 'high' | 'medium' | 'low';
  interview_relevance_reason: string;
  questions: AnalysisPlanQuestion[];
  total_count: number;
  notes: string;
}

export interface GeneratedQuestion {
  type: QuestionType;
  difficulty: Difficulty;
  question_ja: string;
  question_en: string;
  options: QuestionOptions;
  answer: QuestionAnswer;
  explanation_ja: string;
  explanation_en: string;
}

export interface GeneratedQuestions {
  questions: GeneratedQuestion[];
}

export interface FeedbackResult {
  rating: 1 | 2 | 3 | 4;
  feedback: string;
}

// -------------------------------------------------------------
// 6. フロントエンド状態型
// -------------------------------------------------------------

export interface QuizAnswer {
  question_id: string;
  selected_index: number | null;
  result: ProgressResult;
  time_spent_ms: number;
}

export interface QuizSessionState {
  topic_id: string;
  mode: QuizMode;
  questions: Question[];
  current_index: number;
  answers: QuizAnswer[];
  status: 'idle' | 'in_progress' | 'reviewing' | 'completed';
  started_at: Date;
  total_time_ms: number;
  result: SessionResult | null;
}

export interface ExplainUserAnswer {
  question_id: string;
  user_answer: string;
  feedback: FeedbackResult | null;
  result: ProgressResult;
  time_spent_ms: number;
}

export interface ExplainSessionState {
  topic_id: string;
  questions: ExplainQuestion[];
  current_index: number;
  answers: ExplainUserAnswer[];
  status: 'idle' | 'in_progress' | 'awaiting_feedback' | 'reviewing' | 'completed';
  started_at: Date;
  total_time_ms: number;
  result: SessionResult | null;
}

export interface PerQuestionResult {
  question_id: string;
  question_ja: string;
  question_en: string;
  type: QuestionType;
  difficulty: Difficulty;
  result: ProgressResult;
  time_spent_ms: number;
  selected_index?: number | null;
  correct_index?: number;
  user_answer?: string;
  feedback?: FeedbackResult | null;
}

export interface SessionResult {
  topic_id: string;
  total_questions: number;
  correct_count: number;
  wrong_count: number;
  skipped_count: number;
  accuracy_percent: number;
  total_time_ms: number;
  per_question: PerQuestionResult[];
}

// --- Admin 問題生成ウィザード ---

export type GenerateWizardStep = 'input' | 'plan_review' | 'generating' | 'preview' | 'saving' | 'done';

export interface GenerateWizardState {
  step: GenerateWizardStep;
  input_mode: 'text' | 'topic';
  topic_id: string;
  content: string;
  plan: AnalysisPlan | null;
  edited_plan: AnalysisPlan | null;
  generated_questions: GeneratedQuestion[];
  selected_question_indices: number[];
  is_loading: boolean;
  error: string | null;
}

// --- ダッシュボード ---

export interface TopicAccuracy {
  topic_id: string;
  topic_name_ja: string;
  topic_name_en: string;
  total: number;
  correct: number;
  accuracy_percent: number;
}

export interface DashboardData {
  due_review_count: number;
  streak_days: number;
  topic_accuracies: TopicAccuracy[];
  bookmarked_questions: Question[];
  weak_topics: Topic[];
}

// -------------------------------------------------------------
// 7. FSRS 型
// -------------------------------------------------------------

export interface FSRSCard {
  due: Date;
  stability: number;
  difficulty: number;
  elapsed_days: number;
  scheduled_days: number;
  reps: number;
  lapses: number;
  state: FSRSState;
  last_review: Date;
}

export interface FSRSUpdateData {
  stability: number;
  difficulty_fsrs: number;
  due_date: string;
  reps: number;
  lapses: number;
  state: FSRSState;
  last_review: string;
}

export type ProgressToFSRSCard = (progress: Progress) => FSRSCard;
export type FSRSCardToUpdateData = (card: FSRSCard) => FSRSUpdateData;

export function quizResultToRating(result: ProgressResult): FSRSRating {
  return result === 'correct' ? 3 : 1;
}

export function feedbackRatingToResult(rating: FSRSRating): ProgressResult {
  return rating >= 3 ? 'correct' : 'wrong';
}

// -------------------------------------------------------------
// 8. エラー型
// -------------------------------------------------------------

export interface ApiError {
  error: string;
  code: string;
  status: number;
}

export type ApiErrorCode =
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'VALIDATION_ERROR'
  | 'AI_SERVICE_ERROR'
  | 'RATE_LIMIT_EXCEEDED'
  | 'INTERNAL_SERVER_ERROR';

// -------------------------------------------------------------
// 9. Zod スキーマ
// -------------------------------------------------------------

export const optionChoiceSchema = z.object({
  label: z.string(),
  text_ja: z.string(),
  text_en: z.string(),
});

export const explainRubricSchema = z.object({
  rubric_ja: z.record(z.enum(['1', '2', '3', '4']), z.string()),
  rubric_en: z.record(z.enum(['1', '2', '3', '4']), z.string()),
});

export const multipleAnswerSchema = z.object({
  correct_index: z.number().int().min(0).max(3),
});

export const trueFalseAnswerSchema = z.object({
  correct_value: z.boolean(),
});

export const explainAnswerSchema = z.object({
  model_answer_ja: z.string(),
  model_answer_en: z.string(),
});

export const analyzeRequestSchema = z.object({
  topic_id: z.string().uuid(),
  content: z.string().optional(),
  existing_questions_summary: z.string().optional(),
});

export const generateRequestSchema = z.object({
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

export const feedbackRequestSchema = z.object({
  question_id: z.string().uuid(),
  user_answer: z.string().min(1),
  language: z.enum(['ja', 'en']),
});

export const chatMessageSchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string(),
});

export const chatRequestSchema = z.object({
  topic_id: z.string().uuid(),
  message: z.string().min(1),
  language: z.enum(['ja', 'en']),
  history: z.array(chatMessageSchema),
});

export const bulkSaveQuestionsRequestSchema = z.object({
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

export const updateQuestionRequestSchema = z.object({
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

// --- AI Output Schemas ---

export const analysisPlanQuestionSchema = z.object({
  type: z.enum(['multiple', 'code', 'truefalse', 'explain']),
  difficulty: z.enum(['easy', 'medium', 'hard']),
  count: z.number().int().min(1),
  rationale: z.string(),
});

export const analysisPlanSchema = z.object({
  topic_summary: z.string(),
  interview_relevance: z.enum(['high', 'medium', 'low']),
  interview_relevance_reason: z.string(),
  questions: z.array(analysisPlanQuestionSchema).min(1),
  total_count: z.number().int().min(5).max(15),
  notes: z.string(),
});

export const generatedQuestionSchema = z.object({
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

export const generatedQuestionsSchema = z.object({
  questions: z.array(generatedQuestionSchema).min(1),
});

export const feedbackResultSchema = z.object({
  rating: z.number().int().min(1).max(4) as z.ZodType<1 | 2 | 3 | 4>,
  feedback: z.string().min(1),
});

export const apiErrorSchema = z.object({
  error: z.string(),
  code: z.string(),
  status: z.number().int(),
});
