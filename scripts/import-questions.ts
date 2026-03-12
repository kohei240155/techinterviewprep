import { createClient } from '@supabase/supabase-js';
import { readFileSync, writeFileSync } from 'fs';
import { z } from 'zod';

// --- Validation schemas (aligned with lib/prompts/schemas.ts) ---

const ChoiceOptionSchema = z.object({
  label: z.enum(['A', 'B', 'C', 'D']),
  text_ja: z.string().min(1),
  text_en: z.string().min(1),
});

const RubricSchema = z.object({
  rubric_ja: z.record(z.enum(['1', '2', '3', '4']), z.string()),
  rubric_en: z.record(z.enum(['1', '2', '3', '4']), z.string()),
});

const ChoiceQuestionBaseFields = {
  difficulty: z.enum(['easy', 'medium', 'hard']),
  question_ja: z.string().min(1),
  question_en: z.string().min(1),
  options: z.array(ChoiceOptionSchema).length(4),
  answer: z.object({ correct_index: z.number().int().min(0).max(3) }),
  explanation_ja: z.string().min(1),
  explanation_en: z.string().min(1),
};

const MultipleQuestionSchema = z.object({
  type: z.literal('multiple'),
  difficulty: z.enum(['easy', 'medium', 'hard']),
  question_ja: z.string().min(1),
  question_en: z.string().min(1),
  options: z.array(ChoiceOptionSchema).length(4),
  answer: z.object({ correct_index: z.number().int().min(0).max(3) }),
  explanation_ja: z.string().min(1),
  explanation_en: z.string().min(1),
});

const TrueFalseQuestionSchema = z.object({
  type: z.literal('truefalse'),
  difficulty: z.enum(['easy', 'medium', 'hard']),
  question_ja: z.string().min(1),
  question_en: z.string().min(1),
  options: z.null(),
  answer: z.object({ correct_value: z.boolean() }),
  explanation_ja: z.string().min(1),
  explanation_en: z.string().min(1),
});

const ExplainQuestionSchema = z.object({
  type: z.literal('explain'),
  difficulty: z.enum(['easy', 'medium', 'hard']),
  question_ja: z.string().min(1),
  question_en: z.string().min(1),
  options: RubricSchema,
  answer: z.object({
    model_answer_ja: z.string().min(1),
    model_answer_en: z.string().min(1),
  }),
  explanation_ja: z.string(),
  explanation_en: z.string(),
});

const CodeQuestionSchema = z.object({
  type: z.literal('code'),
  ...ChoiceQuestionBaseFields,
});

const GeneratedQuestionSchema = z.discriminatedUnion('type', [
  MultipleQuestionSchema,
  CodeQuestionSchema,
  TrueFalseQuestionSchema,
  ExplainQuestionSchema,
]);

const ImportFileSchema = z.object({
  topic_id: z.string().uuid(),
  topic_name: z.string().min(1),
  created_at: z.string().optional(),
  imported_dev: z.boolean().optional().default(false),
  imported_prod: z.boolean().optional().default(false),
  questions: z.array(GeneratedQuestionSchema).min(1),
});

// --- Main ---

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const isProd = args.includes('--prod');
const filePath = args.find((a) => !a.startsWith('--'));

if (!filePath) {
  console.error('Usage: tsx scripts/import-questions.ts [--dry-run] <file.json>');
  process.exit(1);
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!dryRun && (!supabaseUrl || !supabaseServiceKey)) {
  console.error('Error: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set.');
  process.exit(1);
}

const main = async () => {
  // 1. Read JSON file
  let raw: string;
  try {
    raw = readFileSync(filePath, 'utf-8');
  } catch {
    console.error(`Error: Cannot read file "${filePath}"`);
    process.exit(1);
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    console.error('Error: Invalid JSON');
    process.exit(1);
  }

  // 2. Validate
  const result = ImportFileSchema.safeParse(parsed);
  if (!result.success) {
    console.error('Validation errors:');
    for (const issue of result.error.issues) {
      console.error(`  [${issue.path.join('.')}] ${issue.message}`);
    }
    process.exit(1);
  }

  const data = result.data;
  console.log(`File: ${filePath}`);
  console.log(`Topic: ${data.topic_name} (${data.topic_id})`);
  console.log(`Questions: ${data.questions.length}`);

  // Summary by type and difficulty
  const typeCounts: Record<string, number> = {};
  const diffCounts: Record<string, number> = {};
  for (const q of data.questions) {
    typeCounts[q.type] = (typeCounts[q.type] || 0) + 1;
    diffCounts[q.difficulty] = (diffCounts[q.difficulty] || 0) + 1;
  }
  console.log(`  Types: ${Object.entries(typeCounts).map(([k, v]) => `${k}=${v}`).join(', ')}`);
  console.log(`  Difficulty: ${Object.entries(diffCounts).map(([k, v]) => `${k}=${v}`).join(', ')}`);
  console.log('Validation: PASSED');

  if (dryRun) {
    console.log('\n--dry-run: Skipping DB insert.');
    return;
  }

  // 3. Insert into DB
  const supabase = createClient(supabaseUrl!, supabaseServiceKey!);

  const rows = data.questions.map((q) => ({
    topic_id: data.topic_id,
    type: q.type,
    difficulty: q.difficulty,
    question_ja: q.question_ja,
    question_en: q.question_en,
    options: q.options,
    answer: q.answer,
    explanation_ja: q.explanation_ja,
    explanation_en: q.explanation_en,
  }));

  const { data: inserted, error } = await supabase
    .from('questions')
    .insert(rows)
    .select('id');

  if (error) {
    console.error(`\nDB insert failed: ${error.message}`);
    process.exit(1);
  }

  console.log(`\nInserted ${inserted.length} questions successfully.`);
  for (const row of inserted) {
    console.log(`  - ${row.id}`);
  }

  // Update imported flag in the JSON file
  const flagKey = isProd ? 'imported_prod' : 'imported_dev';
  const original = JSON.parse(readFileSync(filePath, 'utf-8'));
  original[flagKey] = true;
  writeFileSync(filePath, JSON.stringify(original, null, 2) + '\n', 'utf-8');
  console.log(`\nUpdated ${filePath}: ${flagKey} = true`);
};

main();
