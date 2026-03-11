'use client';

import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';

export const useCategories = () => {
  return useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('categories')
        .select('*, topics(*)')
        .is('deleted_at', null)
        .order('sort_order');
      if (error) throw error;
      return data;
    },
  });
};
