'use client';

import { useState } from 'react';
import { Save, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';

const CONTRACT_TYPES = [
  { value: 'NDA', label: 'NDA' },
  { value: 'EMPLOYMENT', label: 'Employment' },
  { value: 'LEASE', label: 'Lease' },
  { value: 'SERVICE', label: 'Service' },
  { value: 'FREELANCE', label: 'Freelance' },
  { value: 'SALES', label: 'Sales' },
  { value: 'PARTNERSHIP', label: 'Partnership' },
  { value: 'LICENSE', label: 'License' },
  { value: 'LOAN', label: 'Loan' },
  { value: 'OTHER', label: 'Other' },
];

interface SaveTemplateDialogProps {
  content: string;
  fileName?: string;
  onSaved?: (templateId: string) => void;
  trigger?: React.ReactNode;
}

export function SaveTemplateDialog({
  content,
  fileName,
  onSaved,
  trigger,
}: SaveTemplateDialogProps) {
  const [open, setOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [name, setName] = useState(fileName?.replace(/\.[^/.]+$/, '') || '');
  const [description, setDescription] = useState('');
  const [contractType, setContractType] = useState<string>('OTHER');

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error('Please enter a template name');
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch('/api/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || undefined,
          contractType,
          content,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save template');
      }

      const data = await response.json();
      toast.success('Template saved successfully');
      setOpen(false);
      onSaved?.(data.template.id);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to save template'
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <Save className="mr-2 h-4 w-4" />
            Save as Template
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Save as Template</DialogTitle>
          <DialogDescription>
            Save this contract as a template for future comparisons
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Template Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Standard NDA v2"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (optional)</Label>
            <Input
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of this template"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="contractType">Contract Type</Label>
            <Select value={contractType} onValueChange={setContractType}>
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                {CONTRACT_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Template
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
