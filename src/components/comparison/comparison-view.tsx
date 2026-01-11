'use client';

import { FileText, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { ComparisonContract } from '@/types';

interface ComparisonViewProps {
  left: ComparisonContract | null;
  right: ComparisonContract | null;
  isLoading?: boolean;
  leftLabel?: string;
  rightLabel?: string;
}

export function ComparisonView({
  left,
  right,
  isLoading = false,
  leftLabel = 'First Contract',
  rightLabel = 'Second Contract',
}: ComparisonViewProps) {
  if (isLoading) {
    return (
      <div
        className="flex h-96 items-center justify-center"
        data-testid="comparison-loading"
      >
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Processing contracts...</span>
      </div>
    );
  }

  if (!left && !right) {
    return (
      <div
        className="flex h-96 flex-col items-center justify-center text-center"
        data-testid="comparison-empty"
      >
        <FileText className="mb-4 h-12 w-12 text-muted-foreground" />
        <h3 className="mb-2 font-medium">No contracts to compare</h3>
        <p className="text-sm text-muted-foreground">
          Upload two contracts above to see them side by side
        </p>
      </div>
    );
  }

  return (
    <div
      className="grid gap-4 md:grid-cols-2"
      data-testid="comparison-view"
    >
      {/* Left Contract */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <FileText className="h-5 w-5" />
            {leftLabel}
          </CardTitle>
          {left && (
            <p className="text-sm text-muted-foreground">{left.fileName}</p>
          )}
        </CardHeader>
        <CardContent>
          {left ? (
            <div className="h-[500px] overflow-auto rounded-md border p-4">
              <pre
                className="whitespace-pre-wrap text-sm"
                data-testid="left-contract-text"
              >
                {left.text}
              </pre>
            </div>
          ) : (
            <div className="flex h-[500px] items-center justify-center rounded-md border bg-muted/50">
              <p className="text-sm text-muted-foreground">
                No contract uploaded
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Right Contract */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <FileText className="h-5 w-5" />
            {rightLabel}
          </CardTitle>
          {right && (
            <p className="text-sm text-muted-foreground">{right.fileName}</p>
          )}
        </CardHeader>
        <CardContent>
          {right ? (
            <div className="h-[500px] overflow-auto rounded-md border p-4">
              <pre
                className="whitespace-pre-wrap text-sm"
                data-testid="right-contract-text"
              >
                {right.text}
              </pre>
            </div>
          ) : (
            <div className="flex h-[500px] items-center justify-center rounded-md border bg-muted/50">
              <p className="text-sm text-muted-foreground">
                No contract uploaded
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
