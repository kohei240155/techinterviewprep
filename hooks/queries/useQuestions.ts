'use client';

import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';

export const useQuestions = (topicId: string) => {
  return useQuery({
    queryKey: ['questions', topicId],
    queryFn: async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('questions')
        .select('*')
        .eq('topic_id', topicId)
        .is('deleted_at', null);
      if (error) throw error;
      return data;
    },
    enabled: !!topicId,
  });
};
