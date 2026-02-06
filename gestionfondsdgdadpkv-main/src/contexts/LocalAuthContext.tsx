import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";

type LocalUserRole = 'admin' | 'instructeur' | 'observateur';

interface LocalUser {
  id: string;
  username: string;
  full_name: string | null;
  role: LocalUserRole;
}

interface LocalAuthContextValue {
  user: LocalUser | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  isAdmin: boolean;
  isInstructeur: boolean;
  isObservateur: boolean;
  canEdit: boolean;
}

const LocalAuthContext = createContext<LocalAuthContextValue | undefined>(undefined);

export function LocalAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<LocalUser | null>(null);
  const [loading, setLoading] = useState(true);

  const toAuthEmail = useCallback((username: string) => {
    const trimmed = username.trim().toLowerCase();
    return trimmed.includes('@') ? trimmed : `${trimmed}@local.test`;
  }, []);

  const loadUserWithRole = useCallback(async (authUser: User | null) => {
    if (!authUser) {
      setUser(null);
      return;
    }

    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', authUser.id)
      .maybeSingle();

    const { data: profileData } = await supabase
      .from('profiles')
      .select('full_name, username')
      .eq('user_id', authUser.id)
      .maybeSingle();

    const role = (roleData?.role as LocalUserRole) || 'observateur';

    setUser({
      id: authUser.id,
      username: profileData?.username || authUser.email || authUser.id,
      full_name: profileData?.full_name || (authUser.user_metadata?.full_name ?? null),
      role,
    });
  }, []);

  const validateSession = useCallback(async () => {
    try {
      const { data } = await supabase.auth.getSession();
      await loadUserWithRole(data.session?.user ?? null);
    } catch (err) {
      console.error('Session validation error:', err);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, [loadUserWithRole]);

  useEffect(() => {
    validateSession();
    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      void loadUserWithRole(session?.user ?? null);
    });

    return () => {
      subscription.subscription.unsubscribe();
    };
  }, [validateSession, loadUserWithRole]);

  const login = async (username: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: toAuthEmail(username),
        password,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      await loadUserWithRole(data.user ?? null);
      return { success: true };
    } catch (err) {
      console.error('Login error:', err);
      return { success: false, error: 'Erreur de connexion' };
    }
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error('Logout error:', err);
    }

    setUser(null);
  };

  const value = useMemo<LocalAuthContextValue>(() => {
    const isAdmin = user?.role === 'admin';
    const isInstructeur = user?.role === 'instructeur';
    const isObservateur = user?.role === 'observateur';
    
    return {
      user,
      loading,
      login,
      logout,
      isAdmin,
      isInstructeur,
      isObservateur,
      canEdit: isAdmin || isInstructeur,
    };
  }, [user, loading]);

  return <LocalAuthContext.Provider value={value}>{children}</LocalAuthContext.Provider>;
}

export function useLocalAuth() {
  const ctx = useContext(LocalAuthContext);
  if (!ctx) {
    throw new Error("useLocalAuth must be used within a LocalAuthProvider");
  }
  return ctx;
}
