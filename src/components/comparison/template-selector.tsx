'use client';

import { useEffect, useState } from 'react';
import { FileText, Loader2, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import type { ContractType } from '@prisma/client';

interface Template {
  id: string;
  name: string;
  description: string | null;
  contractType: ContractType;
  isPublic: boolean;
  createdAt: string;
  userId: string;
}

interface TemplateSelectorProps {
  onSelect: (template: { id: string; name: string; content: string }) => void;
  trigger?: React.ReactNode;
}

export function TemplateSelector({ onSelect, trigger }: TemplateSelectorProps) {
  const [open, setOpen] = useState(false);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (open) {
      fetchTemplates();
    }
  }, [open]);

  const fetchTemplates = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/templates');
      if (response.ok) {
        const data = await response.json();
        setTemplates(data.templates);
      }
    } catch (error) {
      console.error('Failed to fetch templates:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelect = async (template: Template) => {
    try {
      const response = await fetch(`/api/templates/${template.id}`);
      if (response.ok) {
        const data = await response.json();
        onSelect({
          id: data.template.id,
          name: data.template.name,
          content: data.template.content,
        });
        setOpen(false);
      }
    } catch (error) {
      console.error('Failed to fetch template content:', error);
    }
  };

  const filteredTemplates = templates.filter(
    (t) =>
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.contractType.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <FileText className="mr-2 h-4 w-4" />
            Load Template
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Select Template</DialogTitle>
          <DialogDescription>
            Choose a template to compare against your contract
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search templates..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : filteredTemplates.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              {templates.length === 0
                ? 'No templates yet. Save a contract as a template to get started.'
                : 'No templates match your search.'}
            </div>
          ) : (
            <div className="max-h-[400px] space-y-2 overflow-auto">
              {filteredTemplates.map((template) => (
                <button
                  key={template.id}
                  onClick={() => handleSelect(template)}
                  className="flex w-full items-center justify-between rounded-lg border p-4 text-left transition-colors hover:bg-accent"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{template.name}</span>
                      {template.isPublic && (
                        <Badge variant="secondary" className="text-xs">
                          Public
                        </Badge>
                      )}
                    </div>
                    {template.description && (
                      <p className="mt-1 text-sm text-muted-foreground">
                        {template.description}
                      </p>
                    )}
                    <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                      <Badge variant="outline">
                        {template.contractType.replace('_', ' ')}
                      </Badge>
                      <span>
                        {new Date(template.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
