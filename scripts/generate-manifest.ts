import { readFileSync, writeFileSync, mkdirSync, readdirSync } from 'fs';
import { join, basename } from 'path';

const QUESTIONS_DIR = join(__dirname, '..', 'questions');
const JSON_DIR = join(QUESTIONS_DIR, 'json');
const MANIFESTS_DIR = join(QUESTIONS_DIR, 'manifests');

interface Question {
  type: string;
  difficulty: string;
  question_en: string;
}

interface QuestionFile {
  topic_id: string;
  topic_name: string;
  questions: Question[];
}

function extractCodeHint(questionText: string): string {
  // Extract the first meaningful line of code from a code block
  const codeMatch = questionText.match(/```\w*\n([\s\S]*?)```/);
  if (!codeMatch) return '';

  const lines = codeMatch[1]
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith('//') && !l.startsWith('console.log'));

  // Return first meaningful line as a hint
  return lines[0] ? ` — ${lines[0]}` : '';
}

function summarizeQuestion(q: Question): string {
  let text = q.question_en;

  // For code questions, extract text before the code block + a code hint
  const codeFenceIndex = text.indexOf('```');
  let codeHint = '';
  if (codeFenceIndex > 0) {
    codeHint = extractCodeHint(text);
    text = text.substring(0, codeFenceIndex).trim();
  }

  // Remove newlines
  text = text.replace(/\n/g, ' ');

  // Truncate to ~80 chars (before adding code hint)
  if (text.length > 80) {
    text = text.substring(0, 77) + '...';
  }

  // Add code hint for code questions to distinguish them
  if (codeHint) {
    text += codeHint;
    // Truncate total to ~120 chars
    if (text.length > 120) {
      text = text.substring(0, 117) + '...';
    }
  }

  return `- [${q.type}/${q.difficulty}] ${text}`;
}

function extractTopicSlug(filename: string): string {
  // e.g. 20260311_closures-scope-this_001.json → closures-scope-this
  const match = filename.match(/^\d{8}_(.+?)_\d{3}\.json$/);
  return match ? match[1] : filename.replace('.json', '');
}

function main() {
  const args = process.argv.slice(2);
  const targetSlug = args[0]; // optional: specific topic slug

  // Ensure manifests directory exists
  mkdirSync(MANIFESTS_DIR, { recursive: true });

  // Find all JSON question files
  const allFiles = readdirSync(JSON_DIR).filter(
    (f) => f.endsWith('.json')
  );

  // Group files by topic slug
  const byTopic = new Map<string, string[]>();
  for (const file of allFiles) {
    const slug = extractTopicSlug(file);
    if (targetSlug && slug !== targetSlug) continue;
    if (!byTopic.has(slug)) byTopic.set(slug, []);
    byTopic.get(slug)!.push(file);
  }

  if (byTopic.size === 0) {
    console.log(targetSlug ? `No files found for topic: ${targetSlug}` : 'No question files found.');
    return;
  }

  for (const [slug, files] of byTopic) {
    files.sort(); // Sort by filename (date + seq order)

    let topicName = '';
    let totalQuestions = 0;
    const sections: string[] = [];

    for (const file of files) {
      const filePath = join(JSON_DIR, file);
      const data: QuestionFile = JSON.parse(readFileSync(filePath, 'utf-8'));

      if (!topicName) topicName = data.topic_name;
      totalQuestions += data.questions.length;

      const lines = data.questions.map(summarizeQuestion);
      sections.push(
        `## ${file} (${data.questions.length} questions)\n${lines.join('\n')}`
      );
    }

    const manifest = `# ${topicName} — Question Manifest

Total: ${totalQuestions} questions

${sections.join('\n\n')}
`;

    const manifestPath = join(MANIFESTS_DIR, `${slug}.md`);
    writeFileSync(manifestPath, manifest, 'utf-8');
    console.log(`Generated: ${manifestPath} (${totalQuestions} questions from ${files.length} files)`);
  }
}

main();
