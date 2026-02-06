// Hook désactivé - la gestion des utilisateurs Supabase Auth sera implémentée ultérieurement

import type { AppRole } from '@/types/database';

interface UserWithRole {
  id: string;
  user_id: string;
  email: string | null;
  full_name: string | null;
  role: AppRole;
  created_at: string;
}

export function useUserManagement() {
  return {
    users: [] as UserWithRole[],
    loading: false,
    actionLoading: false,
    updateUserRole: async () => {},
    createUser: async () => false,
    deleteUser: async () => false,
    refetch: async () => {},
  };
}
