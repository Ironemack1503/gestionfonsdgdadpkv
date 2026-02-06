import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

/**
 * Centralized real-time subscriptions manager
 * Prevents duplicate subscriptions across multiple hooks
 */
export function useRealtimeSubscriptions() {
  const queryClient = useQueryClient();
  const subscribedRef = useRef(false);

  useEffect(() => {
    // Prevent duplicate subscriptions
    if (subscribedRef.current) return;
    subscribedRef.current = true;

    const channel = supabase
      .channel('app-realtime-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'recettes' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['recettes'] });
          queryClient.invalidateQueries({ queryKey: ['recettes-count'] });
          queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'depenses' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['depenses'] });
          queryClient.invalidateQueries({ queryKey: ['depenses-count'] });
          queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'programmations' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['programmations'] });
          queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'alerts' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['alerts'] });
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'rubriques' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['rubriques'] });
        }
      )
      .subscribe();

    return () => {
      subscribedRef.current = false;
      supabase.removeChannel(channel);
    };
  }, [queryClient]);
}
