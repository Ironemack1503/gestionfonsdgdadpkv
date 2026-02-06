/**
 * Template Manager Component
 * Save, load, and manage report templates
 * Note: This component is for the ReportBuilder which uses a different config structure
 * The database integration is disabled pending table structure updates
 */

import { useState } from 'react';
import {
  Save,
  FolderOpen,
  Trash2,
  Globe,
  Lock,
  Clock,
  User,
  Loader2,
  FileText,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useLocalAuth } from '@/contexts/LocalAuthContext';
import type { ReportConfig } from './types';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';

// Local template type for ReportBuilder
interface LocalReportTemplate {
  id: string;
  name: string;
  description: string | null;
  config: ReportConfig;
  created_by: string;
  created_at: string;
  updated_at: string;
  is_public: boolean;
}

interface TemplateManagerProps {
  currentConfig: ReportConfig;
  onLoadTemplate: (config: ReportConfig) => void;
  currentTemplateId?: string;
  onTemplateIdChange: (id: string | undefined) => void;
}

export function TemplateManager({
  currentConfig,
  onLoadTemplate,
  currentTemplateId,
  onTemplateIdChange,
}: TemplateManagerProps) {
  const { user } = useLocalAuth();
  const { toast } = useToast();
  
  // Local state - templates stored in localStorage for now
  const [templates, setTemplates] = useState<LocalReportTemplate[]>(() => {
    try {
      const saved = localStorage.getItem('report_builder_templates');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [isLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false);
  const [isLoadDialogOpen, setIsLoadDialogOpen] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [templateDescription, setTemplateDescription] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [isUpdateMode, setIsUpdateMode] = useState(false);

  // Save templates to localStorage
  const saveToStorage = (newTemplates: LocalReportTemplate[]) => {
    localStorage.setItem('report_builder_templates', JSON.stringify(newTemplates));
    setTemplates(newTemplates);
  };

  // Open save dialog
  const handleOpenSaveDialog = (update: boolean = false) => {
    setIsUpdateMode(update);
    if (update && currentTemplateId) {
      const current = templates.find(t => t.id === currentTemplateId);
      if (current) {
        setTemplateName(current.name);
        setTemplateDescription(current.description || '');
        setIsPublic(current.is_public);
      }
    } else {
      setTemplateName(currentConfig.name || 'Nouveau modèle');
      setTemplateDescription(currentConfig.description || '');
      setIsPublic(false);
    }
    setIsSaveDialogOpen(true);
  };

  // Save or update template
  const handleSave = async () => {
    if (!templateName.trim()) return;

    setIsSaving(true);
    
    try {
      if (isUpdateMode && currentTemplateId) {
        // Update existing
        const updated = templates.map(t => {
          if (t.id === currentTemplateId) {
            return {
              ...t,
              name: templateName,
              description: templateDescription,
              config: currentConfig,
              is_public: isPublic,
              updated_at: new Date().toISOString(),
            };
          }
          return t;
        });
        saveToStorage(updated);
        toast({ title: 'Modèle mis à jour', description: `Le modèle "${templateName}" a été modifié` });
      } else {
        // Create new
        const newTemplate: LocalReportTemplate = {
          id: crypto.randomUUID(),
          name: templateName,
          description: templateDescription,
          config: currentConfig,
          created_by: user?.id || 'local',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          is_public: isPublic,
        };
        saveToStorage([newTemplate, ...templates]);
        onTemplateIdChange(newTemplate.id);
        toast({ title: 'Modèle sauvegardé', description: `Le modèle "${templateName}" a été enregistré` });
      }
      setIsSaveDialogOpen(false);
    } finally {
      setIsSaving(false);
    }
  };

  // Load a template
  const handleLoadTemplate = (template: LocalReportTemplate) => {
    // Parse dates back from strings
    const config: ReportConfig = {
      ...template.config,
      createdAt: new Date(template.config.createdAt),
      updatedAt: new Date(template.config.updatedAt),
    };
    onLoadTemplate(config);
    onTemplateIdChange(template.id);
    setIsLoadDialogOpen(false);
  };

  // Delete a template
  const handleDeleteTemplate = async (id: string) => {
    const updated = templates.filter(t => t.id !== id);
    saveToStorage(updated);
    if (currentTemplateId === id) {
      onTemplateIdChange(undefined);
    }
    toast({ title: 'Modèle supprimé', description: 'Le modèle a été supprimé' });
  };

  // Check if user owns the template
  const isOwner = (template: LocalReportTemplate) => template.created_by === user?.id || template.created_by === 'local';

  return (
    <div className="flex items-center gap-2">
      {/* Save Button */}
      <Dialog open={isSaveDialogOpen} onOpenChange={setIsSaveDialogOpen}>
        <DialogTrigger asChild>
          <Button
            variant="default"
            size="sm"
            onClick={() => handleOpenSaveDialog(false)}
          >
            <Save className="w-4 h-4 mr-1" />
            Sauvegarder
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {isUpdateMode ? 'Mettre à jour le modèle' : 'Sauvegarder le modèle'}
            </DialogTitle>
            <DialogDescription>
              {isUpdateMode
                ? 'Mettez à jour les informations du modèle'
                : 'Enregistrez cette configuration comme modèle réutilisable'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="template-name">Nom du modèle *</Label>
              <Input
                id="template-name"
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                placeholder="Ex: Rapport mensuel recettes"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="template-description">Description</Label>
              <Textarea
                id="template-description"
                value={templateDescription}
                onChange={(e) => setTemplateDescription(e.target.value)}
                placeholder="Description optionnelle du modèle..."
                rows={3}
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="is-public">Modèle public</Label>
                <p className="text-xs text-muted-foreground">
                  Rendre ce modèle visible à tous les utilisateurs
                </p>
              </div>
              <Switch
                id="is-public"
                checked={isPublic}
                onCheckedChange={setIsPublic}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSaveDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleSave} disabled={!templateName.trim() || isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Enregistrement...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  {isUpdateMode ? 'Mettre à jour' : 'Enregistrer'}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Update Button (only if editing existing template) */}
      {currentTemplateId && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleOpenSaveDialog(true)}
        >
          <Save className="w-4 h-4 mr-1" />
          Mettre à jour
        </Button>
      )}

      {/* Load Button */}
      <Dialog open={isLoadDialogOpen} onOpenChange={setIsLoadDialogOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm">
            <FolderOpen className="w-4 h-4 mr-1" />
            Charger
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Charger un modèle</DialogTitle>
            <DialogDescription>
              Sélectionnez un modèle de rapport à charger
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : templates.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Aucun modèle enregistré</p>
                <p className="text-sm">Créez votre premier modèle en cliquant sur "Sauvegarder"</p>
              </div>
            ) : (
              <ScrollArea className="h-[400px] pr-4">
                <div className="space-y-3">
                  {templates.map((template) => (
                    <Card
                      key={template.id}
                      className={`cursor-pointer transition-colors hover:bg-accent/50 ${
                        currentTemplateId === template.id ? 'ring-2 ring-primary' : ''
                      }`}
                      onClick={() => handleLoadTemplate(template)}
                    >
                      <CardHeader className="pb-2">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <CardTitle className="text-sm font-medium truncate">
                              {template.name}
                            </CardTitle>
                            {template.description && (
                              <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                                {template.description}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant={template.is_public ? 'default' : 'secondary'} className="shrink-0">
                              {template.is_public ? (
                                <>
                                  <Globe className="w-3 h-3 mr-1" />
                                  Public
                                </>
                              ) : (
                                <>
                                  <Lock className="w-3 h-3 mr-1" />
                                  Privé
                                </>
                              )}
                            </Badge>
                            {isOwner(template) && (
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-destructive hover:text-destructive"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent onClick={(e) => e.stopPropagation()}>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Supprimer le modèle ?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Cette action est irréversible. Le modèle "{template.name}" sera définitivement supprimé.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Annuler</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleDeleteTemplate(template.id);
                                      }}
                                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    >
                                      Supprimer
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            )}
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {format(new Date(template.updated_at), 'dd MMM yyyy', { locale: fr })}
                          </span>
                          <span className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            {isOwner(template) ? 'Moi' : 'Partagé'}
                          </span>
                          <span>
                            {template.config.selectedFields?.length || 0} champs
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
