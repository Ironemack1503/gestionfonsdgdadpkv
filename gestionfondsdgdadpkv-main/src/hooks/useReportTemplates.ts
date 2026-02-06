/**
 * Hook for managing report templates in the database
 * Allows saving, loading, updating, and deleting customized report configurations
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useLocalAuth } from '@/contexts/LocalAuthContext';
import { useToast } from '@/hooks/use-toast';
import type { ReportTemplate as EditorTemplate } from '@/components/reports/AdvancedReportEditor/types';
import type { Json } from '@/integrations/supabase/types';

export interface SavedReportTemplate {
  id: string;
  name: string;
  description: string | null;
  config: EditorTemplate;
  created_by: string;
  created_at: string;
  updated_at: string;
  is_public: boolean;
  is_default: boolean;
}

interface UseSavedReportTemplatesReturn {
  templates: SavedReportTemplate[];
  defaultTemplate: SavedReportTemplate | null;
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
  fetchTemplates: () => Promise<void>;
  saveTemplate: (name: string, description: string, config: EditorTemplate, isPublic: boolean) => Promise<SavedReportTemplate | null>;
  updateTemplate: (id: string, name: string, description: string, config: EditorTemplate, isPublic: boolean) => Promise<boolean>;
  deleteTemplate: (id: string) => Promise<boolean>;
  loadTemplate: (id: string) => SavedReportTemplate | undefined;
  getDefaultTemplate: () => SavedReportTemplate | null;
}

// Helper to safely parse config from database
function parseConfig(configJson: Json): EditorTemplate {
  const config = configJson as Record<string, unknown>;
  return {
    ...config,
    createdAt: new Date(config.createdAt as string),
    updatedAt: new Date(config.updatedAt as string),
  } as EditorTemplate;
}

// Helper to serialize config for database
function serializeConfig(config: EditorTemplate): Json {
  return {
    ...config,
    createdAt: config.createdAt instanceof Date ? config.createdAt.toISOString() : config.createdAt,
    updatedAt: new Date().toISOString(),
  } as unknown as Json;
}

export function useSavedReportTemplates(): UseSavedReportTemplatesReturn {
  const { user } = useLocalAuth();
  const { toast } = useToast();
  const [templates, setTemplates] = useState<SavedReportTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch all templates (user's own + public)
  const fetchTemplates = useCallback(async () => {
    if (!user?.id) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const { data, error: fetchError } = await supabase
        .from('report_templates')
        .select('*')
        .or(`created_by.eq.${user.id},is_public.eq.true`)
        .order('updated_at', { ascending: false });
      
      if (fetchError) throw fetchError;
      
      // Parse config from JSONB
      const parsed: SavedReportTemplate[] = (data || []).map(item => ({
        id: item.id,
        name: item.name,
        description: item.description,
        config: parseConfig(item.config),
        created_by: item.created_by,
        created_at: item.created_at,
        updated_at: item.updated_at,
        is_public: item.is_public,
        is_default: item.is_default,
      }));
      
      setTemplates(parsed);
    } catch (err) {
      console.error('Error fetching templates:', err);
      setError('Impossible de charger les modèles');
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  // Load templates on mount and when user changes
  useEffect(() => {
    if (user?.id) {
      fetchTemplates();
    }
  }, [user?.id, fetchTemplates]);

  // Save a new template
  const saveTemplate = useCallback(async (
    name: string,
    description: string,
    config: EditorTemplate,
    isPublic: boolean
  ): Promise<SavedReportTemplate | null> => {
    if (!user?.id) {
      toast({
        title: 'Erreur',
        description: 'Vous devez être connecté pour sauvegarder un modèle',
        variant: 'destructive',
      });
      return null;
    }
    
    setIsSaving(true);
    setError(null);
    
    try {
      // If public, automatically set as default
      const { data, error: insertError } = await supabase
        .from('report_templates')
        .insert({
          name,
          description: description || null,
          config: serializeConfig(config),
          created_by: user.id,
          is_public: isPublic,
          is_default: isPublic, // Public templates become default
        })
        .select()
        .single();
      
      if (insertError) throw insertError;
      
      const newTemplate: SavedReportTemplate = {
        id: data.id,
        name: data.name,
        description: data.description,
        config: parseConfig(data.config),
        created_by: data.created_by,
        created_at: data.created_at,
        updated_at: data.updated_at,
        is_public: data.is_public,
        is_default: data.is_default,
      };
      
      // If this is now default, update local state to reflect that
      if (data.is_default) {
        setTemplates(prev => prev.map(t => ({ ...t, is_default: false })));
      }
      
      setTemplates(prev => [newTemplate, ...prev]);
      
      toast({
        title: 'Modèle sauvegardé',
        description: `Le modèle "${name}" a été enregistré avec succès`,
      });
      
      return newTemplate;
    } catch (err) {
      console.error('Error saving template:', err);
      setError('Impossible de sauvegarder le modèle');
      toast({
        title: 'Erreur',
        description: 'Impossible de sauvegarder le modèle',
        variant: 'destructive',
      });
      return null;
    } finally {
      setIsSaving(false);
    }
  }, [user?.id, toast]);

  // Update an existing template
  const updateTemplate = useCallback(async (
    id: string,
    name: string,
    description: string,
    config: EditorTemplate,
    isPublic: boolean
  ): Promise<boolean> => {
    if (!user?.id) {
      toast({
        title: 'Erreur',
        description: 'Vous devez être connecté pour modifier un modèle',
        variant: 'destructive',
      });
      return false;
    }
    
    setIsSaving(true);
    setError(null);
    
    try {
      // If public, automatically set as default
      const { error: updateError } = await supabase
        .from('report_templates')
        .update({
          name,
          description: description || null,
          config: serializeConfig(config),
          is_public: isPublic,
          is_default: isPublic, // Public templates become default
        })
        .eq('id', id)
        .eq('created_by', user.id); // Ensure user owns the template
      
      if (updateError) throw updateError;
      
      // Update local state - if this becomes default, unset others
      setTemplates(prev => prev.map(t => {
        if (t.id === id) {
          return {
            ...t,
            name,
            description,
            config: {
              ...config,
              updatedAt: new Date(),
            },
            is_public: isPublic,
            is_default: isPublic,
            updated_at: new Date().toISOString(),
          };
        }
        // If the updated template is now default, unset other defaults
        if (isPublic && t.is_default) {
          return { ...t, is_default: false };
        }
        return t;
      }));
      
      toast({
        title: 'Modèle mis à jour',
        description: `Le modèle "${name}" a été modifié avec succès`,
      });
      
      return true;
    } catch (err) {
      console.error('Error updating template:', err);
      setError('Impossible de mettre à jour le modèle');
      toast({
        title: 'Erreur',
        description: 'Impossible de mettre à jour le modèle',
        variant: 'destructive',
      });
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [user?.id, toast]);

  // Delete a template
  const deleteTemplate = useCallback(async (id: string): Promise<boolean> => {
    if (!user?.id) {
      toast({
        title: 'Erreur',
        description: 'Vous devez être connecté pour supprimer un modèle',
        variant: 'destructive',
      });
      return false;
    }
    
    try {
      const { error: deleteError } = await supabase
        .from('report_templates')
        .delete()
        .eq('id', id)
        .eq('created_by', user.id); // Ensure user owns the template
      
      if (deleteError) throw deleteError;
      
      setTemplates(prev => prev.filter(t => t.id !== id));
      
      toast({
        title: 'Modèle supprimé',
        description: 'Le modèle a été supprimé avec succès',
      });
      
      return true;
    } catch (err) {
      console.error('Error deleting template:', err);
      toast({
        title: 'Erreur',
        description: 'Impossible de supprimer le modèle',
        variant: 'destructive',
      });
      return false;
    }
  }, [user?.id, toast]);

  // Load a specific template by ID
  const loadTemplate = useCallback((id: string): SavedReportTemplate | undefined => {
    return templates.find(t => t.id === id);
  }, [templates]);

  // Get the default template (public template marked as default)
  const getDefaultTemplate = useCallback((): SavedReportTemplate | null => {
    return templates.find(t => t.is_default && t.is_public) || null;
  }, [templates]);

  // Computed default template
  const defaultTemplate = templates.find(t => t.is_default && t.is_public) || null;

  return {
    templates,
    defaultTemplate,
    isLoading,
    isSaving,
    error,
    fetchTemplates,
    saveTemplate,
    updateTemplate,
    deleteTemplate,
    loadTemplate,
    getDefaultTemplate,
  };
}

// Keep the old export for backward compatibility with ReportBuilder
export interface ReportTemplate {
  id: string;
  name: string;
  description: string | null;
  config: Record<string, unknown>;
  created_by: string;
  created_at: string;
  updated_at: string;
  is_public: boolean;
}

// Stub for the ReportBuilder TemplateManager (disabled - no DB table for ReportConfig)
export function useReportTemplates() {
  return {
    templates: [] as ReportTemplate[],
    isLoading: false,
    isSaving: false,
    error: null,
    fetchTemplates: async () => {},
    saveTemplate: async () => null,
    updateTemplate: async () => false,
    deleteTemplate: async () => false,
    loadTemplate: () => undefined,
  };
}
