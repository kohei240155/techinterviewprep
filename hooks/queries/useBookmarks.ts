'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';

export const useBookmarks = (userId: string | undefined) => {
  return useQuery({
    queryKey: ['bookmarks', userId],
    queryFn: async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('bookmarks')
        .select('*, questions(*)')
        .eq('user_id', userId!);
      if (error) throw error;
      return data;
    },
    enabled: !!userId,
  });
};

export const useBookmarkToggle = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, questionId, isBookmarked }: { userId: string; questionId: string; isBookmarked: boolean }) => {
      const supabase = createClient();
      if (isBookmarked) {
        const { error } = await supabase
          .from('bookmarks')
          .delete()
          .eq('user_id', userId)
          .eq('question_id', questionId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('bookmarks')
          .insert({ user_id: userId, question_id: questionId });
        if (error) throw error;
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['bookmarks', variables.userId] });
    },
  });
};
