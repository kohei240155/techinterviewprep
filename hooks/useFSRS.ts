'use client';

import { scheduleFSRS, progressToCard } from '@/lib/fsrs';
import type { Progress, FSRSUpdateData } from '@/types';

export const useFSRS = () => {
  const schedule = (progress: Progress | null, rating: number): FSRSUpdateData => {
    const card = progress ? progressToCard(progress) : null;
    return scheduleFSRS(card, rating);
  };

  return { schedule };
};
