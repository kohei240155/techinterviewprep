'use client';

import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';

export const useDashboardStats = (userId: string | undefined) => {
  return useQuery({
    queryKey: ['dashboard', userId],
    queryFn: async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('progress')
        .select('result, questions(topic_id)')
        .eq('user_id', userId!);
      if (error) throw error;
      return data;
    },
    enabled: !!userId,
  });
};
