import { useLocalAuth } from '@/contexts/LocalAuthContext';

export function useLocalUserRole() {
  const { user, loading, isAdmin, isInstructeur, isObservateur, canEdit } = useLocalAuth();

  return {
    role: user?.role || null,
    loading,
    isAdmin,
    isInstructeur,
    isObservateur,
    canEdit,
  };
}
