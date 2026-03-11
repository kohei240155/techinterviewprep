import { z } from 'zod';

// --- options スキーマ ---

export const ChoiceOptionSchema = z.object({
  label: z.enum(['A', 'B', 'C', 'D']),
  text_ja: z.string(),
  text_en: z.string(),
});

export const RubricSchema = z.object({
  rubric_ja: z.record(z.enum(['1', '2', '3', '4']), z.string()),
  rubric_en: z.record(z.enum(['1', '2', '3', '4']), z.string()),
});

// --- answer スキーマ ---

export const MultipleAnswerSchema = z.object({
  correct_index: z.number().int().min(0).max(3),
});

export const TrueFalseAnswerSchema = z.object({
  correct_value: z.boolean(),
});

export const ExplainAnswerSchema = z.object({
  model_answer_ja: z.string(),
  model_answer_en: z.string(),
});

// --- Analysis Plan ---

export const QuestionPlanSchema = z.object({
  type: z.enum(['multiple', 'code', 'truefalse', 'explain']),
  difficulty: z.enum(['easy', 'medium', 'hard']),
  count: z.number().int().min(1),
  rationale: z.string(),
});

export const AnalysisPlanSchema = z.object({
  topic_summary: z.string(),
  interview_relevance: z.enum(['high', 'medium', 'low']),
  interview_relevance_reason: z.string(),
  questions: z.array(QuestionPlanSchema).min(1),
  total_count: z.number().int().min(5).max(15),
  notes: z.string(),
});

// --- Generated Questions (discriminated union) ---

const baseFields = {
  difficulty: z.enum(['easy', 'medium', 'hard']),
  question_ja: z.string(),
  question_en: z.string(),
  explanation_ja: z.string(),
  explanation_en: z.string(),
};

export const MultipleQuestionSchema = z.object({
  type: z.literal('multiple'),
  ...baseFields,
  options: z.array(ChoiceOptionSchema).length(4),
  answer: MultipleAnswerSchema,
});

export const CodeQuestionSchema = z.object({
  type: z.literal('code'),
  ...baseFields,
  options: z.array(ChoiceOptionSchema).length(4),
  answer: MultipleAnswerSchema,
});

export const TrueFalseQuestionSchema = z.object({
  type: z.literal('truefalse'),
  ...baseFields,
  options: z.null(),
  answer: TrueFalseAnswerSchema,
});

export const ExplainQuestionSchema = z.object({
  type: z.literal('explain'),
  ...baseFields,
  options: RubricSchema,
  answer: ExplainAnswerSchema,
});

export const GeneratedQuestionSchema = z.discriminatedUnion('type', [
  MultipleQuestionSchema,
  CodeQuestionSchema,
  TrueFalseQuestionSchema,
  ExplainQuestionSchema,
]);

export const GeneratedQuestionsSchema = z.object({
  questions: z.array(GeneratedQuestionSchema).min(5).max(15),
});

// --- Feedback ---

export const FeedbackSchema = z.object({
  rating: z.number().int().min(1).max(4),
  feedback: z.string(),
});
