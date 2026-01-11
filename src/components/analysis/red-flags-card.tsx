import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { AlertTriangle, AlertCircle, Info, Lightbulb } from 'lucide-react';
import type { RedFlag } from '@/types';

interface RedFlagsCardProps {
  redFlags: RedFlag[];
}

const severityConfig = {
  high: {
    icon: AlertTriangle,
    variant: 'destructive' as const,
    label: 'High',
    bgColor: 'bg-red-50 dark:bg-red-950/20',
    borderColor: 'border-red-200 dark:border-red-900',
  },
  medium: {
    icon: AlertCircle,
    variant: 'warning' as const,
    label: 'Medium',
    bgColor: 'bg-yellow-50 dark:bg-yellow-950/20',
    borderColor: 'border-yellow-200 dark:border-yellow-900',
  },
  low: {
    icon: Info,
    variant: 'secondary' as const,
    label: 'Low',
    bgColor: 'bg-blue-50 dark:bg-blue-950/20',
    borderColor: 'border-blue-200 dark:border-blue-900',
  },
};

export function RedFlagsCard({ redFlags }: RedFlagsCardProps) {
  const sortedFlags = [...redFlags].sort((a, b) => {
    const order = { high: 0, medium: 1, low: 2 };
    return order[a.severity] - order[b.severity];
  });

  const highCount = redFlags.filter((f) => f.severity === 'high').length;
  const mediumCount = redFlags.filter((f) => f.severity === 'medium').length;

  return (
    <Card data-testid="red-flags-card">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-xl">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Red Flags & Concerns
            </CardTitle>
            <CardDescription className="mt-1">
              {redFlags.length === 0
                ? 'No significant concerns identified'
                : `${redFlags.length} item${redFlags.length === 1 ? '' : 's'} require${redFlags.length === 1 ? 's' : ''} attention`}
            </CardDescription>
          </div>
          {redFlags.length > 0 && (
            <div className="flex gap-1">
              {highCount > 0 && (
                <Badge variant="destructive">{highCount} High</Badge>
              )}
              {mediumCount > 0 && (
                <Badge variant="warning">{mediumCount} Medium</Badge>
              )}
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {redFlags.length === 0 ? (
          <div className="flex items-center justify-center rounded-lg border-2 border-dashed py-8 text-muted-foreground">
            <div className="text-center">
              <Info className="mx-auto mb-2 h-8 w-8" />
              <p>No red flags detected in this contract.</p>
              <p className="text-sm">
                However, we recommend having a lawyer review any important
                agreements.
              </p>
            </div>
          </div>
        ) : (
          <Accordion type="multiple" className="space-y-2">
            {sortedFlags.map((flag, index) => {
              const config = severityConfig[flag.severity];
              const Icon = config.icon;

              return (
                <AccordionItem
                  key={index}
                  value={`flag-${index}`}
                  className={`rounded-lg border ${config.borderColor} ${config.bgColor}`}
                >
                  <AccordionTrigger className="px-4 hover:no-underline">
                    <div className="flex items-center gap-3 text-left">
                      <Icon className="h-5 w-5 shrink-0" />
                      <div className="flex-1">
                        <span className="font-medium">{flag.title}</span>
                        <Badge
                          variant={config.variant}
                          className="ml-2 text-xs"
                        >
                          {config.label}
                        </Badge>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-4 pb-4">
                    <div className="space-y-3 pl-8">
                      <p className="text-sm">{flag.description}</p>

                      {flag.clause && (
                        <div className="rounded border bg-background/50 p-3">
                          <p className="mb-1 text-xs font-medium text-muted-foreground">
                            Relevant Clause:
                          </p>
                          <p className="text-sm italic">&quot;{flag.clause}&quot;</p>
                        </div>
                      )}

                      {flag.suggestion && (
                        <div className="flex items-start gap-2 rounded bg-primary/5 p-3">
                          <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                          <div>
                            <p className="text-xs font-medium text-primary">
                              Suggestion
                            </p>
                            <p className="text-sm">{flag.suggestion}</p>
                          </div>
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
