/**
 * Template Save Dialog Component
 * Dialog for saving/updating report templates
 */

import { useState, useEffect } from 'react';
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
  Check,
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
import { useSavedReportTemplates, SavedReportTemplate } from '@/hooks/useReportTemplates';
import { useLocalAuth } from '@/contexts/LocalAuthContext';
import type { ReportTemplate as EditorTemplate } from './types';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface TemplateSaveDialogProps {
  currentTemplate: EditorTemplate;
  currentTemplateId: string | null;
  onTemplateIdChange: (id: string | null) => void;
  onLoadTemplate: (template: EditorTemplate) => void;
}

export function TemplateSaveDialog({
  currentTemplate,
  currentTemplateId,
  onTemplateIdChange,
  onLoadTemplate,
}: TemplateSaveDialogProps) {
  const { user } = useLocalAuth();
  const {
    templates,
    defaultTemplate,
    isLoading,
    isSaving,
    saveTemplate,
    updateTemplate,
    deleteTemplate,
  } = useSavedReportTemplates();

  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false);
  const [isLoadDialogOpen, setIsLoadDialogOpen] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [templateDescription, setTemplateDescription] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [isUpdateMode, setIsUpdateMode] = useState(false);

  // Reset form when dialog opens
  useEffect(() => {
    if (isSaveDialogOpen) {
      if (isUpdateMode && currentTemplateId) {
        const current = templates.find(t => t.id === currentTemplateId);
        if (current) {
          setTemplateName(current.name);
          setTemplateDescription(current.description || '');
          setIsPublic(current.is_public);
        }
      } else {
        setTemplateName(currentTemplate.name || 'Nouveau modèle');
        setTemplateDescription(currentTemplate.description || '');
        setIsPublic(false);
      }
    }
  }, [isSaveDialogOpen, isUpdateMode, currentTemplateId, templates, currentTemplate]);

  // Handle save
  const handleSave = async () => {
    if (!templateName.trim()) return;

    if (isUpdateMode && currentTemplateId) {
      const success = await updateTemplate(
        currentTemplateId,
        templateName,
        templateDescription,
        currentTemplate,
        isPublic
      );
      if (success) {
        setIsSaveDialogOpen(false);
      }
    } else {
      const newTemplate = await saveTemplate(
        templateName,
        templateDescription,
        currentTemplate,
        isPublic
      );
      if (newTemplate) {
        onTemplateIdChange(newTemplate.id);
        setIsSaveDialogOpen(false);
      }
    }
  };

  // Handle load
  const handleLoadTemplate = (template: SavedReportTemplate) => {
    onLoadTemplate(template.config);
    onTemplateIdChange(template.id);
    setIsLoadDialogOpen(false);
  };

  // Handle delete
  const handleDeleteTemplate = async (id: string) => {
    await deleteTemplate(id);
    if (currentTemplateId === id) {
      onTemplateIdChange(null);
    }
  };

  // Check if user owns a template
  const isOwner = (template: SavedReportTemplate) => template.created_by === user?.id;

  // Get current template info
  const currentSavedTemplate = currentTemplateId 
    ? templates.find(t => t.id === currentTemplateId) 
    : null;

  return (
    <div className="flex items-center gap-2">
      {/* Save Button */}
      <Dialog open={isSaveDialogOpen} onOpenChange={setIsSaveDialogOpen}>
        <DialogTrigger asChild>
          <Button
            variant="default"
            size="sm"
            onClick={() => setIsUpdateMode(false)}
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
                <Label htmlFor="is-public">Modèle public (par défaut)</Label>
                <p className="text-xs text-muted-foreground">
                  Rendre ce modèle visible et le définir comme modèle par défaut pour tous les utilisateurs
                </p>
              </div>
              <Switch
                id="is-public"
                checked={isPublic}
                onCheckedChange={setIsPublic}
              />
            </div>
            {isPublic && (
              <div className="bg-primary/10 border border-primary/20 rounded-md p-3 text-sm text-primary">
                ⚠️ Ce modèle deviendra automatiquement le modèle par défaut pour tous les utilisateurs.
              </div>
            )}
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
      {currentSavedTemplate && isOwner(currentSavedTemplate) && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setIsUpdateMode(true);
            setIsSaveDialogOpen(true);
          }}
        >
          <Check className="w-4 h-4 mr-1" />
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
                            {template.is_default && (
                              <Badge variant="outline" className="shrink-0 border-primary text-primary">
                                Par défaut
                              </Badge>
                            )}
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
                            {template.config.columns?.length || 0} colonnes
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

      {/* Current template indicator */}
      {currentSavedTemplate && (
        <Badge variant="outline" className="text-xs">
          <FileText className="w-3 h-3 mr-1" />
          {currentSavedTemplate.name}
        </Badge>
      )}
    </div>
  );
}
