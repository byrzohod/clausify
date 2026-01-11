import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Key, Info } from 'lucide-react';
import type { KeyTerm } from '@/types';

interface KeyTermsCardProps {
  keyTerms: KeyTerm[];
}

const importanceConfig = {
  high: {
    variant: 'destructive' as const,
    label: 'Important',
  },
  medium: {
    variant: 'secondary' as const,
    label: 'Notable',
  },
  low: {
    variant: 'outline' as const,
    label: 'Info',
  },
};

export function KeyTermsCard({ keyTerms }: KeyTermsCardProps) {
  const sortedTerms = [...keyTerms].sort((a, b) => {
    const order = { high: 0, medium: 1, low: 2 };
    return order[a.importance] - order[b.importance];
  });

  return (
    <Card data-testid="key-terms-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl">
          <Key className="h-5 w-5" />
          Key Terms
        </CardTitle>
        <CardDescription>
          {keyTerms.length === 0
            ? 'No key terms identified'
            : `${keyTerms.length} important term${keyTerms.length === 1 ? '' : 's'} identified`}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {keyTerms.length === 0 ? (
          <div className="flex items-center justify-center rounded-lg border-2 border-dashed py-8 text-muted-foreground">
            <div className="text-center">
              <Key className="mx-auto mb-2 h-8 w-8" />
              <p>No specific key terms were identified.</p>
            </div>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {sortedTerms.map((term, index) => {
              const config = importanceConfig[term.importance];

              return (
                <div
                  key={index}
                  className="rounded-lg border bg-card p-3 transition-colors hover:bg-accent/50"
                >
                  <div className="mb-1 flex items-start justify-between gap-2">
                    <span className="text-sm font-medium">{term.term}</span>
                    <Badge
                      variant={config.variant}
                      className="shrink-0 text-xs"
                    >
                      {config.label}
                    </Badge>
                  </div>

                  <p className="text-sm text-muted-foreground">{term.value}</p>

                  {term.explanation && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button className="mt-2 flex items-center gap-1 text-xs text-primary hover:underline">
                            <Info className="h-3 w-3" />
                            What does this mean?
                          </button>
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs">
                          <p>{term.explanation}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
