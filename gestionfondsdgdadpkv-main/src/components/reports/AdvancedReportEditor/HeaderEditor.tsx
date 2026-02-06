/**
 * Header Editor Component
 * Edit the header text and configuration for DGDA reports
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ReportHeader } from './types';

interface HeaderEditorProps {
  header: ReportHeader;
  onChange: (header: ReportHeader) => void;
}

export function HeaderEditor({ header, onChange }: HeaderEditorProps) {
  const handleChange = (key: keyof ReportHeader, value: string | boolean) => {
    onChange({ ...header, [key]: value });
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium">En-tête du document</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="line1" className="text-xs text-muted-foreground">Ligne 1 (Pays)</Label>
          <Input
            id="line1"
            value={header.line1}
            onChange={(e) => handleChange('line1', e.target.value)}
            className="h-9 text-sm"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="line2" className="text-xs text-muted-foreground">Ligne 2 (Ministère)</Label>
          <Input
            id="line2"
            value={header.line2}
            onChange={(e) => handleChange('line2', e.target.value)}
            className="h-9 text-sm"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="line3" className="text-xs text-muted-foreground">Ligne 3 (Direction Générale)</Label>
          <Input
            id="line3"
            value={header.line3}
            onChange={(e) => handleChange('line3', e.target.value)}
            className="h-9 text-sm"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="line4" className="text-xs text-muted-foreground">Ligne 4 (Direction Provinciale)</Label>
          <Input
            id="line4"
            value={header.line4}
            onChange={(e) => handleChange('line4', e.target.value)}
            className="h-9 text-sm"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="reference" className="text-xs text-muted-foreground">Numéro de référence</Label>
          <Input
            id="reference"
            value={header.referenceNumber}
            onChange={(e) => handleChange('referenceNumber', e.target.value)}
            placeholder="DGDA/3400/DP/KV/SDAF/.../2022"
            className="h-9 text-sm"
          />
        </div>
        
        <div className="flex items-center justify-between pt-2">
          <Label htmlFor="showLogo" className="text-sm">Afficher le logo</Label>
          <Switch
            id="showLogo"
            checked={header.showLogo}
            onCheckedChange={(checked) => handleChange('showLogo', checked)}
          />
        </div>
        
        {header.showLogo && (
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Position du logo</Label>
            <Select
              value={header.logoPosition}
              onValueChange={(value) => handleChange('logoPosition', value as 'left' | 'center' | 'right')}
            >
              <SelectTrigger className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="left">Gauche</SelectItem>
                <SelectItem value="center">Centre</SelectItem>
                <SelectItem value="right">Droite</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
