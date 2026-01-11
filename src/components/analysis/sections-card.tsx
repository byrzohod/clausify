import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { FileText, AlertCircle } from 'lucide-react';
import type { ContractSection } from '@/types';

interface SectionsCardProps {
  sections: ContractSection[];
}

export function SectionsCard({ sections }: SectionsCardProps) {
  return (
    <Card data-testid="sections-card" role="region" aria-label="Contract sections explained">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl" id="sections-title">
          <FileText className="h-5 w-5" aria-hidden="true" />
          Contract Sections Explained
        </CardTitle>
        <CardDescription>
          {sections.length === 0
            ? 'No sections identified'
            : `${sections.length} section${sections.length === 1 ? '' : 's'} analyzed`}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {sections.length === 0 ? (
          <div className="flex items-center justify-center rounded-lg border-2 border-dashed py-8 text-muted-foreground">
            <div className="text-center">
              <FileText className="mx-auto mb-2 h-8 w-8" />
              <p>No specific sections were identified.</p>
            </div>
          </div>
        ) : (
          <Accordion type="single" collapsible className="space-y-2">
            {sections.map((section, index) => {
              const hasConcerns =
                section.concerns && section.concerns.length > 0;

              return (
                <AccordionItem
                  key={index}
                  value={`section-${index}`}
                  className="rounded-lg border bg-card"
                >
                  <AccordionTrigger className="px-4 hover:no-underline">
                    <div className="flex items-center gap-3 text-left">
                      <span className="font-medium">{section.title}</span>
                      {hasConcerns && (
                        <Badge variant="warning" className="text-xs">
                          <AlertCircle className="mr-1 h-3 w-3" />
                          {section.concerns!.length} concern
                          {section.concerns!.length !== 1 ? 's' : ''}
                        </Badge>
                      )}
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-4 pb-4">
                    <div className="space-y-4">
                      <div>
                        <h5 className="mb-1 text-sm font-medium text-muted-foreground">
                          Plain English Summary
                        </h5>
                        <p className="text-sm">{section.summary}</p>
                      </div>

                      {section.originalText && (
                        <div>
                          <h5 className="mb-1 text-sm font-medium text-muted-foreground">
                            Original Text
                          </h5>
                          <p className="rounded border bg-muted/50 p-2 text-sm italic">
                            &quot;{section.originalText}&quot;
                          </p>
                        </div>
                      )}

                      {hasConcerns && (
                        <div>
                          <h5 className="mb-2 flex items-center gap-1 text-sm font-medium text-warning">
                            <AlertCircle className="h-4 w-4" />
                            Concerns to Consider
                          </h5>
                          <ul className="space-y-1 pl-4">
                            {section.concerns!.map((concern, i) => (
                              <li
                                key={i}
                                className="list-disc text-sm text-muted-foreground"
                              >
                                {concern}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        )}
      </CardContent>
    </Card>
  );
}
