import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface LoginAttempt {
  id: string;
  username: string | null;
  success: boolean;
  ip_address: string | null;
  user_agent: string | null;
  failure_reason: string | null;
  created_at: string | null;
}

interface UseLoginAttemptsParams {
  username?: string;
  startDate?: Date | null;
  endDate?: Date | null;
  successOnly?: boolean | null;
}

export function useLoginAttempts(params: UseLoginAttemptsParams = {}) {
  const { username, startDate, endDate, successOnly } = params;

  const { data: attempts = [], isLoading, error, refetch } = useQuery({
    queryKey: ['login-attempts', username, startDate?.toISOString(), endDate?.toISOString(), successOnly],
    queryFn: async () => {
      let query = supabase
        .from('login_attempts')
        .select('*')
        .order('created_at', { ascending: false });

      if (username) {
        query = query.eq('username', username);
      }

      if (startDate) {
        query = query.gte('created_at', startDate.toISOString());
      }

      if (endDate) {
        query = query.lte('created_at', endDate.toISOString());
      }

      if (successOnly !== null && successOnly !== undefined) {
        query = query.eq('success', successOnly);
      }

      const { data, error } = await query;
      if (error) throw error;

      return (data || []) as LoginAttempt[];
    },
  });

  return { attempts, isLoading, error, refetch };
}
