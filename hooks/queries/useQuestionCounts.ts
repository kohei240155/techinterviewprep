'use client';

import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';

export interface QuestionCountsResult {
  quiz: Record<string, number>;
  explain: Record<string, number>;
}

export const useQuestionCounts = () => {
  return useQuery({
    queryKey: ['question-counts'],
    queryFn: async (): Promise<QuestionCountsResult> => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('questions')
        .select('topic_id, type')
        .is('deleted_at', null);
      if (error) throw error;

      const quiz: Record<string, number> = {};
      const explain: Record<string, number> = {};
      for (const row of data) {
        if (row.type === 'multiple' || row.type === 'code' || row.type === 'truefalse') {
          quiz[row.topic_id] = (quiz[row.topic_id] || 0) + 1;
        } else if (row.type === 'explain') {
          explain[row.topic_id] = (explain[row.topic_id] || 0) + 1;
        }
      }
      return { quiz, explain };
    },
  });
};
