'use client';

import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';

export const useQuestionCounts = () => {
  return useQuery({
    queryKey: ['question-counts'],
    queryFn: async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('questions')
        .select('topic_id, type')
        .is('deleted_at', null);
      if (error) throw error;

      const counts: Record<string, number> = {};
      for (const row of data) {
        if (row.type === 'multiple' || row.type === 'code' || row.type === 'truefalse') {
          counts[row.topic_id] = (counts[row.topic_id] || 0) + 1;
        }
      }
      return counts;
    },
  });
};
