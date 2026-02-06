/**
 * Footer Editor Component
 * Edit the footer text and configuration for DGDA reports
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { ReportFooter } from './types';

interface FooterEditorProps {
  footer: ReportFooter;
  onChange: (footer: ReportFooter) => void;
}

export function FooterEditor({ footer, onChange }: FooterEditorProps) {
  const handleChange = (key: keyof ReportFooter, value: string | boolean) => {
    onChange({ ...footer, [key]: value });
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium">Pied de page</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="slogan" className="text-xs text-muted-foreground">Slogan</Label>
          <Textarea
            id="slogan"
            value={footer.slogan}
            onChange={(e) => handleChange('slogan', e.target.value)}
            className="min-h-[60px] text-sm resize-none"
            placeholder="Toujours davantage..."
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="address" className="text-xs text-muted-foreground">Adresse</Label>
          <Input
            id="address"
            value={footer.address}
            onChange={(e) => handleChange('address', e.target.value)}
            className="h-9 text-sm"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="contact" className="text-xs text-muted-foreground">Contact (Tél./Fax/NIF)</Label>
          <Input
            id="contact"
            value={footer.contact}
            onChange={(e) => handleChange('contact', e.target.value)}
            className="h-9 text-sm"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="email" className="text-xs text-muted-foreground">Email / Site web</Label>
          <Input
            id="email"
            value={footer.email}
            onChange={(e) => handleChange('email', e.target.value)}
            className="h-9 text-sm"
          />
        </div>
        
        <div className="flex items-center justify-between pt-2">
          <Label htmlFor="showPageNumbers" className="text-sm">Afficher numéros de page</Label>
          <Switch
            id="showPageNumbers"
            checked={footer.showPageNumbers}
            onCheckedChange={(checked) => handleChange('showPageNumbers', checked)}
          />
        </div>
      </CardContent>
    </Card>
  );
}
