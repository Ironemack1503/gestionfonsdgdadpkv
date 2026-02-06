import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { AuditLog } from '@/types/database';

export function useAuditLogs(tableName?: string) {
  const { data: auditLogs = [], isLoading, error } = useQuery({
    queryKey: ['audit-logs', tableName],
    queryFn: async () => {
      let query = supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(500);

      if (tableName) {
        query = query.eq('table_name', tableName);
      }

      const { data, error } = await query;

      if (error) throw error;
      return (data || []) as unknown as AuditLog[];
    },
  });

  return { auditLogs, isLoading, error };
}

export function useCreateAuditLog() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (log: {
      table_name: string;
      record_id: string;
      action: string;
      old_data?: Record<string, unknown> | null;
      new_data?: Record<string, unknown> | null;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from('audit_logs')
        .insert([{
          table_name: log.table_name,
          record_id: log.record_id,
          action: log.action,
          old_data: log.old_data ? JSON.parse(JSON.stringify(log.old_data)) : null,
          new_data: log.new_data ? JSON.parse(JSON.stringify(log.new_data)) : null,
          user_id: user?.id || null,
        }]);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['audit-logs'] });
    },
    onError: (error: Error) => {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    },
  });
}

// Helper function to get changed fields between two objects
export function getChangedFields(
  oldData: Record<string, unknown>,
  newData: Record<string, unknown>
): string[] {
  const changedFields: string[] = [];
  const allKeys = new Set([...Object.keys(oldData), ...Object.keys(newData)]);
  
  for (const key of allKeys) {
    if (JSON.stringify(oldData[key]) !== JSON.stringify(newData[key])) {
      changedFields.push(key);
    }
  }
  
  return changedFields;
}

// Table name translations
export const tableNameLabels: Record<string, string> = {
  recettes: 'Recettes',
  depenses: 'Dépenses',
  rubriques: 'Rubriques',
  services: 'Services',
  feuilles_caisse: 'Feuilles de caisse',
  profiles: 'Profils',
  user_roles: 'Rôles utilisateurs',
};

// Action translations
export const actionLabels: Record<string, string> = {
  INSERT: 'Création',
  UPDATE: 'Modification',
  DELETE: 'Suppression',
  ERROR_REPORT: 'Rapport d\'erreur',
};
