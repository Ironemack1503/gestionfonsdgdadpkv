// Hook désactivé - l'historique des connexions sera implémenté ultérieurement

export interface LoginHistoryEntry {
  id: string;
  user_id: string;
  user_email: string | null;
  user_name: string | null;
  login_at: string;
  ip_address: string | null;
  user_agent: string | null;
}

export function useLoginHistory() {
  return { 
    loginHistory: [] as LoginHistoryEntry[], 
    isLoading: false, 
    error: null, 
    refetch: async () => {} 
  };
}

export async function logUserLogin(_userId: string, _email: string | null, _fullName: string | null) {
  // Désactivé pour le moment
}
