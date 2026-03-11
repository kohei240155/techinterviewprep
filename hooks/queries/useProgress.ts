'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';

export const useProgress = (userId: string | undefined) => {
  return useQuery({
    queryKey: ['progress', userId],
    queryFn: async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('progress')
        .select('*')
        .eq('user_id', userId!);
      if (error) throw error;
      return data;
    },
    enabled: !!userId,
  });
};

export const useProgressUpsert = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: Record<string, unknown>) => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('progress')
        .upsert(params, { onConflict: 'user_id,question_id' });
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      const userId = variables.user_id as string;
      queryClient.invalidateQueries({ queryKey: ['progress', userId] });
      queryClient.invalidateQueries({ queryKey: ['review', userId] });
      queryClient.invalidateQueries({ queryKey: ['dashboard', userId] });
    },
  });
};
