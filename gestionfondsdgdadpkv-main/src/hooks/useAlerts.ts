// Hook désactivé - les alertes seront implémentées ultérieurement
// Ce fichier est conservé pour compatibilité

export interface Alert {
  id: string;
  alert_type: string;
  title: string;
  message: string;
  severity: 'info' | 'warning' | 'critical';
  is_read: boolean;
  is_dismissed: boolean;
  related_record_id?: string;
  related_table?: string;
  metadata?: Record<string, unknown>;
  created_at: string;
}

export interface AlertSetting {
  id: string;
  setting_key: string;
  setting_value: number;
  description: string;
  is_active: boolean;
  updated_by?: string;
  created_at: string;
  updated_at: string;
}

export const alertTypeLabels: Record<string, string> = {
  solde_bas: 'Solde bas',
  depassement_budget: 'Dépassement budget',
  depense_importante: 'Dépense importante',
};

export const severityLabels: Record<string, string> = {
  info: 'Information',
  warning: 'Avertissement',
  critical: 'Critique',
};

// Stub hooks that return empty/disabled state
export const useAlerts = () => {
  return {
    alerts: [] as Alert[],
    activeAlerts: [] as Alert[],
    unreadCount: 0,
    isLoading: false,
    error: null,
    markAsRead: { mutate: () => {}, mutateAsync: async () => {} },
    markAllAsRead: { mutate: () => {}, mutateAsync: async () => {} },
    dismissAlert: { mutate: () => {}, mutateAsync: async () => {} },
    createAlert: { mutate: () => {}, mutateAsync: async () => {} },
  };
};

export const useAlertSettings = () => {
  return {
    settings: [] as AlertSetting[],
    isLoading: false,
    error: null,
    getSetting: () => null,
    updateSetting: { 
      mutate: (_params?: { id: string; value?: number; isActive?: boolean }) => {}, 
      mutateAsync: async (_params?: { id: string; value?: number; isActive?: boolean }) => {},
      isPending: false,
    },
  };
};

export const useAlertChecker = () => {
  return {
    checkSoldeBas: async () => {},
    checkDepenseImportante: async () => {},
    checkDepassementBudget: async () => {},
  };
};
