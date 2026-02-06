// Hook désactivé - l'audit de gestion utilisateurs sera implémenté ultérieurement

export interface UserManagementAuditLog {
  id: string;
  performed_by: string;
  action_type: string;
  target_user_id: string | null;
  target_user_email: string | null;
  old_value: string | null;
  new_value: string | null;
  created_at: string;
}

export function useUserManagementAudit() {
  return { 
    auditLogs: [] as UserManagementAuditLog[], 
    isLoading: false, 
    error: null, 
    refetch: async () => {} 
  };
}

export const actionTypeLabels: Record<string, string> = {
  CREATE_USER: 'Création utilisateur',
  DELETE_USER: 'Suppression utilisateur',
  UPDATE_ROLE: 'Modification rôle',
};

export const roleLabels: Record<string, string> = {
  admin: 'Administrateur',
  instructeur: 'Instructeur',
  observateur: 'Observateur',
};
