'use client';

import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';

export const useReviewItems = (userId: string | undefined) => {
  return useQuery({
    queryKey: ['review', userId],
    queryFn: async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('progress')
        .select('*, questions(*)')
        .eq('user_id', userId!)
        .lte('due_date', new Date().toISOString());
      if (error) throw error;
      return data;
    },
    enabled: !!userId,
  });
};
