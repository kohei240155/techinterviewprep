import { fsrs, createEmptyCard, type Card, type CardInput, type Grade } from 'ts-fsrs';
import type { Progress, FSRSUpdateData } from '@/types';

const f = fsrs();

export function scheduleFSRS(
  card: Card | CardInput | null,
  rating: number
): FSRSUpdateData {
  const now = new Date();
  const currentCard: Card | CardInput = card ?? createEmptyCard(now);
  const scheduling = f.repeat(currentCard, now);
  const result = scheduling[rating as Grade];

  return {
    stability: result.card.stability,
    difficulty_fsrs: result.card.difficulty,
    due_date: result.card.due.toISOString(),
    reps: result.card.reps,
    lapses: result.card.lapses,
    state: result.card.state as 0 | 1 | 2 | 3,
    last_review: result.card.last_review!.toISOString(),
  };
}

export function progressToCard(progress: Progress): Card | null {
  if (progress.stability === null || progress.difficulty_fsrs === null) {
    return null;
  }

  return {
    due: progress.due_date ? new Date(progress.due_date) : new Date(),
    stability: progress.stability,
    difficulty: progress.difficulty_fsrs,
    elapsed_days: 0,
    scheduled_days: 0,
    reps: progress.reps,
    lapses: progress.lapses,
    state: progress.state,
    last_review: progress.last_review ? new Date(progress.last_review) : undefined,
  } as Card;
}
