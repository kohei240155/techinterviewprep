'use client';

import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';

export const useMultiTopicQuestions = (topicIds: string[]) => {
  return useQuery({
    queryKey: ['questions', 'multi', ...topicIds.slice().sort()],
    queryFn: async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('questions')
        .select('*')
        .in('topic_id', topicIds)
        .is('deleted_at', null);
      if (error) throw error;
      return data;
    },
    enabled: topicIds.length > 0,
  });
};
